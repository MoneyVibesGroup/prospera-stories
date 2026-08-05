# TICKET-BACKEND — la console est branchée, et **inexerçable faute de données**

**Cible :** `BACKEND` *(services : `platform-catalog-service`, `kyc-service`)* · un point **`OPS`**
**Origine :** campagne de test de **toutes les pages** de la console contre le stack docker réel, 2026-08-05
**Ouvert le :** 2026-08-05 · **Statut :** 🟠 **ouvert**
**Méthode :** ⚡ **chaque constat de ce ticket a été MESURÉ** — jeton `PLATFORM_ADMIN` réel, appels HTTP réels, codes et corps de réponse reproduits ci-dessous. Rien n'est déduit d'une lecture de code.

---

## Ce que cette campagne a établi

La console **parle** au backend : les six pages obtiennent des réponses `2xx` et les traduisent
correctement. Ce n'est plus le sujet. Le sujet est qu'**il n'y a presque rien à leur montrer**, et
que deux écrans sur six ne peuvent pas être exercés du tout.

> ⚠️ **Ce ticket ne demande pas des fonctionnalités, il demande de la matière.** C'est une catégorie
> de manque que les tests de contrat ne voient jamais : un endpoint qui répond `200 []` est
> parfaitement conforme, et parfaitement inutilisable.

### Résultats page par page — 2026-08-05, base de développement

| Page | Appel | Mesure |
|---|---|---|
| `/login` | `POST /auth/login` | ✅ 200 — l'administrateur est semé, le jeton porte `PLATFORM_ADMIN` |
| `/organisations` | BFF `GET /admin/orgs` | ✅ 200 — **44 organisations** |
| `/organisations` | BFF `?status=SUSPENDED` | ✅ 200 |
| `/organisations` *(onglet file)* | BFF `GET /admin/kyc-reviews` | ⚠️ 200 — `{"items":[],"total":0}` |
| `/organisations/:id` | BFF `GET /admin/orgs/:id` | ✅ 200 — identité + membres |
| `/organisations/:id` | `GET /catalog/entitlements/:orgId` | ✅ 200 — `[]` |
| `/organisations/:id/revue` | `GET /admin/kyc/:orgId` | ⚠️ **404** « Dossier KYC introuvable. » |
| `/organisations/:id/revue` | `GET /admin/kyc?status=UNDER_REVIEW` | ⚠️ 200 — `[]` |
| `/catalogue` | `GET /catalog/admin/modules` | ⚠️ 200 — **un seul module**, `versions: []` |
| `/catalogue` | `GET /catalog/admin/referentiels` | ⚠️ 200 — `[]` |
| `/catalogue` | `GET /catalog/entitlements/by-module/bilan/summary` | ✅ 200 — `{"total":1,...}` |

---

## 🔴 A. Le catalogue ne permet **aucun octroi** — mesuré, pas supposé

**Service :** `platform-catalog-service` · **Écran bloqué :** AP-05 *(et AP-06, qui en dépend)*

Le catalogue contient **un module, `bilan`, dont le tableau `versions` est VIDE**, et **aucun
référentiel**. Or `UpsertEntitlementDto` documente que « la cohérence de `versionCode` et
`referentiel` contre le catalogue est vérifiée par le service ». Conséquence testée :

```
PUT /api/v1/catalog/entitlements/6a6336a9ee84f0ca56ad5a84/bilan
    {"versionCode":"2.0"}

→ 422 Unprocessable Entity
  "Octroi impossible : la version « bilan@2.0 » est inexistante ou RETIRED au catalogue."
```

**⇒ Aucun entitlement ne peut être octroyé par la console, quelle que soit la saisie.** L'écran
d'octroi d'AP-05 est complet et fonctionnel ; il n'a simplement aucune version à proposer.

**Second effet, plus gênant :** la **boucle DG-1** — l'admin octroie un module, il s'allume chez le
cabinet — est la démonstration centrale du produit. Elle n'est pas démontrable aujourd'hui, et
**`FE-017` reste bloquée** pour cette raison, pas pour celle qui est inscrite au tracker.

### ⚠️ Une incohérence relevée au passage, à trancher

Un entitlement **`ACTIVE` existe** sur `bilan@2.0` *(org `6a6105a9ac94004d9a0b6d01`, mis à jour le
2026-07-22)* — vérifié par `GET /catalog/entitlements/by-module/bilan`. Il référence donc une
version que le catalogue **refuse aujourd'hui comme inexistante**.

Le service valide à l'octroi ; rien ne semble protéger un entitlement dont la version disparaît
ensuite. **Je n'ai pas pu déterminer si c'est un défaut ou une base de développement salie à la
main** — c'est à vérifier avant d'en faire une story, pas à supposer.

> **Demande :** un **semis idempotent du catalogue** au démarrage — au minimum un module **avec au
> moins une version `ACTIVE`**, et le ou les référentiels que ce module exige. Même patron que
> `seedPlatformAdmin` *(`upsert`, journalisation « créé » / « retrouvé »)*.
>
> ⚠️ Vérifié dans le code : **`platform-catalog-service` n'a AUCUN répertoire de seed** — pas plus
> que `kyc-service`. `auth-service` est le seul des trois à en avoir un.

---

## 🔴 B. La file KYC est vide sur une base de 44 organisations — `STORY-180` est **prouvée**

**Service :** `kyc-service` · **Écran bloqué :** AP-03

`STORY-180` *(semer un dossier KYC en revue)* était écrite sur une déduction. Elle est désormais
**mesurée** :

- `GET /admin/kyc?status=UNDER_REVIEW` → `[]`
- BFF `GET /admin/kyc-reviews?status=UNDER_REVIEW` → `{"items":[],"total":0}`
- `GET /admin/kyc/:orgId` → **404** « Dossier KYC introuvable. »

**44 organisations, zéro dossier.** L'écran de revue — le plus important de la console — n'a jamais
été vu fonctionner sur une donnée réelle, et ne peut pas l'être.

⚡ **Corollaire : `STORY-179` n'est pas vérifiable non plus.** Le défaut d'URL présignée
*(`kyc-service` signe sur l'hôte interne de MinIO)* ne peut être ni reproduit ni constaté corrigé
tant qu'aucun dossier ne porte de pièce. **A et B se tiennent** : livrer 179 sans 180, c'est
corriger à l'aveugle.

⇒ Rien à créer : **`STORY-180` existe** *(sprint 20)*. Ce ticket lui apporte sa preuve.

---

## 🟠 C. Le stack de développement se coupe tout seul, en silence

**Cible :** `OPS` · **Découvert en montant la campagne de test**

Trois incidents, tous rencontrés le même jour :

1. **Le BFF ne compilait pas depuis 15 h.** Un fichier `src/config/index.ts` — un **baril généré par
   l'IDE** — exportait `./env`, qui n'existe pas *(`TS2307`)*. Le conteneur affichait `Up (healthy)`
   et ne servait **rien** ; seuls les logs le disaient. ⚠️ C'est la **deuxième fois** que ce
   générateur casse un service : `MNV-074` a supprimé les mêmes barils dans `bilan-service` le
   2026-07-27.
2. **Toute l'infrastructure était arrêtée** *(mongo, minio, kafka, redis, mailhog)* pendant que les
   quatre services applicatifs restaient `Up`, bloqués en boucle de connexion.
3. **Kafka en boucle d'élection de leader** — `auth-service` répond `503` sur `/health`
   *(`mongodb: up, redis: up, kafka: down`)* tout en **servant normalement ses routes métier**. Une
   sonde qui dit « mort » sur un service vivant fait chercher au mauvais endroit.

**Cause commune :** le compose lance les services en **`start:dev` (watch)**. Quatre compilateurs
TypeScript en surveillance permanente rendent la machine inutilisable *(un `/health` mesuré à
**23,8 s** ; le lanceur de tests du front n'arrivait plus à démarrer ses workers)*, et **n'importe
quel fichier déposé par un éditeur dans le volume monté peut couper un service**.

> **Demande — à arbitrer, deux issues défendables :** ① un mode « stack de vérification » sur images
> **buildées** *(pas de watch, pas de volume monté)* pour les campagnes de test et l'Integration
> Gate ; ou ② à défaut, `.gitignore` + `.dockerignore` sur les barils générés et un `README` qui
> dit où regarder quand un conteneur est `Up` et muet. ⚠️ Ce qui ne se défend pas, c'est de le
> redécouvrir une troisième fois.

---

## 🟠 D. AP-07 — le dashboard n'a **aucun backend**

**Service :** `prospera-admin-panel-service` · **Écran concerné :** AP-07 *(non implémenté)*

La fiche `AP-07` déclare `**API :** admin-panel BFF (/admin/dashboard)`. **Cette route n'existe pas.**
`grep -i dashboard` sur tout le `src/` du BFF : **zéro occurrence**. Les six contrôleurs montés sont
`admin`, `admin/kyc-reviews`, `admin/modules`, `admin/orgs`, `admin/projects`, `admin/users`.

Son second appui déclaré, `STORY-049`, est une story de **test e2e** *(« e2e chaîne KYC complète
(docker) »)*, `done` — **pas un endpoint d'agrégats**.

⚠️ Aucun endpoint ne sert de compteurs plateforme. Composer le dashboard depuis l'existant
demanderait : un appel `/admin/orgs` par statut *(pour les `total`)*, un `/admin/kyc-reviews`, et
**une boucle sur les modules** via `entitlements/by-module/:code/summary` — soit un N+1 pour une
page de supervision.

> **À trancher :** ① une route d'agrégat `/admin/dashboard` sur le BFF *(il est déjà l'agrégateur,
> c'est son rôle)* ; ou ② acter la composition côté client et **corriger la fiche AP-07**, qui
> annonce aujourd'hui une API inexistante. ⚠️ Une story `ready-for-dev` dont l'API n'existe pas est
> le **quatrième** cas de ce motif dans ce programme.

**Et son AC3** *(« e2e chaîne KYC complète : inscription → upload → OCR → revue → approbation »)*
dépend de `STORY-179` + `STORY-180`, plus `document-service`/OCR — qui ne tournent pas.

---

## 🟡 E. AP-05 — le contrat du catalogue n'est pas typé au Swagger *(jumelle de `STORY-181`)*

**Service :** `platform-catalog-service` · **Écran concerné :** AP-05 *(livrée, en `review`)*

`EntitlementResponseDto` déclare `referentiel` et `config` en `type: Object`. Résultat mesuré dans
les types générés et committés du front : **six `Record<string, never>` dans `src/types/api/catalog.ts`**,
dont `EntitlementResponseDto.referentiel` et `EntitlementByModuleItemDto.referentiel`.

Le client d'AP-05 les recaste donc à la main :

```ts
const referentiel = dto.referentiel as { code?: string; version?: string } | undefined;
```

C'est **exactement** le motif de `STORY-181` *(qui vise le BFF)*, sur un second service. Le
référentiel est pourtant la donnée qui décide de la **réconciliation** d'AP-05 — la valeur centrale
de l'écran.

> **Demande :** typer `referentiel` *(`ReferentielRefDto`, qui existe déjà)* et `config`. À traiter
> **avec `STORY-181`** : même correctif, même patron de décorateur, deux services.

---

## 📋 Campagne AP-05 → AP-07 — ce qui a été testé, et ce que ça donne

| Story | Code livré ? | Intégration backend | Verdict |
|---|---|---|---|
| **AP-05** entitlements | ✅ oui | ✅ **les 4 routes appelées et testées** | ⛔ **inexerçable** — cf. §A |
| **AP-06** provisioning | ❌ **maquette seule** *(son commit le dit : « sans code applicatif »)* | — | bloquée par §A + `STORY-148` + `STORY-171` |
| **AP-07** dashboard | ❌ **maquette seule** | — | ⛔ **son API n'existe pas** — cf. §D |

**AP-05, routes mesurées** *(jeton réel)* :

| Route | Mesure |
|---|---|
| `GET /catalog/entitlements/:orgId` | 200 `[]` |
| `GET /catalog/entitlements/:orgId/:moduleCode` | 404 *(message métier explicite)* |
| `DELETE /catalog/entitlements/:orgId/:moduleCode` | 404 *(testé sur une org sans droit — non destructif)* |
| `PUT /catalog/entitlements/:orgId/:moduleCode` | **422** — cf. §A |

⚡ **Le 422 valide l'AC4 d'AP-05** *(« validation contre le catalogue : couple inexistant refusé »)* :
le garde-fou fonctionne. Ce sont les AC2 et AC3 *(octroyer, mettre à jour, révoquer)* qui sont
inexerçables — faute de matière, pas faute de contrat.

**AP-06** ne peut pas être cadrée tant que §A n'est pas levé : son geste central est une **séquence**
d'octrois, et un seul octroi est déjà impossible. S'y ajoutent `STORY-148` *(quel module exige quel
référentiel)* et `STORY-171` *(rien n'enregistre le vertical provisionné)*. ⚠️ Et il n'existe
**aucun endpoint de provisioning groupé** : la séquence est côté front, sans transaction — un échec
partiel laisse une organisation à moitié provisionnée. À acter dans la story, pas à découvrir.

---

## ⚠️ Une incohérence de données dev, à ne PAS confondre avec un défaut

Relevée en testant AP-05, et **volontairement pas transformée en demande** — la vérification a
montré qu'elle n'établit pas ce qu'elle semblait établir.

**Le symptôme :** deux routes du même service se contredisent sur la même donnée.
`GET /catalog/entitlements/by-module/bilan` voit un droit `ACTIVE` pour l'org `6a6105a9…` ; 
`GET /catalog/entitlements/6a6105a9…` renvoie `[]` et la lecture ciblée renvoie `404`.

**La mesure** *(profiler Mongo activé le temps d'un appel)* : le service émet
`filter: {"organizationId": "6a6105a9…"}` — une **chaîne** — alors que le document stocke un
**`ObjectId`**. `n: 0`. Le code passe `orgId` sans conversion, là où il convertit explicitement
`grantedBy` *(`new Types.ObjectId(...)`)*.

**Ce qui empêche d'en faire un défaut :** le document porte `source: "verification-fe014"`, alors
que l'upsert de l'API écrit **toujours** `source: 'admin'`. ⇒ **il a été inséré directement en base
par un script de vérification** le 2026-07-22, pas produit par l'API. Un document créé par l'API
serait peut-être stocké en chaîne, et donc parfaitement retrouvé.

> **Question ouverte, à trancher par UN essai :** octroyer un entitlement **par l'API**, puis relire
> par org. Si le droit est invisible, c'est un défaut majeur *(la réconciliation d'AP-05 et le
> `activeEntitlementsCount` d'AP-02 sont aveugles)* ; s'il est visible, il n'y a qu'un document
> orphelin à nettoyer.
>
> ⚡ **Cet essai est impossible aujourd'hui** — il exige un octroi, donc une version au catalogue,
> donc **§A**. C'est la meilleure illustration du coût de ce ticket : un manque de données empêche
> même de savoir s'il y a un bug.

---

## Ce qui NE donne PAS de story

- **`entitlements/by-module/:code/summary`** — soupçonnée en `401` lors d'une première passe, elle
  répond **`200`** une fois le jeton correctement transmis *(le `401` venait d'un login vide de mon
  côté)*. ⚡ **Aucune demande** : la route fonctionne. Consigné parce qu'un faux constat dans un
  ticket coûte plus cher qu'un constat manquant.
- **Les 44 organisations sans entitlement** — ce n'est pas un défaut, c'est la conséquence de **A**.
  Une seule demande, pas deux.
- **La forme de la fiche détail** — vérifiée conforme à ce que le front suppose :
  `members[]` porte bien `firstName`/`lastName` *(et pas `name`)*, et `registrationId`/`memberSince`
  sont bien **absents**. Le front les rend vides, c'est juste. Rien à demander.

---

## Un défaut FRONT trouvé par cette campagne — déjà corrigé

Il n'appartient pas à ce ticket, il est consigné pour que la mesure ne se perde pas.

`sources.kyc: "absent"` — la réponse du BFF pour une organisation **sans dossier** — était traduite
en `degraded` par la console. Les **44** organisations de la base affichaient donc, sur leur fiche,
« **Service KYC indisponible — dernières données connues** » : une panne inventée, en permanence, sur
tout l'annuaire.

⚠️ Le commentaire du code décrivait déjà la bonne règle *(« `absent` n'est pas une dégradation »)* et
les deux branches retournaient `degraded` — **et le test verrouillait le défaut** en attendant
`degraded`. Corrigé côté front le 2026-08-05 : `absent` sert désormais l'état vide de son domaine
*(`NOT_STARTED` pour le KYC, aucune ligne pour les droits)*, et `unavailable`/`forbidden` restent
dégradés. Trois tests ajoutés, dont un qui interdit d'avaler les vraies pannes.

---

## Inscription au tracker

À inscrire dans `sprint-status.yaml` → `open_contract_gaps`. ⚠️ Un ticket qui n'est pas dans un
tracker est **invisible du sprint-planning** — règle du dossier.
