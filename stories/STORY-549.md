# STORY-549 : Deux cartes sans code, quatre codes sans carte — le registre de modules du cabinet entre au catalogue

Status: done

**Épic :** EPIC-007 — Catalogue de modules et packs verticaux
**Service :** `platform-catalog-service` (`:3003`) + **`fiscal-service`** (décision user du 2026-09-29) + `frontend-admin-panel` (packs, via story front) · **Complexité :** high
**Points :** 13 · **Sprint :** S20 — *8 → 13 le 2026-08-28 : le PO tranche aussi la sortie des fonctionnalités de socle, et elle touche **deux packs**, pas un*
**Prérequis :** ⛔ **STORY-366** (le catalogue de modules est semé, et un pack ne peut plus référencer un module inconnu) — `not_started`
**Origine :** revue de l'écran **« Vos modules »** (FE-014) demandée par le PO le 2026-08-28, faite **contre le registre réel** et non contre les épics.

---

## Le fait, mesuré dans le code

L'accueil affiche **quatre** modules. Le pack `cabinet` en octroie **cinq**. **Deux seulement se
recouvrent.**

| Carte de l'accueil | Code registre client | `href` | Dans le pack `cabinet` ? |
|---|---|---|---|
| Bilan & états financiers | `bilan` | `/bilan` ✅ | ✅ |
| Atelier de balance | `balance` | `/atelier` ✅ | ⛔ **absent** |
| Conseil fiscal | `conseil` | ⛔ **aucun** | ⛔ **inconnu du catalogue** |
| Déclarations fiscales | `declarations` | ⛔ **aucun** | ⛔ **inconnu du catalogue** |

`packs.seed-data.ts` : `modules: ['bilan', 'fiscalite', 'equipe', 'support-client', 'dashboard']`.

⇒ **Le décalage joue dans les deux sens : deux cartes sans code, quatre codes sans carte.**

## ⛔ Ce que ça produit aujourd'hui, et qui est plus grave qu'un module manquant

1. **« Abonnement requis » sur Déclarations fiscales est FAUX.** Le module n'est pas au pack :
   **souscrire une formule n'ouvrira rien**. On oriente le client vers un achat qui ne changera pas
   son écran. ⚡ C'est pire que « non activé », qui au moins n'appelle pas à payer.
2. **« Nous contacter » sur Conseil fiscal mène à une impasse** que le support ne peut pas résoudre :
   il n'y a **aucun code à octroyer**.
3. **La carte Atelier dit vrai aujourd'hui et deviendra fausse.** Elle affiche « Vérification
   requise » (KYC) ; l'ordre serveur étant e-mail → KYC → entitlement, **elle basculera sur « Non
   activé » dès le KYC approuvé**, et le cabinet ne comprendra pas ce qu'il a fait de mal.

⚡ **Ce n'est pas un oubli isolé : c'est le patron « valide contre une liste qu'il ne publie pas »**
— 6ᵉ occurrence après STORY-394, 397, 414, 488 — appliqué cette fois **à l'objet le plus visible du
produit, celui qui porte les boutons d'achat**.

## ✅ Arbitrage PO du 2026-08-28 : **DEUX modules fiscaux, pas un**

`conseil` et `declarations` restent **deux modules distincts**, parce qu'ils **se vendent
différemment** : les déclarations sont une **obligation** (tout cabinet en a besoin), le conseil est
un **service à valeur ajoutée** qui se facture plus cher. Un seul `fiscalite` empêcherait de vendre
l'un sans l'autre.

## Critères d'acceptation

- [x] AC-1 — Les modules `balance`, `conseil` et `declarations` **existent au catalogue**, avec leur
      libellé, leur description et leurs `referentielFamilies`.
- [x] AC-2 — Le pack `cabinet` porte `balance`, `conseil` et `declarations`. ⚠️ La **source de vérité
      est double** — `packs.seed-data.ts` **et** `vertical-packs.ts` côté console, comparés par
      `packs.seed-data.spec.ts`. **Les deux changent, ou aucun** : un seed qui diverge du front
      change en silence ce que reçoit une organisation provisionnée.
- [x] AC-3 — ⛔ **`fiscalite` sort du pack `cabinet`**, remplacé par les deux. Le module **reste au
      catalogue** (statut retiré) : le supprimer révoquerait des octrois existants. Les organisations
      déjà porteuses de `fiscalite` sont **inventoriées et migrées explicitement**, jamais
      silencieusement.
- [x] AC-4 — ⚠️ **Ajouter un module à un pack n'octroie RIEN rétroactivement.** Les organisations
      déjà provisionnées ne recevront ni `balance`, ni `conseil`, ni `declarations`. ⇒ Une
      **procédure de rattrapage** est livrée avec la story, et son exécution est **tracée**. Sans
      elle, le gap ne se referme que pour les nouveaux clients — c'est-à-dire pas du tout.
- [x] AC-5 — Une route publie **la liste des codes de module du catalogue**. C'est elle que la garde
      de **FE-085** interroge. ⇒ **La 6ᵉ occurrence du patron se ferme par une route, pas par une
      relecture.**
- [x] AC-6 — Vérification **en docker sur stack neuve** : provisionner une organisation `cabinet`
      doit rendre les cinq modules attendus, et `GET /catalog/entitlements/{orgId}` doit les
      publier. ⚠️ C'est exactement la vérification qui a ouvert ce gap le 2026-08-11 (provisioning à
      `422`) — elle doit le déclarer clos.

## Second arbitrage PO du 2026-08-28 : les fonctionnalites de socle SORTENT des packs

`equipe`, `support-client` et `dashboard` **ne sont lus par aucun service applicatif** — verifie :
seules la console et ses fixtures les connaissent. Ce ne sont pas des **modules facturables**, ce
sont des **fonctionnalites du socle**. Les laisser au pack les fait ressembler a des entitlements,
et le client paie pour des cartes qu'il ne verra jamais.

⇒ **Ils sortent.** Et l'effet depasse le cabinet :

| Pack | Aujourd'hui | Apres |
|---|---|---|
| `cabinet` | `bilan`, `fiscalite`, `equipe`, `support-client`, `dashboard` | `bilan`, **`balance`**, **`conseil`**, **`declarations`** |
| `assurance-cima` | `bilan`, `finance-transactions`, **`support-client`**, **`dashboard`** | `bilan`, `finance-transactions` |
| `distributeur` · `imf-sfd` | *(n'en portent aucun)* | inchanges |

⚡ **Pourquoi cette sortie est groupee avec l'ajout et non fichee a part** — meme artefact
(`packs.seed-data.ts`), meme transcription independante (`packs.front-snapshot.ts`), meme spec de
comparaison, meme migration, **et une seule procedure de rattrapage**. Les separer couterait deux
migrations et deux verifications docker de la meme table. C'est le raisonnement de STORY-368,
applique ici.

⚠️ **Mais les deux moities n'ont PAS le meme profil de risque, et les AC les separent** : ajouter un
module ne peut rien casser ; **en retirer un touche des organisations deja provisionnees**.

### Ce que la sortie ajoute aux criteres d'acceptation

- [x] AC-7 — `equipe`, `support-client` et `dashboard` sortent de **tous les packs** — `cabinet`
      **et** `assurance-cima`. ⚠️ Ne pas se limiter au pack de l'ecran qui a ouvert le sujet : la
      meme erreur de conception vit dans un second pack.
- [x] AC-8 — ⛔ **Ils RESTENT au catalogue**, en statut non octroyable — comme `fiscalite` (AC-3).
      Les supprimer revoquerait des octrois existants, et **une revocation silencieuse est le seul
      geste de cette story qui puisse retirer une capacite a un client en production**.
- [x] AC-9 — Les organisations **deja porteuses** de ces entitlements sont **inventoriees et
      listees**. ⛔ **Aucune revocation automatique** : le rattrapage d'AC-4 *ajoute*, il ne retire
      pas. Retirer se decide organisation par organisation, ou pas du tout.
- [x] AC-10 — Un test verifie qu'**aucun service applicatif** ne lit ces trois codes — c'est ce qui
      rend la sortie sure, et c'est la seule preuve qui vaille. S'il en trouve un, **la sortie
      s'arrete et le fait est remonte** : la decision reposait sur cette absence.

## Notes

- Voir [[STORY-366]] (le prérequis), [[FE-085]] (l'écran et la garde), [[FE-014]].

## Cadrage du 2026-09-29 — ce que le code dit, et les décisions qui en sortent

Relu sur `origin/dev` après l'intégration de **STORY-366** (catalog `3e6c2d1` : 18 modules semés,
`balance` en tête des quatre packs — ⇒ AC-1 et AC-2 sont **déjà à moitié faites** pour `balance`).

### ⛔ Le fait qui change l'AC-3 : `fiscalite` n'est pas un code mort

Recensement des lecteurs de codes de module dans les 14 dépôts de service :

| Code | Lu en production par |
|---|---|
| `fiscalite` | ⛔ **`fiscal-service`** — `FISCAL_MODULE_CODE`, `FiscalAccessGuard` (`FISCAL_NOT_ENTITLED`) sur **toutes** ses routes : échéances, paquets fiscaux, livrables e-DSF, dépôts |
| `equipe` · `support-client` · `dashboard` | **aucun** (seed et packs du catalogue ; `notification-service` stocke tous les codes reçus sans en comparer aucun) |
| `conseil` · `declarations` | aucun (absents du catalogue) |

⇒ Sortir `fiscalite` du pack **fermerait `fiscal-service` à tout nouveau cabinet**. Et `fiscal-service` ne
sert **que des déclarations** — aucune route de conseil.

### Décisions

- **D-549-1 (user, 2026-09-29) — la story s'étend à `fiscal-service`.** `declarations` reprend le rôle de
  `fiscalite` : `fiscal-service` ouvre ses routes sur **l'un OU l'autre** (`FISCAL_MODULE_CODES`). Son
  read-model `org_fiscal_entitlements`, keyé par **organisation seule**, est re-keyé **(organisation,
  module)** — sinon révoquer `fiscalite` fermerait l'accès d'une organisation qui a aussi `declarations`
  (dernier événement gagnant). Le catalogue publie l'intégrité d'artefact (`artifactUri`, `checksum`)
  pour `declarations` comme pour `fiscalite`. ⚠️ **Contrat d'événement ⇒ 2 dépôts, PR jumelles**.
- **D-549-2 (user) — `conseil` et `declarations` portent les familles de `fiscalite`**
  (`syscohada-revise`, `zone-franche-togo`) : normatifs, donc fermés par défaut. `conseil` n'ouvre aucun
  service aujourd'hui — FE-085 rend son absence lisible.
- **D-549-3 — « non octroyable » = `status: DEPRECATED` + refus à l'octroi NEUF.** `fiscalite`,
  `equipe`, `support-client`, `dashboard` sont semés `DEPRECATED` (base neuve) ; l'octroi refuse
  (`422 MODULE_NON_OCTROYABLE`) un module `DEPRECATED` **à une organisation qui ne le porte pas
  déjà**. Un octroi existant reste modifiable et révocable — c'est ce qui rend la sortie sans
  révocation (AC-8, AC-9). ⚠️ Sur une base existante le semis n'écrase rien : le passage en
  `DEPRECATED` est un `PATCH` d'exploitation, inscrit dans la procédure.
- **D-549-4 — l'API des packs refuse aussi un module `DEPRECATED`** (même garde que le module
  inconnu) : un pack qui le citerait se provisionnerait en `422`.
- **D-549-5 — AC-5 = `GET /catalog/modules/codes`**, lisible par **tout rôle tenant** (l'accueil
  FE-085 sert aussi le `TENANT_USER`, que `GET /catalog/modules` refuse) : `[{ code, octroyable }]`.
- **D-549-6 — AC-4/AC-9 = un outil d'exploitation** (`src/migrations/rattrapage-packs.ts`, même forme
  que le backfill de STORY-148) : `inventaire` (lecture seule — organisations porteuses de chaque code
  retiré, et porteuses de `fiscalite` sans `declarations`) et `rattraper` (**à blanc par défaut**,
  liste d'organisations **explicite** — aucune organisation ne déclare son secteur tant que STORY-171
  n'est pas livrée). Le rattrapage **n'ajoute que** : chaque octroi passe par `EntitlementsService`
  (transaction + outbox ⇒ les services consommateurs sont notifiés) et porte
  `source: "rattrapage:<pack>"` — la trace est **sur l'octroi lui-même**, plus le rapport JSON.
- **D-549-7 — AC-10 : la preuve est un balayage des 14 dépôts, rejoué en vérification.** La CI d'un
  dépôt ne voit pas les autres ; une garde « inter-dépôts » en CI n'existerait que sur le papier.
  Le balayage (commande et résultat) est consigné ci-dessous et **rejoué à la vérification docker**.
- **D-549-8 — le front n'est pas modifié ici** : story console **AP-37** (packs `cabinet` et
  `assurance-cima`) pour le dev frontend ; FE-085 (accueil client) existe déjà et reçoit la route.

### Écarts préexistants, consignés et NON traités

- ⚠️ `fiscal-service` cherche ses paquets dans les `referentiels` de l'octroi sous le code
  `fiscal-<pays>-<type>` (`paquets.service.ts`), alors que les familles de `fiscalite` (STORY-148)
  sont `syscohada-revise` / `zone-franche-togo` : un octroi ne peut pas porter à la fois un paquet
  fiscal et passer la règle de familles. Hérité tel quel par `declarations` ; à cadrer à part.
- ⚠️ **Prérequis d'exploitation sur une base existante** : l'index unique `organizationId_1` de
  `fiscal_service.org_fiscal_entitlements` est à supprimer avant le déploiement (Mongoose crée les
  index, il ne les supprime pas) — sinon le second octroi fiscal d'une organisation part en `E11000`.
  Le dev repart de zéro (règle projet).

## Progress Tracking

- 2026-09-29 — cadrage (D-549-1..8) ; branches `MNV-549` ouvertes (`docs/`, `platform-catalog-service`,
  `fiscal-service`) ; statut `in_progress`.
- 2026-09-29 — dev : catalogue `MNV-549` (3 commits : feature, revue) et `fiscal-service` `MNV-549`
  (4 commits : feature, mock e2e, mock des paquets, revue). Story front **AP-37** rédigée.
- **Portes** (état final, cf. ci-dessous) : lint 0 · build OK · catalogue unitaires + e2e · fiscal
  unitaires + e2e · couverture > seuils dans les deux dépôts.
- **Mutations — 20/20 tuées, toutes COMPILABLES** (`tmp/mutations-549/`) : catalogue C1–C12 (refus
  `DEPRECATED`, existant modifiable, `source`, pack avec module retiré, `octroyable`, `TENANT_USER` sur
  la route, intégrité de `declarations`, `equipe` semé ACTIVE, cabinet qui garde `fiscalite`, rattrapage
  qui rouvre un révoqué / écrit à blanc / envoie un référentiel aux non normatifs) ; fiscal F1–F6
  (`declarations` n'ouvre pas, document historique non rattrapé, garde sans filtre de statut, paquets
  non dédoublonnés, paquets lisant les révoqués, index unique par organisation seule) ; revue R1–R2
  (`exists` sans filtre ACTIF, majuscules acceptées).
  ⚠️ **Incident consigné** : une première rédaction de 5 mutants ne COMPILAIT pas (import devenu inutile)
  — leur « vert » ne prouvait rien ; réécrits, et la passe signale désormais « suite non exécutée ».
  Deux passes ont aussi tourné en parallèle sur les mêmes dépôts (un `pkill` au mauvais motif) :
  arrêtées, dépôts restaurés à HEAD, passe unique rejouée.
- **Vérification docker sur stack NEUVE, état final** (`tmp/verif-docker-549/`, catalogue `70b8222`,
  fiscal `50d6a2b`) — **66 OK, 0 KO** :
  - p1 (8) : 20 modules semés, les 4 retirés `DEPRECATED`, `conseil`/`declarations` ACTIVE aux familles
    de `fiscalite`, 20 versions `1.0` ; packs `cabinet` et `assurance-cima` conformes, aucun module retiré
    cité.
  - p3 (22) — cabinet NEUF C : un **TENANT_USER réel** (invitation) lit `GET /catalog/modules/codes`
    (20 codes, 4 non octroyables, clés `code`/`octroyable` seules) et reste en 403 sur
    `/catalog/modules` ; fiscal-access **403 `FISCAL_NOT_ENTITLED`** avant ; pack cabinet octroyé entier
    par l'API (aucun 4xx) ; **AC-6 : `GET /catalog/entitlements/{orgId}` publie `balance, bilan, conseil,
    declarations`** ; read-model fiscal = un seul document `declarations` ACTIVE ; fiscal-access **200**
    (admin et collaborateur) ; octroi neuf des 4 retirés ⇒ `422 MODULE_NON_OCTROYABLE`, aucun document
    ni événement écrit (non-vacance : 4 octrois lus) ; `PATCH` du pack avec `equipe` ⇒
    `422 PACK_MODULE_RETIRE`, pack inchangé.
  - p4 (34) — cabinet HISTORIQUE L (`fiscalite` + `equipe` octroyés en rouvrant temporairement les
    modules, puis `DEPRECATED` — écriture d'exploitation dite) : mise à jour de `equipe` (retiré, porté)
    ⇒ 200 ; document fiscal rendu « antérieur à 549 » par `$unset` (écriture directe dite) et accès
    maintenu ; **inventaire** : L sur `fiscalite` et `equipe`, C nulle part, L « fiscalite sans
    declarations », rien écrit ; **rattrapage à blanc** : 4 lignes `a-octroyer`, rien écrit ;
    **appliqué** : 4 octrois `source: rattrapage:cabinet`, 4 événements, **aucune révocation**
    (`fiscalite` et `equipe` toujours ACTIVE) ; identifiant en MAJUSCULES ⇒ sortie 1, processus rendu,
    rien écrit ; rejeu ⇒ tout `deja-present` ; révocation de `fiscalite` ⇒ le document historique est
    **rattrapé** (moduleCode posé, aucun doublon) et l'accès tient par `declarations` ; **PUT rejoué sur
    `fiscalite` révoquée ⇒ `422 MODULE_NON_OCTROYABLE`**, reste REVOKED ; révocation de `declarations`
    ⇒ `403 FISCAL_NOT_ENTITLED` ; index : unique `(organizationId, moduleCode)` présent, plus aucun
    unique sur `organizationId` seul.
  - p5 (2) — **AC-10** : balayage de 13 dépôts de service (tous ceux qui ont un `src/`, hors catalogue, hors specs) : **aucune**
    lecture de `equipe`, `support-client`, `dashboard`. `notification-service` stocke tous les codes
    sans en comparer aucun, et aucun service n'inscrit d'apport au carnet sous ces codes ni sous
    `fiscalite`.
  - ⚠️ Premier passage : la phase 4 a échoué sur MON appel (`npm run` d'un script absent du
    `package.json` de l'image — seul `src/` est monté) ; appel par `ts-node` sur le même point
    d'entrée, rejeu complet sur stack neuve.
- **Revue de code ⑥** : 8 constats retenus, tous corrigés (`MNV-549(revue)`) — ⛔ bloquant : Swagger des
  422 (`MODULE_NON_OCTROYABLE`, `PACK_MODULE_RETIRE`) absent d'une énumération « exhaustive » ; un PUT
  rouvrait l'octroi RÉVOQUÉ d'un module retiré (filtre ACTIF) ; identifiant en majuscules = autre clé
  (motif hexadécimal minuscule) ; CLI qui ne se fermait pas sur erreur (`finally`) ; 403 de la route des
  codes ; JSDoc détaché ; 5 commentaires/exemples rendus faux. ponytail-review : `parseArgs` possible
  (−5 lignes), laissé.
- **Revue de sécurité ⑦** : **0 constat** (≥ 80). Sous le seuil, repris ici : l'index `organizationId_1`
  oublié sur une base existante ⇒ `E11000` rejoué sans fin par le consommateur, **partition bloquée** ⇒
  les révocations d'autres organisations de la même partition ne sont plus projetées.

### ⚠️ Exploitation — à faire sur une base existante, dans cet ordre

1. `fiscal_service.org_fiscal_entitlements` : **supprimer l'index unique `organizationId_1`**.
2. **Déployer `fiscal-service` AVANT le catalogue** : l'ancien consommateur ignorerait les événements
   `declarations` en validant leur position — ils ne seraient jamais projetés.
3. Catalogue : `PATCH /catalog/admin/modules/:code { status: DEPRECATED }` pour `fiscalite`, `equipe`,
   `support-client`, `dashboard` ; `PATCH /catalog/admin/packs/:key` pour retirer ces modules des packs
   (le semis n'écrase rien).
4. `npm run rattrapage:packs -- inventaire`, puis `rattraper --pack cabinet --orgs <…>` à blanc, puis
   `--appliquer`.

### ⚠️ Conséquence produit tant que AP-37 n'est pas livrée

La console octroie depuis sa propre constante : un cabinet qu'elle provisionne recevrait
`422 MODULE_NON_OCTROYABLE` sur `fiscalite`/`equipe`/`support-client`/`dashboard` et n'aurait pas
`declarations` — donc **pas d'accès à `fiscal-service`**. ⚠️ Sans régression mesurable aujourd'hui : la
console est déjà en `400` sur tout octroi (champ `referentiel` singulier, AP-29). **AP-29 + AP-36 + AP-37
sont à livrer ensemble.**
- **Intégration** : `prospera-fiscal-service#9` rebase-mergée (`aa4a118`) **puis**
  `prospera-platform-catalog-service#28` (`ddc49ac`) — l'ordre de déploiement ; branches supprimées.
  Statut `done`.
