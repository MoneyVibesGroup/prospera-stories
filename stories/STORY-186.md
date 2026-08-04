# STORY-186 : Les **agrégats de la plateforme** — compter sans tout charger

**Epic :** EPIC-025 — RBAC plateforme *(exploitation de la console)*
**Réf. :** **AP-07** *(dashboard plateforme — AC 1 et 2)* · **AP-02** *(les quatre KPI de tête)* · **STORY-047** *(vue agrégée, patron `sources`)* · **STORY-142** *(index inverse : le même besoin, résolu côté catalogue)*
**Découverte par :** revue de la maquette AP-06 confrontée au contrat généré, 2026-08-04
**Priorité :** Should Have
**Story Points :** 5
**Statut :** À faire
**Créée le :** 2026-08-04
**Sprint :** 21
**Service :** `prospera-admin-panel-service` (`:3010`) — 1 dépôt, 1 branche, 1 PR
**Branche :** `MNV-186`

---

## Le constat

**Aucune route ne compte quoi que ce soit.** Ni dans le BFF, ni en amont : `grep dashboard` sur
l'OpenAPI du BFF ne renvoie rien, et le seul agrégat existant est
`entitlements/by-module/:code/summary` — qui compte des organisations **par module**, pas des
organisations **par état**.

Or **deux écrans déjà écrits en dépendent** :

| Écran | Ce qu'il affiche | Ce qu'il a |
|---|---|---|
| **AP-02**, bandeau de tête | 4 KPI sur **tout** le parc : total · KYC en attente · rejetés · comptes suspendus | `total` de la **page courante**, rien d'autre |
| **AP-07**, dashboard *(AC 1 et 2)* | orgs par statut · dossiers KYC en attente · entitlements actifs · santé de la chaîne | **rien** |

**Ce que fait la console faute de mieux :** la maquette calcule ses KPI en balayant les 22
organisations chargées en mémoire. Ça marche à 22. À 2 000, il faudrait **paginer toute la base dans
le navigateur pour afficher quatre nombres** — et les nombres seraient quand même faux, puisque la
liste est filtrée.

> ⚡ **Un compteur faux est pire qu'un compteur absent.** « 3 dossiers en attente » sur une page qui
> en contient 3 sur 40 se lit « il n'y en a que 3 », pas « je ne compte que cette page ». C'est le
> même défaut que l'IP de session de STORY-133 : une donnée fausse **dans un écran de supervision**,
> c'est-à-dire à l'endroit précis où l'on vient chercher un signal.

---

## Pourquoi le BFF, et pas chaque service

C'est **l'arbitrage déjà rendu par AP-INT-0** et il s'applique ici sans discussion : un compte qui
croise trois sources *(identité, KYC, entitlements)* ne se fait pas côté navigateur. Le BFF est
l'agrégateur de la console — c'est sa seule raison d'être.

⚠️ **Corollaire à ne pas contourner :** le BFF **ne compte rien lui-même**, il n'a pas de base. Il
appelle trois amonts et compose. Si un amont ne sait pas compter, la réponse est **une route de
comptage dans cet amont**, pas une boucle dans le BFF. Un `GET /organizations?limit=10000` suivi
d'un `.length` serait un comptage déguisé en lecture, et il tomberait au premier gros client.

---

## Périmètre

### 1. `GET /api/v1/admin/summary`

Une seule route, **tous les compteurs**, pour que le dashboard soit **un** appel et pas six :

```jsonc
{
  "organizations": { "total": 214, "byIdentityStatus": { "ACTIVE": 198, "SUSPENDED": 16 } },
  "kyc":           { "byStatus": { "PENDING_DOCUMENTS": 12, "UNDER_REVIEW": 7,
                                   "INCOMPLETE": 4, "APPROVED": 176, "REJECTED": 15 },
                     "oldestPendingDays": 17 },
  "entitlements":  { "active": 402, "byModule": [ { "moduleCode": "bilan", "count": 143 } ] },
  "sources":       { "identity": "ok", "kyc": "unavailable", "entitlements": "ok" },
  "computedAt":    "2027-04-10T08:12:03.114Z"
}
```

- ⚡ **`sources`, exactement comme `PaginatedAdminOrgsDto`** *(STORY-047)*. Une source muette ne fait
  **pas** échouer la route : elle rend son bloc absent et le dit. Un dashboard qui rend 500 parce que
  `kyc-service` redémarre est un dashboard qui ne sert à rien **précisément quand on en a besoin**.
- ⚡ **`computedAt` est obligatoire.** Ces chiffres viennent de read-models : ils sont *éventuellement*
  cohérents. Afficher un compteur sans sa fraîcheur, c'est promettre un temps réel qu'on ne tient pas.
- **`oldestPendingDays`** est le seul indicateur de « santé de la chaîne » *(AP-07 AC 2)* qui se
  calcule sans instrumentation nouvelle — et c'est le plus parlant : *un client attend depuis
  dix-sept jours.*
- **`INCOMPLETE`** figure au comptage **si STORY-185 est livrée**, sinon la clé est simplement absente
  *(un objet de comptage, pas un enum figé)*.

### 2. Ce qu'il faut aux amonts pour que ce soit tenable

Le BFF compose, il ne balaye pas. Vérifier **avant de coder** que chaque amont sait compter, et
**ouvrir la story manquante** plutôt que de contourner :

| Amont | Besoin | À vérifier |
|---|---|---|
| `auth-service` | orgs par `identityStatus` | `GET /admin/organizations` renvoie `total` — filtrable par `status` ⇒ **2 appels `limit=1` suffisent** |
| `kyc-service` | dossiers par `kycStatus` + le plus ancien | `GET /admin/kyc?status=…` renvoie `total` ⇒ idem. `oldestPendingDays` : ⚠️ **à confirmer** — un tri par `submittedAt` **asc** avec `limit=1` le donne sans route neuve |
| `platform-catalog-service` | entitlements actifs, et par module | ⚡ `by-module/:code/summary` compte **par module** ; **aucun total global**. À trancher : boucle sur le catalogue *(une dizaine d'entrées, assumé — cf. §B du ticket AP-INT-0)* ou route d'agrégat amont |

⚠️ **Si l'un de ces trois besoins n'est pas servi, c'est une story amont — pas un `for` dans le
BFF.** Le tracer et le dire ; ne pas livrer un comptage qui ne tiendra pas la première montée en
charge.

### 3. Autorisation

Permission **`org:read`**. ⚠️ **Pas de permission neuve** : le catalogue est figé *(D15)*, et un
compteur n'est pas une donnée d'une autre nature que la liste qu'il résume. Un opérateur qui peut
lire les organisations peut les compter.

### Hors périmètre

- **Séries temporelles, courbes, historique des compteurs.** AP-07 demande un **état**, pas une
  tendance. Un dashboard qui répond « combien maintenant » est utile ; « combien la semaine
  dernière » est un autre produit, avec un autre stockage.
- **L'activité par opérateur** *(dossiers traités aujourd'hui / cette semaine, par agent)* —
  **STORY-188**. Elle ne se calcule pas ici : elle demande une donnée que `kyc-service` ne stocke pas
  encore.
- **Métriques techniques** *(lag de file, taux d'erreur OCR)*. C'est de l'observabilité, elle a ses
  propres outils — pas une route métier.

---

## Critères d'acceptation

1. `GET /admin/summary` renvoie les trois blocs et **un seul appel** suffit au dashboard.
2. Les compteurs portent sur **tout le parc**, pas sur une page — vérifié sur un jeu > 1 page.
3. ⚡ Un amont indisponible rend son bloc **absent** et `sources[x] != "ok"` ; **la route répond
   quand même 200**. Vérifié en coupant `kyc-service` en docker.
4. `computedAt` est renseigné et la console l'affiche.
5. **403** sans `org:read`.
6. ⚡ **Aucune lecture non bornée** : aucun appel amont avec un `limit` supérieur à ce qui est
   strictement nécessaire au comptage *(revue de code explicite sur ce point)*.
7. `oldestPendingDays` est `null` quand la file est vide — **pas `0`**, qui se lirait « un dossier
   déposé aujourd'hui ».
8. Non-régression : `GET /admin/orgs` et sa pagination sont inchangés.

---

## Definition of Done

- [ ] Les 8 critères vérifiés · `lint` 0 · couverture ≥ 90 %
- [ ] **Vérification docker** : compteurs confrontés à un décompte direct en base — ils **concordent**
- [ ] Les trois besoins amont du §2 sont **vérifiés dans le code**, et tout manque est ouvert en story
      *(pas contourné par une boucle)*
- [ ] ⚡ **AP-02 et AP-07 débloquées** : les quatre KPI de tête cessent d'être calculés sur la page
      courante, et AP-07 a enfin un amont — c'est le signal que la dette est soldée
- [ ] Branche `MNV-186`, PR rebase-mergée sur `dev`

---

## Lié

- **STORY-185** — ajoute `INCOMPLETE` au comptage KYC. Sans elle, les dossiers « à compléter » sont
  comptés comme `UNDER_REVIEW` : **le compteur « en attente de revue » est faux**, et c'est le
  premier chiffre du dashboard.
- **STORY-188** — l'activité par opérateur, le second bloc de l'écran AP-07 côté admin.
