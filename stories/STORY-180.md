# STORY-180 : Semer un **dossier KYC en revue** — l'écran central d'AP-03 n'est vérifiable par personne

**Epic :** EPIC-003 — KYC (`kyc-service`)
**Réf. :** ticket §B · **AP-03** · **STORY-178** *(même défaut, autre objet : le seed de l'administrateur)* · **STORY-179** *(URL présignée joignable)*
**Découverte par :** AP-INT-1, en écrivant les e2e de la revue KYC
**Priorité :** Must Have — ⚡ **bloque la vérification, pas le code**
**Story Points :** 3
**Complexité :** medium
**Statut :** in_progress
**Créée le :** 2026-08-04
**Démarrée le :** 2026-08-07
**Sprint :** 20
**Service :** `kyc-service` (`:3002`) **+ `auth-service` (`:3001`)** · **cible réelle : `OPS`**

---

## Le constat

`kyc-service` n'a **aucun répertoire de seeds**. `auth-service`, lui, en a un
*(`src/seeds/seed-platform-admin.ts`)*, et `STORY-178` s'apprête à le brancher au démarrage — mais
elle ne sème **que l'administrateur**, c'est-à-dire de quoi **se connecter** à une console qui n'a
**rien à montrer**.

**Conséquence :** sur une stack fraîche, `GET /api/v1/admin/kyc?status=UNDER_REVIEW` renvoie une
liste vide. La file est vide, aucune revue ne s'ouvre, et **l'écran le plus important de la console
n'a jamais été vu fonctionner de bout en bout** — ni par un développeur, ni par un testeur, ni par le PO.

> ⚡ **Un aveu est déjà écrit dans le code livré.** Trois tests d'`e2e/integration-gate.spec.ts` se
> mettent en `test.skip` faute de dossier. Un test qui se saute n'est pas un test qui passe : c'est
> un trou qui se présente comme une couverture, et c'est la pire des deux situations — la suite est
> verte.

## Pourquoi ce n'est pas « juste des données de test »

Trois défauts d'AP-03 ont vécu des semaines **parce qu'aucun dossier n'existait pour les révéler** :
un chemin d'API faux *(404 sur toutes les revues)*, une détection de 404 sur un champ inexistant, et
une visionneuse qui dessinait un document au lieu de l'afficher. Aucun n'a été trouvé par les tests
unitaires ; tous auraient été trouvés en ouvrant **un** dossier.

---

## ⚡ Arbitrage rendu au lancement — 2026-08-07 : la story touche **deux dépôts**

**Le fait qui tranche, mesuré et non supposé.** Le critère nº6 exige d'**ouvrir** un dossier depuis la
console. Or la console n'ouvre pas un dossier par `kyc-service` : elle passe par le BFF
`GET /admin/orgs/:orgId`, et là `auth` est la **dépendance dure** —
`org-aggregation.service.ts:274-277` : « *Identité = dépendance dure : 404 → 404 (anti-énumération),
sinon 503* ». Un dossier semé pour un `orgId` que `auth-service` ne connaît pas est donc **listé mais
inouvrable** : la file affiche une ligne *sans raison sociale* (`listKycReviews` ne joint le nom
qu'en **enrichissement dégradable**, `org-aggregation.service.ts:156-163`), et le clic renvoie **404**.

Semer le dossier seul reproduirait donc, un cran plus loin, exactement le défaut que la story ferme :
**un écran qu'on croit vérifiable et qui ne l'est pas.**

Et l'organisation ne peut pas être semée depuis `kyc-service` : *une base Mongo par service*, aucune
écriture cross-service. Elle est semée par son **propriétaire**, `auth-service`.

⇒ **Deux dépôts, deux branches `MNV-180`, deux PR, intégrées ensemble** — le patron déjà appliqué aux
changements de contrat d'événement. Ici le « contrat » est plus simple et plus dur : **les identifiants
fixes** (`DEMO_ORG_ID`, `DEMO_ORG_OWNER_ID`), passés aux deux services par le compose. Les deux seeds
convergent vers les mêmes `ObjectId` ou ne se rencontrent jamais.

| Dépôt | Ce qu'il sème | Pourquoi lui |
|---|---|---|
| `auth-service` | l'**organisation** de démonstration, son **utilisateur propriétaire** (e-mail vérifié) et le **membership** `TENANT_ADMIN` | il **possède** les identités — c'est la seule base où elles peuvent s'écrire |
| `kyc-service` | le **dossier** `UNDER_REVIEW`, ses **deux pièces** (objets MinIO **réels** + métadonnées) et l'**assistance OCR** portant l'écart | il possède le KYC (source de vérité, STORY-020) |

### Trois pièges relevés à la lecture, avant d'écrire une ligne

- ⚠️ **`kyc-service` exclut `!**/seeds/**` de `collectCoverageFrom`** (`package.json`) — alors qu'il n'a
  aucun répertoire `seeds/`. Y déposer le seed le rendrait **invisible aux seuils** : la logique
  d'idempotence et de conditionnement passerait les portes DoD sans qu'une seule ligne soit exécutée.
  C'est le jumeau exact de l'angle mort `*bootstrap*` (bugs du round-trip Kafka, STORY-076/108), et
  `PlatformRolesSeedService` en avait déjà tiré la leçon *dans son propre en-tête*. ⇒ le seed vit dans
  `src/modules/kyc/`, nommé `*-seed.service.ts` — **jamais** `seeds/`, **jamais** `*bootstrap*`.
- ⚠️ **L'objet d'abord, la métadonnée ensuite.** La story l'exige au titre du diagnostic (« des
  métadonnées sans objet donneraient le symptôme de `STORY-179` sans en être la cause ») — c'est donc un
  **ordre d'écriture**, pas une intention : si le dépôt MinIO échoue, la pièce **n'est pas** inscrite en
  base. L'invariant est testable, et il est testé.
- ⚠️ **`StorageBootstrapService` crée le bucket au boot**, également en `OnApplicationBootstrap`. L'ordre
  vient de l'ordre d'`imports` d'`app.module.ts` (`StorageModule` avant `KycModule`) : c'est vrai, mais
  ce n'est pas un contrat. Le seed ne s'y fie pas — il échoue **proprement** (avertissement, boot
  poursuivi, aucune métadonnée écrite) si le bucket n'est pas là.

### Ce que cet arbitrage ne règle **pas** — et qui n'est pas de cette story

- **`STORY-178` reste requise** et n'est **pas** absorbée ici : brancher `seedPlatformAdmin` au démarrage
  est son périmètre entier. Tant qu'elle n'est pas faite, le « **sans aucune commande manuelle** » du
  critère nº6 vaut pour **le dossier**, pas pour l'administrateur qui le regarde — la vérification
  passera par `npm run seed:admin`, et le dira.
- **Le dépôt de la console front est absent de l'espace de travail** (déjà constaté en `STORY-179`). Les
  trois `test.skip` d'`e2e/integration-gate.spec.ts` y vivent : ils sont **hors d'atteinte depuis ces deux
  dépôts**. La preuve navigateur les remplace, et l'item de DoD est transmis au front.

---

## Périmètre

Un seed **idempotent**, sur le patron de `seedPlatformAdmin` *(`upsert`, journalisation explicite
« créé » / « retrouvé »)*, produisant au minimum :

1. une **organisation** et son dossier KYC au statut **`UNDER_REVIEW`** ;
2. ses **deux pièces** (`RCCM`, `CFE`) — ⚡ **réellement déposées dans le bucket MinIO** ;
3. une **extraction OCR** portant un **écart déclaré ↔ lu** sur le numéro d'immatriculation.

### Trois exigences qui ont l'air décoratives et ne le sont pas

- ⚠️ **Les fichiers doivent exister dans le bucket.** Des métadonnées sans objet produiraient des
  URL présignées **valides pointant vers le vide** : c'est-à-dire le symptôme exact de `STORY-179`,
  sans en être la cause. Les deux se confondraient au diagnostic, et on « corrigerait » 179 sans
  jamais voir un document.
- ⚠️ **L'écart OCR est le seul cas qui démontre la confrontation** — et avec elle l'invariant
  **`DO-1`** *(l'OCR assiste, il ne décide pas)*. Un jeu de données où tout concorde ne prouve que le
  cas où l'écran n'a rien à dire.
- ⚠️ **Deux pièces, pas une** : la consolidation d'un dossier *(« on ne soumet que lorsque chaque
  pièce présente est marquée »)* est inobservable sur une pièce unique.

### Hors périmètre

Un jeu de données exhaustif *(dossier dégradé, pièce illisible, resoumission…)*. Un cas nominal
**complet** vaut mieux que six cas partiels : c'est le nominal qui est aujourd'hui invérifiable.

**Ajouts au hors-périmètre, tranchés au lancement :**

- ⛔ **Aucun événement émis par les seeds** — ni `identity.*` côté `auth`, ni `kyc.status.changed` côté
  `kyc`. Un seed écrit un **état de démonstration** ; il ne rejoue pas un cycle de vie. Conséquence
  assumée et **explicite** : l'organisation de démonstration n'apparaît dans **aucun read-model** de
  vertical (`expert-comptable` n'en saura rien), et son statut KYC n'y est pas répliqué. C'est sans effet
  sur l'objet de la story — la console d'administration lit `auth` et `kyc` **en direct**, jamais un
  read-model de vertical. Émettre depuis un seed exigerait outbox + transaction dans les deux services,
  pour alimenter des écrans qui ne sont pas ceux qu'on cherche à rendre vérifiables.
- ⛔ **Le branchement au boot de `seedPlatformAdmin`** → `STORY-178`, intacte.
- ⛔ **Le semis du catalogue** (module + version ACTIVE + référentiel) → story distincte, déjà identifiée
  dans l'action de `GAP-aucun-seed-de-donnees-de-demonstration`.

---

## Critères d'acceptation

1. Sur base **vierge**, `GET /admin/kyc?status=UNDER_REVIEW` renvoie au moins un dossier.
2. Rejouable : deux démarrages consécutifs ne créent ni doublon ni seconde pièce.
3. Les deux pièces sont **téléchargeables** par leur URL présignée *(⚠️ dépend de `STORY-179` pour
   l'être depuis un navigateur — ici, le service suffit)*.
4. L'extraction porte un écart nommé dans `discrepancies`, et les valeurs `declared`/`extracted`
   diffèrent réellement.
5. ⚠️ **Rien n'est semé hors développement** : le seed est conditionné comme celui de
   l'administrateur, et un environnement sans les variables démarre normalement, avec un
   avertissement.
6. ⚡ **Preuve navigateur depuis `:3110`** : `docker compose down -v` puis `up`, se connecter,
   ouvrir la file KYC, **ouvrir un dossier et voir ses deux pièces**, sans aucune commande manuelle.

---

## Definition of Done

- [ ] Les 6 critères vérifiés · `lint` 0 · couverture ≥ 90 %
- [ ] ⚡ **Vérifié sur volume vierge** — sur une base déjà peuplée, ce défaut ne se manifeste pas
- [ ] Les trois `test.skip` d'`e2e/integration-gate.spec.ts` **s'exécutent** au lieu de se sauter
- [ ] À tirer **avec `STORY-179`** : sans elle, on sème des pièces qu'on ne peut toujours pas voir
      *(✅ `STORY-179` est **done** depuis le 2026-08-07 — la précondition est levée)*
- [ ] Branches `MNV-180` **sur les deux dépôts**, deux PR rebase-mergées sur `dev` **ensemble**

---

## Progress Tracking

*(rempli au fil des phases — état trouvé, livrables, portes DoD, mutations, vérification docker,
revues, clôture)*

### Démarrage 2026-08-07 — état trouvé

- `kyc-service` : **aucun** répertoire de seed (confirmé), aucun hook de semis. Le seul
  `OnApplicationBootstrap` du service est `StorageBootstrapService` (création du bucket).
- `auth-service` : `seedPlatformAdmin` existe et reste un **script autonome que personne n'appelle**
  (`grep seedPlatformAdmin src/` = ses propres définitions et rien d'autre) — `STORY-178` toujours
  `not_started`. Les **rôles**, eux, sont bien semés au boot (`PlatformRolesSeedService`), qui sert de
  patron de référence.
- La file `UNDER_REVIEW` est donc vide sur toute stack fraîche, et le dossier n'est **ni listable ni
  ouvrable** : les deux moitiés du défaut, dans deux dépôts.

### Ce qui a été livré

**`auth-service`** — `DemoOrgSeedService` (`OnApplicationBootstrap`, patron `PlatformRolesSeedService`) :
upsert sur des `_id` **fixes** de l'organisation, de son utilisateur propriétaire (e-mail **vérifié**,
sinon `EmailVerifiedGuard` le bloquerait sur ses propres écrans) et du membership `TENANT_ADMIN`.

**`kyc-service`** — `KycDossierSeedService` : deux PDF **réels** déposés dans le bucket, puis les deux
pièces `SUBMITTED`, puis leur assistance OCR, puis le dossier `UNDER_REVIEW`. Les PDF sont **générés**
(`demo-pdf.util`), déterministes, avec une table `xref` aux offsets réellement calculés.

**Compose** — quatre variables sur `auth-service`, deux sur `kyc-service`, en `${VAR-défaut}` et **non**
`${VAR:-défaut}`, pour que `DEMO_ORG_ID= docker compose up` désactive **réellement** le semis.

### ⚡ Trois décisions prises contre l'énoncé, et pourquoi

1. **L'écart OCR porte sur la DÉNOMINATION, pas sur le numéro d'immatriculation.** Vérifié dans le code
   du producteur : `IdentityComparator.compare` (`document-service`) ne confronte **que** la dénomination
   en v1, et `DeclaredFields` ne transporte que `denomination`/`country` — le numéro n'y est pas.
   ⚠️ Semer un écart sur le numéro aurait fabriqué **une forme que le pipeline réel ne peut pas
   produire** : une donnée de démonstration qui ment sur le système qu'elle est censée rendre vérifiable.
   Le numéro **lu** reste dans `extracted` (les parseurs RCCM/CFE le reconnaissent réellement) et il est
   **imprimé sur la pièce** — l'opérateur lit à l'écran ce que la page affiche.
2. **Le statut n'est posé qu'à la CRÉATION** (`$setOnInsert`, dossier *et* verdict par pièce). Un
   opérateur qui approuve le dossier doit le retrouver approuvé après un redémarrage : un semis qui
   « réaligne » l'état effacerait à chaque boot la décision qu'on cherche justement à démontrer.
3. **L'objet avant la métadonnée** — pas un ordre d'écriture, un invariant de diagnostic. Si le dépôt
   MinIO échoue, la pièce n'est pas inscrite, et le dossier ne passe **pas** en revue.

### Portes DoD

| | `kyc-service` | `auth-service` |
|---|---|---|
| lint | 0 warning | 0 warning |
| build | OK | OK |
| unitaires | **349** — 96,26 / 92,2 / 95,28 / 96,18 | **754** — 97,2 / 90,54 / 97,79 / 97,23 |
| e2e | 73 | 187 |

`KycDossierSeedService`, `demo-pdf.util` et `DemoOrgSeedService` sont à **100 %** sur les 4 axes.

### Valeur probante — 14 mutations, 14 rouges (après 2 corrections)

| # | Mutation | Test viré au rouge |
|---|---|---|
| M1 | garde `NODE_ENV=production` retirée (kyc) | « REFUSE de semer en production » |
| M2 | métadonnée écrite **avant** l'objet | ordre du journal d'appel + « aucune métadonnée si le dépôt échoue » |
| M3 | statut du dossier en `$set` au lieu de `$setOnInsert` | « ne RÉALIGNE JAMAIS le statut » |
| M4 | `declared === read` dans l'écart | « declared et read diffèrent RÉELLEMENT » |
| M5 | verdict de pièce en `$set` | « le verdict n'est posé qu'à la création » |
| M6 | offsets `xref` décalés d'un octet | « pointe des offsets xref RÉELS » |
| M7 | `Tm` remplacé par `Td` | « coordonnées ABSOLUES, jamais relatives » |
| M8 | garde production retirée (auth) | « REFUSE de semer en production » |
| M9 | existence lue **après** l'upsert (auth) | « journalise créé sur base vierge » |
| M10 | `platformRole` non purgé | « n'attribue jamais de rôle plateforme » |
| M11 | vide traité comme présent | « traite une variable VIDE comme absente » |
| M12 | existence lue **après** l'upsert (kyc) | « créé puis retrouvé » |
| M13/M14 | `@IsNotEmpty()` réintroduit (les 2 dépôts) | « ACCEPTE les variables VIDES » |

⚠️ **M5 a d'abord été rouge pour la MAUVAISE raison** : fusionner `$setOnInsert` dans `$set` créait une
clé en double ⇒ **erreur de compilation**, pas une assertion. Rejouée sous une forme qui compile (les
deux champs déplacés dans le `$set` existant) ⇒ rouge sur l'assertion. Leçon `STORY-179`, reproduite.

⚡ **M9 a SURVÉCU au premier essai, et c'est le constat le plus instructif du lot.** Déplacer la lecture
d'existence **après** l'upsert — le défaut exact que `seedPlatformAdmin` documente en tête de fichier
(« sinon l'existence est toujours vraie après ») — laissait les **18 tests verts**. Cause : le double de
modèle répondait la **même chose avant et après** l'écriture, donc l'assertion ne distinguait plus
« créé » de « retrouvé ». *Un double qui ne simule pas l'effet de l'écriture ne peut pas garder une
règle qui porte sur l'ordre des lectures.* Les deux doubles portent désormais un état (`updateOne` rend
`exists` positif) ; M9 et M12 virent au rouge.

⚠️ **Le `git checkout --` de restauration a de nouveau emporté un correctif non commité** (incident
`STORY-144`, reconstaté en `STORY-179`) : le retrait de `@IsNotEmpty()` a été effacé par la restauration
de M13. Détecté et réappliqué. **Ne mutation-tester qu'un arbre commité** — la consigne existe, elle a
été suivie pour le code du semis, pas pour un correctif appliqué *pendant* la vérification docker.

---

### ⚡ Vérification docker — le défaut qu'aucun unitaire ne pouvait voir

**Le semis désactivé faisait ÉCHOUER LE BOOT au lieu de ne rien semer.**

```
auth-service | ERROR [ExceptionHandler] Error: Configuration d'environnement invalide :
             | DEMO_ORG_ID should not be empty; DEMO_ORG_OWNER_ID should not be empty; …
prospera-auth-service-1 is unhealthy
dependency failed to start: admin-panel
```

`@IsOptional()` de class-validator ne saute la validation que sur `undefined`/`null` — **une chaîne vide
la subit**. Or `${VAR-défaut}` (choisi exprès contre le piège `${VAR:-défaut}` de `STORY-173`) fait que
`DEMO_ORG_ID= docker compose up` transmet une chaîne **vide** : la façon documentée de désactiver le
semis **tuait l'IdP**, et `admin-panel` avec lui.

⚠️ **La règle « vide = absent » existait déjà, et elle était testée** — dans le service, où elle est
couverte par les seuils. **Une garde posée devant une autre la désarme** (leçon `STORY-146`) : le schéma
d'environnement s'exécutait avant, et rejetait ce que le service savait traiter. `@IsNotEmpty()` retiré
des 6 variables ; seul le **type** reste validé au schéma. 6 tests de régression, 2 mutations.

Un semis de confort ne doit **jamais** empêcher un service de démarrer — c'est la même politique que
Kafka absent au boot et que le bucket MinIO indisponible.

### Contrôle avant / après, sur stack NEUVE (`down -v`) dans les deux sens

**AVANT** — stack neuve, `DEMO_ORG_ID=` … (semis désactivé) :

```
auth /health HTTP=200   kyc /health HTTP=200   bff /health HTTP=200
WARN [DemoOrgSeedService]   Semis de démonstration ignoré : variable(s) absente(s) — DEMO_ORG_ID,
      DEMO_ORG_OWNER_ID, DEMO_ORG_OWNER_EMAIL, DEMO_ORG_OWNER_PASSWORD. Le service démarre
      normalement, la file de revue KYC restera vide.
WARN [KycDossierSeedService] Semis du dossier de démonstration ignoré : … DEMO_ORG_ID, DEMO_ORG_OWNER_ID.
bases : profils 0 | pieces 0 | orgs 0 | users 0
GET /admin/kyc?status=UNDER_REVIEW              → []
GET /admin/kyc-reviews?status=UNDER_REVIEW (BFF) → {"items":[],"total":0}
```

⇒ **critère nº5 prouvé** (démarrage normal + avertissement nommant chaque variable, rien de semé) **et**
contrôle négatif : c'est exactement l'état que la story décrit.

**APRÈS** — stack neuve, semis actif, **aucune commande de semis** :

```
LOG [DemoOrgSeedService]   Cabinet de démonstration « Cabinet Démonstration Prospera » créé
                            (orgId 68a1800000000000000001aa) ; propriétaire « proprio.demo@… » créé.
LOG [KycDossierSeedService] Dossier KYC de démonstration créé : 2 pièces (RCCM, CFE) déposées,
                            assistance OCR avec écart.
```

Base `kyc_service` (⚠️ collections en **pluriel Mongoose**, pas snake_case — `tenantkycprofiles`,
`kycdocuments` ; seule `document_extraction_assists` est nommée explicitement) :

```
profils: 1  [{tenantId: 68a18…01aa, status: "UNDER_REVIEW", submittedAt: …}]
pieces : 2  RCCM  SUBMITTED PENDING kyc/68a18…01aa/demo-rccm.pdf 1154o application/pdf v1
            CFE   SUBMITTED PENDING kyc/68a18…01aa/demo-cfe.pdf  1147o application/pdf v1
assists: 2  écart {field:"denomination", declared:"Cabinet Démonstration Prospera",
                   read:"CABINET DEMONSTRATN PROSPERA", kind:"mismatch"}
            extracted.registrationNumber = TG-LOM-2019-B-4471 / CFE-2019-LOM-00871
lien assist -> piece : true   (chaque documentId correspond à une pièce réelle)
```

Base `auth_service` : org `ACTIVE` + propriétaire `ACTIVE` e-mail **vérifié**, `platformRole` absent,
membership `TENANT_ADMIN` `ACTIVE`. Bucket MinIO : `demo-rccm.pdf`, `demo-cfe.pdf` **présents**.

**AC-01 / AC-03 — le dossier s'ouvre par le chemin de la console** (`GET /admin/orgs/:id` sur le BFF) :

```
HTTP=200  identity.name="Cabinet Démonstration Prospera"  kyc.status=UNDER_REVIEW
2 pièces, chacune avec une url présignée sur http://localhost:9000/… (STORY-179)
ocrSummary : {hasDiscrepancies: true, anyUnreadable: false, extractedCount: 2}
```

⚡ **La file porte la raison sociale** (`"name": "Cabinet Démonstration Prospera"`, `sources.identity:
"ok"`) — c'est l'arbitrage « deux dépôts » qui paie, exactement là où il était prédit.

**AC-03, poussé plus loin que « téléchargeable » : les octets servis sont ceux qui ont été générés.**

```
piece1 HTTP=200 %PDF-1.4 1154o sha256=2426550dd2ca8a843c8a
piece2 HTTP=200 %PDF-1.4 1147o sha256=633063212d8d87b09242
RCCM: genere=2426550dd2ca8a843c8a (1154o) | telecharge=2426550dd2ca8a843c8a | IDENTIQUE=true
CFE : genere=633063212d8d87b09242 (1147o) | telecharge=633063212d8d87b09242 | IDENTIQUE=true
```

Et le contenu est **lisible**, pas un octet de remplissage :
`(Numero d'immatriculation : TG-LOM-2019-B-4471)`, `(Denomination lue sur la piece : CABINET
DEMONSTRATN PROSPERA)` — le « lu » annoncé par l'assistance est ce que la page affiche.

**AC-02 — rejouable, mesuré deux fois** : `docker compose restart` des deux services ⇒ journaux
« **retrouvé** » des deux côtés, et `profils: 1 | pieces: 2 | pieces SUBMITTED: 2 | assists: 2 |
orgs: 1 | memberships: 1`, bucket inchangé (2 objets). Bonus : `npm run seed:admin` instancie un
contexte applicatif et **rejoue donc les deux semis** — il a lui aussi journalisé « retrouvé », sans
créer un seul doublon.

### ⚡ Critère nº6 — preuve NAVIGATEUR depuis `:3110`

Page servie sur `http://localhost:3110` (l'origine **réelle** de la console), Chrome headless, sur la
stack neuve ci-dessus :

```
origine=http://localhost:3110
LOGIN 200
FILE 200 total=1 nom=Cabinet Démonstration Prospera
DOSSIER 200 kyc=UNDER_REVIEW
PIECES 2 ecarts=[{"field":"denomination","declared":"Cabinet Démonstration Prospera",
                  "read":"CABINET DEMONSTRATN PROSPERA","kind":"mismatch"}]
  RCCM fetch=200 application/pdf 1154o
  CFE  fetch=200 application/pdf 1147o
RESULTAT: 2/2 PIECES AFFICHEES DEPUIS http://localhost:3110
objets PDF rendus dans le DOM : 2
```

Se connecter → ouvrir la file → **ouvrir un dossier** → **voir ses deux pièces**, sans aucune commande
manuelle **pour le dossier**.

⚠️ **Deux réserves, dites plutôt que masquées.**
1. **`npm run seed:admin` reste nécessaire** pour l'administrateur qui regarde l'écran : c'est le
   périmètre entier de `STORY-178`, délibérément non absorbé ici. Le « sans aucune commande manuelle »
   du critère vaut donc pour **le dossier**, pas pour l'opérateur.
2. **Le dépôt de la console front est absent de l'espace de travail** — la page de preuve appelle les
   **mêmes** endpoints du BFF, depuis la **même** origine, mais ce n'est pas le code de la console. Les
   trois `test.skip` d'`e2e/integration-gate.spec.ts` restent hors d'atteinte depuis ces deux dépôts :
   item de DoD **transmis au front**, avec cette preuve pour feu vert.

### ⚠️ Le correctif de compose ne vit dans aucun dépôt — recopié ici in extenso

La racine `PROSPERA/` n'est versionnée nulle part (`docker-compose.yml` compris) : hors CI, hors revue.
Bloc ajouté au service **`auth-service`** (les deux premières lignes seules sur **`kyc-service`**) :

```yaml
      # ─── STORY-180 : dossier KYC de DÉMONSTRATION ───────────────────────
      # ⚡ CES DEUX IDENTIFIANTS SONT LE SEUL LIEN entre le semis de
      # l'organisation (auth-service) et celui du dossier KYC (kyc-service) :
      # database-per-service interdit toute requête croisée. Les désaligner
      # produit un dossier ORPHELIN — listé dans la file de revue, `404` à
      # l'ouverture depuis la console (le BFF traite `auth` en dépendance dure).
      # Absents ⇒ aucun semis, démarrage normal avec un avertissement ; jamais
      # semés en production (refus porté par le code, pas par ce fichier).
      # ⚠️ `-` et NON `:-` : sur `${VAR:-défaut}` une variable VIDE réactive le
      # défaut (piège payé en STORY-173, reconstaté en STORY-179). Avec `-`,
      # `DEMO_ORG_ID= docker compose up` désactive RÉELLEMENT le semis — c'est
      # ainsi que le critère nº5 se vérifie sans éditer ce fichier.
      DEMO_ORG_ID: ${DEMO_ORG_ID-68a1800000000000000001aa}
      DEMO_ORG_OWNER_ID: ${DEMO_ORG_OWNER_ID-68a1800000000000000001bb}
      DEMO_ORG_OWNER_EMAIL: ${DEMO_ORG_OWNER_EMAIL-proprio.demo@prospera.local}
      DEMO_ORG_OWNER_PASSWORD: ${DEMO_ORG_OWNER_PASSWORD-chang3z-m0tD3PaSs3}
```
