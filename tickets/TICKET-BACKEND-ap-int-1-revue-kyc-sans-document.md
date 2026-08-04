# TICKET-BACKEND — AP-INT-1 : la revue KYC ne montre aucun document

**Cible :** `BACKEND` *(services : `kyc-service`, `prospera-admin-panel-service`)* · un point **`OPS`**
**Origine :** `AP-INT-1` — reprise du gate d'AP-INT-0 après audit de l'intégration de la console
**Ouvert le :** 2026-08-04 · **Statut :** ➡️ **REPRIS le 2026-08-04** — les six manques sont devenus **`STORY-179` à `STORY-184`** (16 pts), slottées au **sprint 20**. **Les stories font foi** ; ce ticket est un état transitoire clos et ne se modifie plus.

| Manque | Story | Points |
|:--:|---|:--:|
| A — URL présignée sur l'hôte interne | **`STORY-179`** | 3 |
| B — aucun jeu de données de revue | **`STORY-180`** | 3 |
| C — `AdminOrgDetailDto` non typé | **`STORY-181`** | 2 |
| D — aucune concurrence sur la décision | **`STORY-182`** | 3 |
| E — ni historique ni timeline | **`STORY-183`** | 3 |
| F — ni référence ni n° de soumission | **`STORY-184`** | 2 |

⚠️ **Le S20 passe à 64 points pour 34 de capacité.** L'arbitrage n'est pas rendu ici : il est écrit
dans le `committed_points` du sprint, avec l'ordre défendable si la capacité doit être tenue
*(garder 179+180, décaler le reste au S21)*.
**Méthode :** chaque manque est **confronté au code du service** *(fichier et ligne cités)*, jamais déduit d'un tracker ni d'un nom de route

---

## Pourquoi un second ticket, trois semaines après le premier

Le ticket d'AP-INT-0 a relevé ce qui manquait aux **contrats**. Il ne pouvait pas relever ce qui
manque à la **matière** : à ce moment-là, la console n'affichait pas encore les vrais documents, ne
lisait pas encore le vrai dossier, et n'ouvrait aucun de ces écrans en navigateur.

AP-INT-1 a corrigé trois défauts côté front — le plus coûteux étant que **l'écran de revue KYC
n'atteignait tout simplement pas son service** *(chemin `/kyc/admin/kyc/:orgId` résolu en
`:3002/api/v1/**kyc/**admin/kyc/:orgId`, 404 systématique, et un « aucun dossier » affiché pour
tous les dossiers)*. En le réparant, on découvre ce qu'il masquait.

> ⚡ **Un bug de transport avait rendu invisibles tous les manques situés derrière lui.** C'est la
> leçon de ce ticket : tant qu'un écran ne parle pas à son service, il ne peut rien apprendre de lui.

**Ce que le front a déjà réparé, et qui n'est donc PAS ici :** préfixe `/kyc-admin`, détection du 404
sur `statusCode` *(le test fabriquait une forme d'erreur que la production ne produit jamais)*,
affichage du **fichier réel** au lieu d'un document dessiné, verdicts par pièce préchargés, retrait
des deux filtres sans serveur, exigences d'environnement remises à l'endroit.

---

## Déjà couvert — ne rien rouvrir

`STORY-171` *(vertical)* · `STORY-173` *(CORS du BFF — livrée sur `MNV-172`)* · `STORY-174` *(N/N-1
côté service)* · `STORY-175` *(filtre `kycStatus`)* · `STORY-176` *(BFF proxifie la marque par
pièce)* · `STORY-177` *(`grantedAt`)* · `STORY-178` *(seed de l'administrateur)* · `STORY-148`
*(familles de référentiels)*.

> ⚠️ **Incohérence de numérotation à corriger au passage.** Le code d'`admin-panel`
> *(`src/main.ts`, `src/config/configuration.ts`)* attribue le CORS à `STORY-172`. Le dépôt de
> stories a renuméroté en **`STORY-173`**, le 172 étant pris par `balance-service`. Les commentaires
> du service pointent donc vers la mauvaise story.

---

## 🔴 A. `kyc-service` signe ses URL sur un hôte que le navigateur ne peut pas joindre

**Service :** `kyc-service` · **Découvert par :** AP-03, en affichant enfin le vrai document
**Bloquant :** ⚡ **oui — la revue KYC reste inexploitable sans ça**

`StorageModule` n'instancie **qu'un seul** client MinIO, sur l'endpoint interne :

```ts
// kyc-service/src/storage/storage.module.ts:19-27
const minio = config.getOrThrow<MinioConfig>('minio');
return new Client({ endPoint: minio.endPoint, /* … */ });   // ⚠️ 'minio' (docker), jamais 'localhost'
```

`presignedGetUrl` *(storage.service.ts:56)* signe donc `http://minio:9000/kyc-documents/…`. Cette
URL est **parfaitement valide côté serveur** et **irrésoluble depuis un navigateur**.

⚡ **`auth-service` a déjà résolu exactement ce problème** — c'est la leçon `FE-023`, et le patron
existe : un **second client** dédié aux URL destinées au navigateur.

| | `auth-service` | `kyc-service` |
|---|---|---|
| Client interne | `MINIO_CLIENT` *(storage.module.ts:27)* | `MINIO_CLIENT` *(storage.module.ts:22)* |
| Client public | ✅ `MINIO_PUBLIC_CLIENT` sur `minio.publicEndPoint` *(storage.module.ts:41-46)* | ❌ **aucun** |
| Variables | `MINIO_PUBLIC_ENDPOINT` / `MINIO_PUBLIC_PORT` *(compose:109-110)* | ❌ aucune |

**Conséquence :** l'opérateur ouvre un dossier, voit le cadre du document — et **rien dedans**. Le
front affiche désormais un lien « Ouvrir dans un onglet » précisément pour que l'échec porte le
message du navigateur au lieu de ressembler à un bug de la console. **Ça ne remplace pas le
correctif.**

> **Demande :** recopier le patron d'`auth-service` — client « public » dédié, variables
> `MINIO_PUBLIC_ENDPOINT`/`MINIO_PUBLIC_PORT`, et **les URL de consultation admin signées avec
> lui**. Critère d'acceptation non négociable : **l'URL est chargée depuis `:3110`, dans un vrai
> navigateur** — `curl` et le runner de tests ont accès au réseau docker, l'opérateur non.
>
> ⚠️ **Deux points à trancher dans la story :**
> 1. `document-service` porte **le même défaut** *(configuration.ts:242, 257, 285 — `endPoint`
>    interne partout)*. Aucun écran ne le consomme aujourd'hui : à corriger dans la foulée, ou à
>    tracer séparément. Ce qui ne se défend pas, c'est de le laisser se redécouvrir une troisième fois.
> 2. **CORS sur MinIO** : inutile pour un affichage `<iframe>`/`<img>`, **nécessaire** si un client
>    doit `fetch()` la pièce. Le test d'e2e la charge en `fetch` — à arbitrer avec la story.

---

## 🔴 B. Aucun jeu de données de revue : l'écran central d'AP-03 n'est vérifiable par personne

**Service :** `kyc-service` · **Cible réelle :** `OPS` · **Découvert par :** l'e2e d'AP-INT-1
**Bloquant :** ⚡ **oui — pour la vérification, pas pour le code**

`kyc-service` n'a **aucun répertoire de seeds** *(`auth-service` en a un :
`src/seeds/seed-platform-admin.ts`)*. `STORY-178` sème l'administrateur — elle ne sème **aucun
dossier**.

**Conséquence :** sur une stack fraîche, `GET /api/v1/admin/kyc?status=UNDER_REVIEW` renvoie une
liste vide. La file est vide, aucune revue ne s'ouvre, et **l'écran le plus important de la console
n'a jamais été vu fonctionner de bout en bout**.

⚠️ **Aveu explicite dans le code livré :** trois tests d'`e2e/integration-gate.spec.ts` se mettent en
`test.skip` faute de dossier. Un test qui se saute n'est pas un test qui passe — il documente un trou.

> **Demande :** un seed **idempotent** *(même patron que `seedPlatformAdmin` : `upsert`, journalise
> « créé » ou « mis à jour »)* produisant au minimum :
> - une organisation avec un dossier au statut **`UNDER_REVIEW`** ;
> - ses **deux pièces** (`RCCM`, `CFE`), ⚡ **réellement déposées dans le bucket MinIO** — des
>   métadonnées sans objet donneraient des URL présignées valides pointant vers le vide, c'est-à-dire
>   le symptôme du manque **A** sans en être la cause. Les deux se confondraient au diagnostic ;
> - une **extraction OCR** portant un **écart déclaré ↔ lu** : c'est le seul cas qui démontre la
>   confrontation, et l'invariant `DO-1` *(l'OCR assiste, il ne décide pas)*.
>
> ⚠️ Idéalement au **démarrage**, comme demandé par `STORY-178` pour l'administrateur — les deux
> seeds ont le même problème et devraient avoir la même réponse.

---

## 🟠 C. `AdminOrgDetailDto` ne décrit **aucun** champ : le générateur de types ne protège plus la fiche

**Service :** `prospera-admin-panel-service` · **Découvert par :** AP-02, fiche détail

Les trois blocs de la fiche sont déclarés en `type: Object` :

```ts
// admin-panel/src/admin/orgs/dto/admin-org-detail.dto.ts:20, 27, 35
@ApiProperty({ description: 'Identité + membres (auth). Toujours présente.', type: Object })
identity!: OrganizationDetail;
```

`openapi-typescript` en tire donc `Record<string, never>` *(frontend-admin-panel/src/types/api/admin.ts:413-421)* :
un type qui n'autorise **aucune** propriété.

**Conséquence :** `npm run gen:api` produit, pour cet endpoint précis, des types **inutilisables**.
Le client les recaste à la main *(`orgs-client.ts` : `identity as { orgId?: string; name?: string; … }`)*.
Toute la valeur du contrat généré — **qu'un renommage amont casse la compilation du front** —
disparaît sur le seul écran qui agrège trois services.

> **Demande :** typer les trois blocs (`OrganizationDetailDto`, `KycDetailDto`, `EntitlementDto[]`)
> avec de vrais `@ApiProperty({ type: … })`. Le BFF les possède déjà : ce sont ses contrats amont
> *(`upstream/contracts/*.contract.ts`)*, il ne manque que leur projection Swagger.

---

## 🟠 D. Deux opérateurs peuvent trancher le même dossier sans que rien ne le dise

**Service :** `kyc-service` · **Découvert par :** AP-03 *(écart nº5 d'AP-INT-0, jamais formulé)*
⚠️ **arbitrage à rendre avant de coder**

Aucune concurrence optimiste sur `POST /admin/kyc/:orgId/approve|reject` : ni version, ni `If-Match`,
ni horodatage attendu. Le dernier appel gagne, en silence.

**Conséquence :** une revue est un travail **long, interrompu, repris**. Deux opérateurs qui ouvrent
le même dossier produisent deux décisions ; la seconde écrase la première, et **le premier ne saura
jamais que sa décision a été annulée**. Sur un acte qui décide de l'entrée d'un client, c'est une
perte d'information silencieuse.

⚠️ **Le front porte déjà un écran de conflit complet** *(`KycConflictError` + rendu dédié)* — il est
**inatteignable**, puisque rien en amont ne produit le signal. Sa présence laisse croire au cas traité.

> **À trancher :** ① porter la concurrence optimiste dans le service *(le front est déjà prêt à la
> rendre)* — ou ② acter que le dernier gagne, et alors **supprimer l'écran de conflit du front**. Le
> garder sans amont est la seule issue qui ne se défende pas : il ment par sa seule existence.

---

## 🟡 E. Un dossier n'a ni historique de décisions ni timeline

**Service :** `kyc-service` · **Découvert par :** AP-03 *(écart nº4)* — et AP-02 pour la timeline

`GET /admin/kyc/:orgId` ne porte aucune décision passée. Côté console : `KycFile.history` vaut
**toujours** `[]`, et la carte « Revue KYC » de la fiche détail affiche une timeline **vide en
permanence** *(`orgs-client.ts` : `events: []`, jamais inventés)*.

**Conséquence :** à la resoumission, l'agent ne voit pas ce qui avait été reproché. **Il relit donc
tout, au lieu de vérifier une correction** — c'est-à-dire précisément le travail que la resoumission
était censée éviter, et le cabinet attend d'autant plus longtemps.

> **Demande :** exposer les décisions passées du dossier — date, auteur, verdict, **motif**. Le motif
> est le seul élément qui rend une resoumission lisible.

---

## 🟡 F. Un dossier n'a ni référence ni numéro de tentative

**Service :** `kyc-service` · **Découvert par :** AP-03 *(écarts nº2 et nº3)*
**Dépend de E** — une tentative n'a de sens qu'avec un historique

L'écran affiche aujourd'hui `ORG-10041 · ORG-10041` *(le front rend l'`orgId` faute de référence —
redondant, mais **vrai** ; une référence inventée aurait été pire)* et un « 1/1 » codé en dur.

**Conséquence :** rien à communiquer au cabinet. « Votre dossier **KYC-2088** » est une phrase de
support ; « votre dossier **507f1f77bcf86cd799439011** » n'en est pas une.

> **Demande :** une référence de dossier **stable et communicable**, et un compteur de soumissions.
> ⚠️ À traiter **avec E**, ou pas du tout : livrer « tentative 2 » sans dire ce qui s'est passé à la
> tentative 1 pose la question sans y répondre.

---

## Ce qui NE donnera PAS de story, et pourquoi

- **`pieceCount` et `country` dans la file KYC** *(écarts nº7/8)*. Le décompte obligerait le serveur
  à ouvrir chaque dossier pour alimenter une colonne d'agrément. **La file se trie par ancienneté,
  pas par nombre de pièces** — c'est l'ancienneté qui dit « ce client est bloqué depuis deux semaines
  et demie ». ⇒ **Dette front, pas demande backend** : l'écran doit cesser d'afficher « 0 pièce »,
  ce qui est faux, plutôt que de réclamer la donnée. À rouvrir si un opérateur la réclame — pas avant.

- **`registrationId`, `memberSince`, `verified`** *(référentiels)*. Le ticket d'AP-INT-0 les a
  actées comme **inventions du front**, et le front rend désormais des valeurs vides plutôt que
  plausibles. Elles ne redeviendront des demandes backend que si le PO décide que la fiche doit les
  porter. **Ce n'est pas à un Integration Gate d'en décider** — un gate constate des écarts, il
  n'arbitre pas le produit.

> ⚡ **Deux non-demandes sur huit constats.** Comme au ticket précédent : c'est le tri qui donne sa
> valeur au reste. Un ticket qui demande tout se fait ignorer en bloc.

---

## Récapitulatif

| # | Manque | Service | Gravité | Bloque |
|:--:|---|---|:--:|---|
| A | URL présignée signée sur l'hôte interne | `kyc-service` | 🔴 | **la revue KYC, entièrement** |
| B | Aucun jeu de données de revue | `kyc-service` / OPS | 🔴 | **toute vérification d'AP-03** |
| C | `AdminOrgDetailDto` non typé au Swagger | `admin-panel` | 🟠 | la protection du contrat sur la fiche |
| D | Aucune concurrence sur la décision | `kyc-service` | 🟠 | *(arbitrage)* — écran de conflit mort |
| E | Ni historique ni timeline | `kyc-service` | 🟡 | la lecture d'une resoumission |
| F | Ni référence ni tentative | `kyc-service` | 🟡 | la communication au cabinet |

⚡ **A et B se tiennent** : sans A, l'opérateur ne voit rien ; sans B, personne ne peut constater que
A est réparé. Les livrer séparément, c'est corriger à l'aveugle.

---

## Inscription au tracker

À inscrire dans `sprint-status.yaml` → `open_contract_gaps` à l'ouverture du sprint qui les prendra.
⚠️ Un ticket qui n'est pas dans un tracker est **invisible du sprint-planning** — c'est la règle du
dossier, et c'est comme ça que huit stories sont devenues orphelines le 2026-07-31.
