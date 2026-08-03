# TICKET-BACKEND — écarts relevés par l'Integration Gate de la console (AP-INT-0)

**Cible :** `BACKEND` *(services : `platform-catalog-service`, `auth-service`, `prospera-admin-panel-service`, `kyc-service`)*
**Origine :** `AP-INT-0` — bascule des quatre clients de la console sur le vrai backend
**Ouvert le :** 2026-08-03 · **Statut :** ⏳ ouvert, à arbitrer au sprint-planning
**Méthode :** chaque écart est **confronté à l'OpenAPI vivant** du service (stack docker rebâti sur `origin/dev`), jamais déduit d'un tracker

---

## Pourquoi un ticket et pas des stories directes

L'Integration Gate a relevé **dix-huit écarts** entre ce que la console supposait et ce que les
services servent. La grande majorité se corrige **côté front** — c'est le travail d'AP-INT-0, et il
est fait. Ce ticket ne porte que **ce que le front ne peut pas réparer** : ce qui manque au contrat.

Deux d'entre eux sont déjà devenus des stories (`STORY-171`, `STORY-172`) ; ils figurent ici pour que
la liste soit lisible d'un bloc.

---

## Déjà repris — stories créées

| # | Manque | Story | Sprint |
|:--:|---|---|:--:|
| 1 | ⚡ `Organization.vertical` **n'existe nulle part** — ni auth-service, ni catalog, ni BFF. Le mot traverse un an de décisions sans être une donnée | **`STORY-171`** *(5 pts)* | 30 |
| 2 | ⚡ Le **BFF admin n'a AUCUN CORS** — zéro occurrence de `cors` dans son `src/`, aucune variable dans son compose | **`STORY-172`** *(3 pts)* | 20 |

---

## À arbitrer — pas encore de story

### 🔴 A. L'arbitrage N/N-1 du catalogue n'est **pas** un invariant du système

**Service :** `platform-catalog-service` · **Découvert par :** AP-04

`CreateModuleVersionDto` ne porte que `{ version, releasedAt? }`. **Le service n'a ni
`supersedesMajor` ni notion de fenêtre de support.** Le garde-fou « pas de troisième majeure active
sans dépréciation datée », que la console croyait *reproduire* du backend, n'existe **que côté
front**.

**Conséquence :** la règle tient tant qu'on passe par la console. Un appel direct au service la
contourne **sans rien signaler**. Ce n'est donc pas une garantie du système, c'est une politique
d'interface — et personne, en lisant le code du service, ne peut deviner qu'elle existe.

**Second effet :** faute de geste atomique, la console déprécie **puis** crée, en deux appels. Si la
création échoue après la dépréciation, l'ancienne majeure **reste dépréciée** — un état intermédiaire
que rien ne rattrape.

> **À trancher :** porter la règle dans le service *(elle devient opposable, et le geste devient
> atomique)*, ou **assumer par écrit** que c'est une politique d'interface. Les deux se défendent —
> ce qui ne se défend pas, c'est que le front croie appliquer une règle du backend qui n'existe pas.

### 🟠 B. Pas de décompte groupé des entitlements par module

**Service :** `platform-catalog-service` · **Découvert par :** AP-04

`ModuleResponseDto` ne porte pas le nombre d'organisations. La console appelle donc
`entitlements/by-module/:code/summary` **une fois par module**.

C'est **assumé aujourd'hui** — le catalogue compte une dizaine d'entrées. Mais si un jour il en compte
des centaines, la réponse est **une route d'agrégat amont**, pas une boucle plus astucieuse côté
front. À rouvrir à ce moment-là, pas avant.

### 🟠 C. `GET /admin/organizations` ne filtre pas par statut KYC

**Service :** `auth-service` *(et son relais BFF)* · **Découvert par :** AP-02 · ⚠️ **déjà relevé le 2026-07-21, jamais formulé**

`ListOrgsQueryDto` porte `status`, qui vaut `ACTIVE | SUSPENDED` — c'est le statut d'**identité**.
La liste enrichit pourtant chaque ligne d'un `kycStatus`, et **le filtre principal de l'écran AP-02
porte sur le KYC**.

**Conséquence :** filtrer « en attente de revue » est impossible côté serveur. Le faire côté client
casse la pagination : on ne peut pas paginer sur une colonne qu'on filtre après coup.

> **Demande :** ajouter `kycStatus` à `ListOrgsQueryDto`, et le laisser se combiner avec `status`,
> `q` et `ids`.

### 🟠 D. Le BFF ne proxifie pas la revue **pièce par pièce**

**Service :** `prospera-admin-panel-service` · **Découvert par :** AP-03

Le BFF expose `POST /admin/orgs/:orgId/kyc/approve|reject` — la décision **globale** du dossier. Mais
`kyc-service` porte aussi
`POST /admin/kyc/:orgId/documents/:documentId/approve|reject` — la marque **par pièce**, qui est
exactement ce que fait l'écran de revue.

**Conséquence :** la console devrait appeler le BFF pour la décision globale **et** `kyc-service` en
direct pour chaque pièce — deux chemins pour un seul acte métier, et une jointure de droits qui se
joue à deux endroits.

> **À trancher :** proxifier les deux routes de document dans le BFF *(cohérent avec l'arbitrage
> d'AP-INT-0)*, ou acter que la revue par pièce reste en direct — auquel cas il faut le dire dans
> `AP-03`, pas le découvrir à l'implémentation.

### 🟡 E. `EntitlementResponseDto` n'a pas de date d'octroi

**Service :** `platform-catalog-service` · **Découvert par :** AP-05

Le DTO porte `updatedAt` — la date de **dernière modification** — et pas de date d'octroi. L'écran
affiche « Octroyé le … ».

**Conséquence :** un droit octroyé en janvier puis mis à jour en mars s'affiche **« octroyé en
mars »**. C'est faux, et ce n'est pas réparable côté front : l'information n'existe pas.

> **Demande :** ajouter `grantedAt`, distinct d'`updatedAt`.

---

## Écarts qui NE sont PAS dans ce ticket

Ils se corrigent **côté front**, et l'ont été *(ou sont tracés dans la story frontend)* :

`pageSize`→`limit` · `search`→`q` · `organizationId`→`orgId` · `versionCode`→`version` ·
`referentiel` objet éclaté · `PLANNED` jamais envoyé · statut à la création par `PATCH` de suite ·
versions aplaties depuis les modules · `verified` toujours `null` · `SUSPENDED` rendu `REVOKED` ·
`targets` et `referentielFamilies` *(inventions front ; `referentielFamilies` = `STORY-148`)* ·
`KycStatus` divergent et `UNDER_REVIEW` ignoré · `OrgMember.name` inexistant ·
`registrationId`/`memberSince` inventés · date de dépréciation d'un référentiel non demandée par
l'écran.

> ⚡ **Le tri compte autant que la liste.** Un ticket qui mélange « le backend nous doit ça » et
> « on s'est trompés » se fait ignorer en bloc. Ici, tout ce qui pouvait être réparé côté front l'a
> été avant d'écrire une ligne de ce fichier.

---

## Inscription au tracker

À inscrire dans `sprint-status.yaml` → `open_contract_gaps` à l'ouverture du sprint qui les prendra.
⚠️ Un ticket qui n'est pas dans un tracker est **invisible du sprint-planning** — c'est la règle du
dossier, et c'est comme ça que huit stories sont devenues orphelines le 2026-07-31.
