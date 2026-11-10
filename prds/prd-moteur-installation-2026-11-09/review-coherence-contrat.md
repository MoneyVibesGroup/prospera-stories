# Revue de cohérence n° 2 : PRD Moteur d'installation, après réécriture

> **Date :** 2026-11-10 · **Objet relu :** `prds/prd-moteur-installation-2026-11-09/prd.md` (réécrit le
> 2026-11-10, 1 193 lignes) et `.memlog.md` (décisions T-01 → T-30).
> **Confronté à :** la revue 1 (`revue-1/review-coherence-contrat.md`, R-01 → R-29) ;
> `CONTRAT-DE-MODULE-2026-11-09.md` (C1 → C11, §1, §3, §6, §8 Q1 → Q5, §9) ;
> `PLAN-2-DEVS-8-SEMAINES-2026-10-26.md` (v3 : §5, §8 D1/D3) ; `prds/prd-reprise-donnees-2026-11-10/prd.md` ;
> `prds/prd-connecteurs-2026-11-10/prd.md` ; la fiche `stories/STORY-727.md` ; et le code de `dev`
> (`platform-catalog-service` `fec6adc`, `prospera-paiement-service` `0dcde70`, `auth-service`), en
> lecture seule.
> **Fichiers de code lus :** `entitlements/enums/entitlement-status.enum.ts`, `entitlements/terme.ts`,
> `kafka/entitlement-events.ts`, `entitlements/schemas/entitlement.schema.ts`,
> `entitlements/octroi-par-abonnement.ts` (+ service), `octroi-par-vertical.ts` (+ service),
> `propagation-des-packs.service.ts`, `suspension-par-impaye.ts` (+ service), `entitlements.service.ts`,
> `dto/upsert-entitlement.dto.ts`, `controllers/entitlements.controller.ts`, `packs/packs.seed-data.ts` ;
> paiement `domain/abonnement/echeancier.ts`, `grace.ts` ; auth `common/rbac/tenant-permission.enum.ts`,
> `organization-roles/organization-roles.service.ts`, `organization-roles/abonnements.client.ts`.

## Verdict

La réécriture a traité le fond de la revue 1 : la table d'états (§3.1), la lecture publiée pour la coque
(FR-34), les droits de tenant (FR-35), les deux lieux d'écrans (FR-36), la correspondance pack → menu
(FR-37), le manifeste (FR-38) et les six chemins (FR-4). **Elle n'est pas encore cohérente avec le code
qu'elle prétend projeter.** Trois points bloquent la spine de la coque. (1) L'**impayé** : le code
**suspend** à J+7 (STORY-280, arbitrage PO du 2026-11-08), alors que le PRD fait passer l'impayé par 30
jours de préavis puis une lecture seule, sans demander l'abandon de STORY-280. (2) La **règle de
priorité** du §3.1 cache au menu tout module ouvert par un chemin de droits (paiement, vertical,
opérateur), c'est-à-dire **tous les modules qui existent aujourd'hui**, alors que leur garde reste
ouverte. (3) Le « **socle de vertical** » n'est pas ce que le PRD en dit : c'est aussi le **package vendu
par contrat**, et le socle `distributeur` ouvre 7 codes sans terme dès la création de l'organisation, ce
qui vide SM-1 et FR-12 pour le distributeur.

| Suivi de la revue 1 | Nombre |
|---|:--:|
| résolu | 14 |
| partiel | 14 |
| non résolu | 1 |

| Nouveaux constats | Nombre |
|---|:--:|
| critical | 1 |
| high | 5 |
| medium | 12 |
| low | 3 |
| **Total** | **21** |

---

## 1. Suivi de la revue 1

| R | Sév. (rev. 1) | Statut | Ce qui reste |
|---|---|---|---|
| R-01 | high | **résolu** | FR-35 ; STORY-365 requalifiée. Nouveau défaut sur le préfixe `instance:` (N-06). |
| R-02 | high | **partiel** | La table d'états existe (§3.1) et l'espace est un déploiement. Mais « Installer » (§3, l. 256 : « dans l'espace d'essai ») contredit toujours le contrat §0/§1 (« poser `ACTIVE` »), et §8.4 ne demande pas d'amender le contrat (N-15). |
| R-03 | high | **partiel** | `PREAVIS`, « rappel » et lecture seule sont définis, et l'amendement de C2 est demandé. Mais la suspension automatique d'impayé de STORY-280 contredit tout le chemin (N-01), et le « rappel » est attribué à la mauvaise story (N-09). |
| R-04 | high | **résolu** | C13 demandée (§0, FR-38, §7, §8.4). Il manque l'**import** par organisation (N-17). |
| R-05 | high | **partiel** | Le §7 sépare bien A (catalogue) de B et C (spine). Mais le frontmatter (`service: platform-catalog-service`) et le titre ne sont pas modifiés. |
| R-06 | medium | **partiel** | C5 consomme le feu vert ; C7 et C8 sont complets. C1 décrit toujours ce que le moteur exige des **autres**, pas son propre manifeste (code, `depends`, `enrichiPar: [reprise, connecteurs]`). C5 omet ce que le code consomme déjà : `echeance.encaissee`, `paiement.abonnement.impayee/regularise`, `identity.org.created/updated`, la santé des Connecteurs. |
| R-07 | medium | **partiel** | FR-38 couvre la publication, la forme `depends: [{ code, raison }]` et `MANIFESTE_CYCLE`. Il manque la **garde de comparaison** source ↔ copie (Q1) et le refus d'une dépendance vers un code inconnu. §8.4 ne demande pas d'amender l'exemple de C1. |
| R-08 | low | **non résolu** | Aucune FR ne dit comment un module remet ses indicateurs IA de niveau 0 à l'agent d'instance. C13 (FR-38) n'en parle pas. |
| R-09 | high | **résolu** | Jalons au §0, ordre de sacrifice au §8.4, amendements du plan, du contrat §9 et d'AD-P17 demandés. La charge de Dev B n'est pas chiffrée (renvoyée au plan). |
| R-10 | high | **résolu** | Exception écrite à Q4, demandée au §8.4 ; effacement par module via C13. |
| R-11 | medium | **résolu** | FR-5 (« à l'installation seulement ») et §3.1 (combinaison `SUSPENDU`). |
| R-12 | medium | **partiel** | FR-37 : un code absent est « visible dans l'offre, non installable ». Mais le PRD ne dit pas où vit le **manifeste** d'un module qui n'a pas encore de dépôt (Q1 exige le dépôt du service). |
| R-13 | medium | **résolu** | §2.2 reformulé. |
| R-14 | high | **partiel** | Pack (vente) et socle de vertical (`VerticalPack`) sont séparés. Mais le code dément la définition du socle (N-04), et SM-1 parle encore de « pack distributeur ». |
| R-15 | medium | **résolu** | FR-8 (`MISE_EN_SERVICE_SANS_FEU_VERT`), §7 C5, « réception définitive » définie au §3. La correspondance lot ↔ sous-ensemble manque (N-13). |
| R-16 | medium | **partiel** | FR-36 place l'import du prospect dans `prospera-app`. Mais Reprise C8 dit encore « plus tard », et §8.4 ne lui demande pas de changer (N-13). |
| R-17 | medium | **partiel** | Le « dossier d'installation » liste ce qui est rejoué, et « à frais » est corrigé. Il manque le contrat de chaque propriétaire : rôles (`auth`), zones (`reseau`), comptes (N-14). |
| R-18 | medium | **partiel** | §4.C concilie AD-P16 (lire pour exploiter) et l'apprentissage (clause unique, registre). Mais §8.4 ne demande d'amender ni AD-P16 ni C11 §5 (« avoir la donnée sur nos serveurs ne donne pas le droit de la mettre en commun »). |
| R-19 | low | **partiel** | « environnement », « production » et « rapport d'import » sont corrigés. « Bascule » n'est toujours pas définie, alors que la Reprise (FR-15 à FR-19) et les Connecteurs (FR-3) l'emploient partout. |
| R-20 | critical | **résolu** | FR-34 et §3.1 : un état publié unique, une énumération fermée, l'état de l'instance. Reste à corriger sa projection sur le code (N-01, N-02, N-03, N-07). |
| R-21 | high | **résolu** | L'espace est une propriété du déploiement (§3.1) et figure dans la lecture de FR-34. |
| R-22 | high | **résolu** | FR-36, §7 C8. |
| R-23 | medium | **résolu** | FR-34, bloc « accueil », sous `[ASSUMPTION]` (T-29). |
| R-24 | medium | **résolu** | FR-34 : licence projetée en droits (source `licence`) ; gel et version figée = états d'instance. |
| R-25 | medium | **résolu** | FR-37 : menu par code, libellé commercial. |
| R-26 | low | **partiel** | Chaque bandeau a un public (§3.1). Mais « administrateurs » et « DG » ne sont pas des **droits** : la coque ne sait pas lesquels tester. |
| R-27 | high | **partiel** | La table des six chemins est fidèle aux quatre chemins du code. Il manque la régularisation, la suspension d'impayé et l'offre d'essai, ainsi que les refus applicables à chaque chemin (N-08). FR-12 dit encore « devient installable » alors que le chemin 2 **ouvre**. |
| R-28 | medium | **résolu** | FR-21 : N-1, règle nouvelle, version de plateforme définie. Reste un point de détail (N-21). |
| R-29 | low | **partiel** | L'en-tête et la note sur les identifiants stables sont corrigés. Le §3 dit toujours : instance sur site = « cette seule organisation » (l. 247), alors que FR-23 y place des comptes Money Vibes. |

---

## 2. Nouveaux constats

### 2.1 Projection des états publiés sur le code (§3.1, FR-34)

**Mesure.** `EntitlementStatus` = `ACTIVE | SUSPENDED | REVOKED` ; `statutEffectif()` rend `EXPIRED`
quand `status = ACTIVE`, `terme = ECHEANCE` et `echeanceLe ≤ maintenant`. Un statut non `ACTIVE` est
rendu tel quel. `entitlement.changed` v2 transporte `status`, `terme`, `echeanceLe`, `config`,
`versionCode`, mais ni `source` ni `suspension`.

| État publié | Projection annoncée | Tient-elle ? |
|---|---|---|
| `NON_INSTALLE` | absent | ✅ |
| `EN_INSTALLATION` | absent | ⚠️ « absent **ou `REVOKED`** » pour une réinstallation (N-20) |
| `DESINSTALLE` | `REVOKED` | ✅ |
| `EN_SERVICE` | `ACTIVE` | ✅ seulement si l'axe 2 est renseigné ; sinon ⛔ (N-03) |
| `ESSAI_PROSPECT{finLe}` | `ACTIVE`, échéance `finLe` | ⛔ indiscernable d'`ACTIF` ; après `finLe`, se lit `LECTURE_SEULE` (N-02) |
| `PREAVIS{finLe}` | `ACTIVE`, échéance repoussée de 30 j | ⛔ indiscernable d'`ACTIF` ; coupé par l'impayé de J+7 (N-01, N-02) |
| `LECTURE_SEULE` | `ACTIVE` échu (`EXPIRED`) | ✅ côté statut ; ⚠️ sémantique de la garde (N-11) |
| `SUSPENDU` | `SUSPENDED` | ✅ (`statutEffectif` rend `SUSPENDED` avant le terme, d'où `SUSPENDU` > `LECTURE_SEULE`) |

Six états sur huit se projettent sur le code. `ESSAI_PROSPECT` et `PREAVIS` ne se projettent pas sans un
nouveau champ, et `EN_SERVICE` dépend d'une règle de priorité qui ne tient pas (N-03).

### N-01 · critical · §3 « Suspendre » (l. 259), §3.1 axe 3 (l. 396), FR-32 (l. 971-976), FR-41 (l. 818-819) : l'impayé suspend dans le code et la décision du PO, mais le PRD le fait passer par un préavis

- **Citation (FR-41) :** « Un impayé suit le chemin de FR-32 (préavis, puis lecture seule). La suspension
  complète (`SUSPENDU`) reste une sanction décidée par Money Vibes. » §3 : « **Suspendre** : une sanction
  décidée par Money Vibes (litige, **impayé persistant**, STORY-280) ».
- **Code :** `prospera-paiement-service/src/domain/abonnement/echeancier.ts` pose deux jalons par
  échéance : `PREAVIS` à J-7 (`HORIZON_PREAVIS_JOURS = 7`) et `IMPAYE` à J+7 (`DELAI_IMPAYE_JOURS = 7`).
  Le jalon `IMPAYE` publie `paiement.abonnement.impayee`. Le catalogue
  (`suspension-par-impaye.service.ts`) passe alors **automatiquement** en `SUSPENDED`, avec
  `motif: IMPAYE`, tous les droits à terme du contrat ; `paiement.abonnement.regularise` les rétablit.
  En-tête du service : « arbitrage PO du 2026-11-08, point 2 de STORY-727 ». La grâce de STORY-281
  (`paiement:grace:attribuer`, 30 j par défaut, 90 au plus) décale le constat.
- **Écart :** sur la plateforme, un abonné qui ne paie pas suit aujourd'hui ce chemin : J0 `EXPIRED`
  (lecture seule, 727 lot 4), puis J+7 `SUSPENDED` (module **caché** et fermé d'après le §3.1). Le PRD
  promet à sa place 30 jours où « tout fonctionne », puis une lecture seule **sans fin**, et réserve la
  suspension à une décision humaine. Ces deux décisions du PO (2026-11-08 et 2026-11-10) se
  contredisent. Le memlog (T-15) ne dit pas que la première est abandonnée. §8.4 demande seulement
  d'« ajuster » 727 lot 4. Il ne dit rien de STORY-280, de STORY-281, du jalon `IMPAYE`, ni du
  consommateur `suspension-par-impaye`. La spine de la coque ne peut pas savoir si un impayé produit
  `PREAVIS` ou `SUSPENDU`.
- **Correction :** faire trancher le PO, puis l'écrire. Deux options. (a) **Le PRD l'emporte :** §8.4
  ajoute « STORY-280 et STORY-281 : l'impayé ne suspend plus ; le jalon `IMPAYE` ne produit plus
  `SUSPENDED` ; le consommateur `suspension-par-impaye` est retiré ou réservé à la sanction ». Il faut
  aussi dire ce que devient la grâce de 281. (b) **Le code l'emporte :** le §3.1 écrit la séquence réelle
  (`PREAVIS` de J0 à J+7, puis `SUSPENDU`), et FR-32 et FR-41 sont corrigées. Dans les deux cas, définir
  « impayé persistant » par une durée.

### N-02 · high · §3.1 table « état publié », lignes `ESSAI_PROSPECT` et `PREAVIS` ; FR-33 (l. 650-663) : deux états ne se lisent pas sur l'entitlement

- **Citation :** « `PREAVIS{finLe}` | `ACTIVE`, échéance repoussée de 30 jours » ; « `ESSAI_PROSPECT{finLe}`
  | `ACTIVE`, échéance `finLe` » ; FR-33 : « À son terme, l'accès se ferme … → **30 jours pour exporter ou
  signer** ».
- **Écart :**
  1. **`PREAVIS`** : repousser `echeanceLe` de 30 jours donne un droit `ACTIVE` dont l'échéance est dans
     le futur, donc indiscernable d'un `ACTIF`. Le moteur ne peut pas publier `PREAVIS{finLe}` sans
     retenir l'échéance d'origine. Et `terme.ts` impose « le même calcul des deux côtés, ou le droit
     s'arrête avant la facture » (`echeanceSuivante`, `echeanceProlongee` = maximum). Une échéance
     décalée de 30 jours côté catalogue diverge de celle de `paiement`, et un renouvellement peut
     garder l'échéance la plus lointaine.
  2. **`ESSAI_PROSPECT`** : à `finLe`, `statutEffectif` rend `EXPIRED`. La règle de priorité publie
     alors **`LECTURE_SEULE`** (visible, lecture et export), alors que FR-33 dit « l'accès se ferme ».
     Fermer vraiment l'accès demande d'écrire un statut à une date, ce que `terme.ts` refuse par principe
     (« Un statut LU, jamais écrit … une tâche tombe »). Enfin, la période « 30 jours pour exporter »
     n'a pas d'état publié : il manque un 9ᵉ état, ou bien il faut dire que c'est `LECTURE_SEULE`.
  3. Rien ne distingue un essai d'un contrat dans l'entitlement : `source` existe dans le schéma, mais
     ni `entitlement.changed` ni FR-34 ne le portent.
- **Correction :** ajouter à FR-34 la **représentation** de chaque état. Par exemple, au droit : `essai:
  { finLe }`, `preavis: { echeanceContrat, finLe }`, en champs additifs de `entitlement.changed` v2, ou
  dans la seule vue du moteur. Dire si la fin d'essai donne `LECTURE_SEULE` (30 jours d'export) ou un état
  fermé, et par quel mécanisme sans tâche planifiée : statut lu, calculé comme `EXPIRED`. Pour
  `PREAVIS`, garder l'échéance du contrat intacte et **calculer** `PREAVIS` = échéance passée de moins de
  30 jours. La garde reste alors ouverte grâce à un `statutEffectif` étendu, et c'est ce qui doit être
  écrit, au lieu de « échéance repoussée ».

### N-03 · high · §3.1 « L'axe 2 prime » (l. 403-404) × FR-4 chemins 2 à 5 × FR-34 « le menu et la garde ne se contredisent jamais »

- **Citation :** « L'axe 2 prime ; s'il vaut `INSTALLE`, l'axe 3 décide » ; « Le droit `ACTIVE` n'est posé
  qu'à l'entrée en `INSTALLE` … Seuls les chemins de droits nommés de FR-4 (paiement, socle de vertical,
  opérateur) font exception. »
- **Code :** les chemins 2, 3 et 4 **créent** des entitlements `ACTIVE` (`decisionDOctroi` →
  `CREER` ; `decisionVerticale` → `CREER` ; `propagation-des-packs` → `create`), avec la source
  `abonnement:`, `vertical:` ou `pack:`. Aucun d'eux ne connaît une « installation ». Tous les droits
  existants sur `dev` viennent de ces chemins ou du `PUT` opérateur.
- **Écart :** pour un droit ouvert par un de ces chemins, l'axe 2 vaut `NON_INSTALLE`, puisqu'aucune
  installation n'a eu lieu. La règle de priorité publie donc `NON_INSTALLE` (caché), alors que la garde
  C2 voit `ACTIVE` et sert le module. Le test en matrice de FR-34 échoue sur le premier distributeur
  existant. Le jour de la mise en route du moteur, **tous les modules de toutes les organisations
  disparaîtraient du menu**. Le PRD dit que ces chemins « font exception » à la pose d'`ACTIVE`, mais pas
  quel état d'axe 2 ils produisent.
- **Correction :** écrire : « un chemin de droits (2 à 6) pose l'axe 2 à `INSTALLE` dans l'espace où il
  s'exécute (le réel sur la plateforme) ; un droit `ACTIVE` sans trace d'installation se publie
  `EN_SERVICE` ». Ajouter une conséquence testable pour la **reprise de l'existant** : chaque droit
  `ACTIVE` déjà en base reçoit son état d'axe 2 à la mise en route du moteur.

### N-04 · high · §3 « Socle de vertical » (l. 236-239), FR-37 (l. 737), FR-12 (l. 621-623), SM-1 (l. 1105) : le `VerticalPack` est aussi le package vendu, et le socle distributeur ouvre 7 codes sans contrat

- **Citation :** « Socle de vertical : la liste de codes que toute organisation d'un vertical reçoit à sa
  création, sans contrat (STORY-727, lot 7) … Ce n'est **pas** un produit vendu. » FR-37 : « Le socle de
  vertical (`VerticalPack`) n'est jamais présenté comme un pack au client. » SM-1 : « un **pack
  distributeur** installé en une action dans l'espace d'essai ».
- **Code et fiche :** STORY-727 lot 1 : « L'abonnement porte `packs` (≤ 10 clés) » ; lot 2 : « Une
  échéance soldée ouvre tous les modules des packages ». `suspension-par-impaye.service.ts` et
  l'octroi lisent `fait.packs` dans la collection `VerticalPack` (`LectureDesPacks.findByKeys`). Le
  `cabinet` **achète** le package `cabinet` (`octroi-par-vertical.ts` : « `cabinet` n'y est PAS : un
  cabinet achète ses packages par contrat »). `distributeur` = `balance, bilan, pdv, stock, catalogue,
  commande, facturation`, ouvert **sans terme** dès `identity.org.created`.
- **Écart :**
  1. Le `VerticalPack` est **à la fois** le socle offert et l'unité de vente du contrat. FR-12 « précharge
     l'offre depuis le contrat », mais ce contrat parle en clés `VerticalPack` et en options, pas en
     packs commerciaux. FR-37 n'a pas la colonne qui traduit l'un en l'autre, et le calcul de
     `MODULE_NON_SOUSCRIT` n'a pas de base définie.
  2. Pour un distributeur, 7 codes, dont une bonne part de « Terrain & Ventes » et de « Stock &
     Logistique », sont ouverts **sans contrat, sans essai, sans terme**, dès la création. FR-12 (« le
     contrat fait foi »), FR-8 (essai, puis réel) et FR-32 (préavis, puis lecture seule) ne s'appliquent
     pas à ces codes, et le PRD ne le dit pas.
  3. SM-1 et le plan (§5, sem. 8 : « le pack distributeur installé en une action sur une organisation
     **vierge** ») ne peuvent pas se démontrer sur une organisation `distributeur`, que le chemin 4
     remplit à sa création.
- **Correction :** redéfinir « socle de vertical » à partir du code. `VerticalPack` = **package** :
  vendu par contrat (cabinet, options) **ou** inclus par vertical (`distributeur`, `imf-sfd`,
  `assurance-cima`). Ajouter à FR-37 la colonne « package du contrat → codes ». Écrire que les codes
  inclus par vertical sont hors FR-12 et hors FR-32. Réécrire SM-1 avec la liste exacte des codes
  démontrés et l'organisation de départ (vertical, ou organisation sans vertical). Faire trancher le PO :
  le socle `distributeur` doit-il garder `pdv`, `stock`, `commande` et `facturation` « inclus », alors
  qu'ils sont vendus dans les packs ?

### N-05 · high · FR-33, §3.1 axe 1, FR-8, FR-10 : l'organisation du prospect et ses deux déploiements ne sont pas situés

- **Citation :** §3.1 : « l'espace d'essai et l'espace réel sont deux déploiements, chacun avec son
  adresse et ses droits » ; FR-33 : « Le prospect n'a **aucun accès à l'espace réel** » ; FR-10 : « se
  rafraîchit depuis l'espace réel … par organisation ».
- **Écart :** une organisation naît par `identity.org.created` dans **un** `auth-service`. (a) Si le
  prospect est créé dans le déploiement réel, le chemin 4 lui ouvre aussitôt le socle `distributeur`
  **dans le réel**, ce que FR-33 interdit. (b) S'il est créé dans le déploiement d'essai seulement, sa
  signature exige de créer l'organisation dans le réel. Le chemin 4 y ouvre alors les 7 codes **avant**
  le rejeu du dossier d'installation et avant le feu vert, ce qui contourne
  `MISE_EN_SERVICE_SANS_FEU_VERT`. (c) Le rafraîchissement (FR-10) et le rejeu (FR-8) supposent la
  **même identité d'organisation** dans les deux déploiements (même `orgId`, ou une table de
  correspondance). Le PRD ne le dit nulle part.
- **Correction :** une FR « Une organisation dans deux espaces ». Elle dit où naît une organisation
  (cliente ou prospect), comment elle apparaît dans l'autre espace (même identifiant, créée par le
  moteur), et que le chemin 4 ne s'exécute pas dans le réel avant la mise en service d'une organisation
  issue d'un essai.

### N-06 · high · FR-35 (l. 701-709) : les droits `instance:*` et le filtre « attribués ∩ ouverts » ne tiennent pas dans `auth-service`

- **Citation :** « Droits effectifs d'un membre = droits attribués ∩ droits des modules ouverts » ;
  « `instance:mise-a-jour:consulter`, … `instance:bilan:consulter` ».
- **Code :** `moduleDePermission()` : « son premier segment, qui EST le code de module de
  l'entitlement … C'est sur lui que se vérifie l'abonnement de l'organisation (STORY-167 AC 2) ».
  `exigerModulesSouscrits` refuse `CODE_TENANT_ROLE_MODULE_NON_SOUSCRIT` si ce module n'est pas
  `ACTIVE`. `TENANT_PERMISSION_FORMAT = /^[a-z]+:[a-z-]+:[a-z]+$/`. `AbonnementsClient` lit le
  `status` **brut** (sans le terme) et seulement au moment de **composer** un rôle (« un geste rare …
  hors du chemin chaud »).
- **Écart :**
  1. Aucune organisation n'a d'entitlement `instance`. Ces droits ne peuvent donc pas entrer dans un
     rôle : refus `MODULE_NON_SOUSCRIT`. Ils contredisent aussi C7 (« leur préfixe est le code du
     module »).
  2. Le format refuse un code de module à tiret (`pi-spi`, `finance-transactions`, présents au seed).
     La forme `<code>:<objet>:<action>` de FR-35 et de C7 ne vaut donc pas pour tous les modules.
  3. Le filtre « ∩ modules ouverts » n'existe nulle part. `perms[]` n'est pas filtré à
     l'authentification, et le contrat interdit d'appeler le catalogue sur ce chemin. Un module
     `EXPIRED` est vu `ACTIVE` par `auth`.
- **Correction :** enregistrer un code de module pour le moteur, par exemple `instance`, dans le socle
  de **toute** organisation, sans terme et non suspendable, ou bien écrire une exception nommée dans
  STORY-167 AC 2. Dire **où** se calcule l'intersection : dans la coque et dans la garde de chaque module
  (C2), à partir de l'état publié, et pas dans `perms[]`. Signaler au contrat C7 la limite du format sur
  les codes à tiret.

### N-07 · medium · FR-34 (l. 684, 692-693), §7 C5 : « une vue, jamais une seconde source » est faux, et le canal n'est pas nommé

- **Citation :** « Les services continuent de lire `entitlement.changed` (C2) : l'état publié en est une
  **vue**, jamais une seconde source » ; « visible par la coque **en moins d'une minute** ».
- **Écart :** l'axe 2 (`EN_INSTALLATION`), l'espace, le gel, l'accueil et les droits déclarés **ne sont
  pas** dans `entitlement.changed`. L'état publié est donc une **source** pour ces champs, et le moteur
  en devient le propriétaire (C3). Les états qui dépendent du temps (fin d'essai, fin de préavis) changent
  sans événement : la promesse « < 1 min » n'est tenable que si l'état est **calculé à la lecture**, comme
  `statutEffectif`. Le PRD ne dit pas non plus si la lecture est une route (laquelle, avec quel droit) ou
  un topic.
- **Correction :** écrire « l'état publié est **calculé à la lecture**, à partir de l'entitlement (statut,
  terme) et des faits propres au moteur (installation, espace, instance) ; une route de lecture par
  organisation et par espace ». Garder « jamais une seconde source » pour le seul **droit** (statut et
  terme).

### N-08 · medium · FR-4 (l. 484-510) : la liste des chemins se dit complète, mais il en manque trois, et les refus ne sont pas répartis par chemin

- **Citation :** « Les chemins sont **nommés** ; il n'en existe pas d'autre » ; « Retirer la vérification
  … fait échouer les tests **des six chemins** » ; ordre des refus `MODULE_NON_SOUSCRIT`,
  `MODULE_HORS_LICENCE`, `MODULE_DEPENDANCE_MANQUANTE`.
- **Code :** `suspension-par-impaye.service.ts` **rétablit** `SUSPENDED → ACTIVE` sur
  `paiement.abonnement.regularise`. C'est une ouverture, hors de la liste. L'offre d'essai (FR-33) pose
  une échéance `finLe`, ce que le `PUT` opérateur ne sait pas faire (`UpsertEntitlementDto` n'a ni
  `terme` ni `echeanceLe`) : c'est un **septième** chemin. Les chemins 2, 3 et 4 sont des
  **consommateurs Kafka** : un 422 n'y a personne à qui répondre. 727 transforme ces cas en écarts nommés
  (`PACK_INCONNU`, `REFERENTIEL_REQUIS`).
- **Correction :** ajouter « 7. Régularisation d'un impayé » et « 8. Offre d'essai ». Pour chaque chemin,
  dire quels refus s'appliquent : `MODULE_NON_SOUSCRIT` ne vaut ni pour 4 ni pour 5. Dire ce que devient
  un refus sur un chemin asynchrone (écart nommé, journalisé, visible au bilan). Corriger FR-12 :
  « Un module ajouté au contrat est **ouvert** au paiement (chemin 2) », et pas « devient
  installable ».

### N-09 · medium · §8.4 ligne STORY-727 (l. 1182), §3 « Rappel » / « Préavis » (l. 297-299) : le « rappel » est attribué à la mauvaise story, et le mot `PREAVIS` change de sens

- **Citation :** « STORY-727 | Lot 4 : préavis de 30 jours avant la lecture seule ; « préavis » de 7 jours
  renommé « rappel » ».
- **Code :** le préavis de J-7 appartient à `paiement` (STORY-280 et 281) : `HORIZON_PREAVIS_JOURS`, la
  nature de jalon `'PREAVIS'`, `CODE_SUSPENSION_SANS_PREAVIS`. La clef d'idempotence
  `<contrat>:<échéance>:PREAVIS` en dépend. 727 n'a pas de préavis.
- **Écart :** l'amendement est adressé à une story qui ne porte pas ce code. Renommer la nature
  `PREAVIS` change aussi les clefs des jalons déjà posés. Tant que le code garde `PREAVIS` pour « avant »
  et que l'état publié prend `PREAVIS` pour « après », le même mot a deux sens dans le même produit.
- **Correction :** adresser le renommage à STORY-280/281, dans `paiement-service` et dans les modèles de
  notification, en gardant la valeur technique ou avec une migration des clefs. À défaut, renommer
  l'état publié (par exemple `ECHU_EN_SURSIS`).

### N-10 · medium · §3 « Délai de grâce » (l. 288), FR-15, QB-1 : le mot entre en collision avec la grâce de `paiement`

- **Citation :** « **Délai de grâce** : 30 jours sans contact (comme Odoo). Au-delà, l'instance passe en
  gel. »
- **Code :** `paiement` `domain/abonnement/grace.ts` : une **grâce** est un délai **accordé** par un
  humain sur un impayé (`paiement:grace:attribuer`, 30 j par défaut, 90 au plus, jalon `FIN_DE_GRACE`).
- **Écart :** deux « grâces » de 30 jours, l'une sur le silence d'une instance, l'autre sur le paiement,
  vont s'afficher dans la même console Money Vibes. Le §3 promet « aucun synonyme », mais l'homonyme
  est pire.
- **Correction :** renommer le terme du PRD, par exemple « délai de silence ». Citer la grâce de paiement
  dans le §3 pour l'en distinguer.

### N-11 · medium · FR-32 (l. 977-980), FR-35 (l. 702-703), §3.1 ligne `LECTURE_SEULE` : trois définitions de la lecture seule

- **Citation :** FR-32 : « consulter, rechercher, exporter et **produire les états réglementaires** restent
  ouverts ; saisir, encaisser, envoyer et synchroniser par connecteur sont fermés » ; FR-35 : « seuls
  restent effectifs les droits de consultation et d'export ».
- **Code et fiche :** 727 lot 4 : « GET/HEAD/OPTIONS passent, **toute écriture** ⇒ 403
  `ABONNEMENT_EXPIRE` », avec une exception dans `dossier-service`. Le mécanisme est déjà livré dans
  8 services.
- **Écart :** trois mécanismes : par **verbe HTTP** (code), par **catégorie d'action** (FR-32), par
  **droit** (FR-35). Produire un état BCEAO ou lancer un export est en général un `POST`, donc refusé par
  le code. Le test en matrice de FR-34 ne peut pas avoir d'attendu unique.
- **Correction :** choisir un mécanisme. Par exemple, garder le verbe (727) et ajouter une **liste blanche
  déclarée au manifeste** (routes d'export et d'états autorisées en lecture seule), à verser dans C13.
  Aligner FR-35 sur ce choix et retirer l'`[ASSUMPTION]`.

### N-12 · medium · FR-9 (l. 585-594) × PRD Connecteurs : la règle « reprise » par les Connecteurs n'y est pas

- **Citation (FR-9) :** « **Le PRD Connecteurs reprend cette règle.** » §8.4 : « PRD Connecteurs | Reprendre
  la règle des connecteurs en essai (FR-9) ».
- **Constat :** le PRD Connecteurs, finalisé après le moteur (commit `f7528e3`, « plus de question
  ouverte »), ne contient ni bac à sable, ni interception, ni `ECRITURE_REELLE_DEPUIS_ESSAI`, ni
  identifiants distincts par espace. Il ne parle pas non plus de la lecture seule (FR-32 : « synchroniser
  par connecteur [est] fermé »). Pour une IMF dont le logiciel **reste la référence** (UJ-3), couper la
  synchronisation laisse Prospera se périmer en silence.
- **Correction :** au présent, FR-9 doit dire « **doit** reprendre ». Dans le PRD Connecteurs, ajouter la
  cascade (bac à sable, interception, interception forcée, réel jamais) et le comportement en
  `LECTURE_SEULE` : entrant seulement, ou arrêt avec une mention de fraîcheur. Ces deux ajouts sont à
  faire valider ensemble le 13/11.

### N-13 · medium · FR-8 (l. 575-576), §3 « Réception définitive » × PRD Reprise (FR-3, FR-15, FR-19, C8, QR-2)

- **Constat :**
  1. La Reprise garde ses fichiers « jusqu'à la réception définitive » **par reprise** (FR-3, QR-2). Le
     moteur enregistre la réception **par sous-ensemble de l'offre**. Aucun des deux PRD ne dit quels
     lots une réception partielle libère.
  2. Reprise C8 : « Écrans dans la console Money Vibes ; **plus tard** dans `prospera-app` pour le
     libre-service ». Moteur FR-36 et Reprise FR-19 : libre-service du prospect **en février**, dans
     `prospera-app`. §8.4 ne demande pas à la Reprise de corriger C8.
  3. L'effacement de l'essai prospect (FR-33, C13) n'apparaît pas dans la Reprise, alors qu'elle garde
     des fichiers sources et des tables de correspondance du prospect.
  4. Feu vert : ✅ cohérent (Reprise FR-15 : « fait publié … avec le lot » ; moteur FR-8 : « sur le lot
     rejoué dans le réel »).
- **Correction :** compléter la ligne « PRD Reprise » du §8.4 : C8 en `prospera-app` dès février ;
  réception par sous-ensemble = libération des lots de ce sous-ensemble ; effacement du prospect (C13).

### N-14 · medium · §3 « Dossier d'installation » (l. 271-272), FR-33, §7 C3 : le rejeu écrit chez d'autres propriétaires sans contrat nommé

- **Citation :** « offre, tables de correspondance, rôles, zones, réglages. Nommé, versionné, journalisé » ;
  §7 C3 : « n'écrit dans aucun autre module ».
- **Écart :** les rôles appartiennent à `auth-service`, les zones à `reseau`, les tables de
  correspondance à la Reprise. Rejouer le dossier, c'est écrire chez chacun, donc par un contrat C5 de
  chaque propriétaire, qu'aucun PRD ne nomme. Les **comptes** (FR-6 : « chaque compte créé … invitation
  envoyée ») ne figurent pas dans le dossier : on ne sait pas si les utilisateurs de l'essai existent dans
  le réel.
- **Correction :** pour chaque élément du dossier, nommer son propriétaire et son point d'import
  (endpoint ou topic). Ajouter « comptes et invitations » ou dire qu'ils sont recréés. Inscrire au
  gabarit C13 « importer la part d'un dossier d'installation qui vous appartient ».

### N-15 · medium · §8.4 ligne « Contrat de module » (l. 1180) : les définitions du contrat que le PRD change ne sont pas listées

- **Écart :** le PRD redéfinit, contre le contrat §0 et §1 : **Installer** (contrat : « poser `ACTIVE` » ;
  PRD : « dans l'espace d'essai » ; §3.1 : `INSTALLE` aussi dans le réel), **Pack** (contrat :
  `VerticalPack` ; PRD : ensemble de modules commerciaux), **Suspendre** (contrat : « impayé,
  STORY-280 » ; PRD : sanction décidée). Il change aussi la forme de `depends` (C1) et ajoute le préavis.
  §8.4 ne demande que C2, C12, C13, Q4 et §9.
- **Correction :** ajouter à la ligne : « §0 et §1 : Installer, Pack, Suspendre, Expiré (préavis) ; C1 :
  `depends: [{ code, raison }]` et nouveaux champs du manifeste ; C11 §5 : clause unique de la
  plateforme ».

### N-16 · medium · FR-41 (l. 812-813) × FR-16 (l. 853-854) : la vérification quotidienne transporte une licence alors qu'elle « n'envoie aucune donnée »

- **Citation :** FR-41 : « la décision part dans la réponse au prochain contact, donc en 24 heures au plus
  (**vérification quotidienne**, FR-16) » ; FR-16 : « Elle vérifie chaque jour s'il existe un correctif de
  sécurité … **cette requête n'envoie aucune donnée** ».
- **Écart :** pour recevoir **sa** licence, l'instance doit s'identifier, ce qui est une donnée de
  niveau 0. La requête quotidienne change donc de nature. La promesse « en 24 heures » repose sur elle.
- **Correction :** écrire que la vérification quotidienne porte l'identifiant de l'instance et son numéro
  de licence (niveau 0, FR-26), ou bien ramener FR-41 à « au prochain signal hebdomadaire (7 jours) ».

### N-17 · medium · §0, FR-38, §7 C12/C13 : les nouvelles clauses ne sont pas reportées au gabarit, ni à leurs premiers débiteurs

- **Constat :**
  1. Le contrat §6 impose « une section Contrat de module de **onze lignes** » ; avec C12 et C13, il en
     faut treize, et `bmad-check-implementation-readiness` vérifie onze lignes. §8.4 ne demande pas de
     modifier le §6.
  2. FR-10 (rafraîchissement **par organisation**) exige que chaque module sache **importer** la part
     d'une organisation dans l'essai. C13 ne prévoit qu'« exporter et effacer ».
  3. Les PRD Reprise et Connecteurs ont encore un tableau C1 → C11. Ils sont pourtant les premiers
     concernés par C13 : interception en essai (Connecteurs) et effacement du prospect (Reprise).
- **Correction :** C13 = « … exporter, **importer** et effacer par organisation » ; §8.4 : « contrat §6,
  13 lignes » ; ajouter C12 et C13 aux deux PRD frères.

### N-18 · medium · FR-17, variante plateforme (l. 878-882) : les interrupteurs de changement sont une obligation de module hors contrat

- **Citation :** « Tout changement de **comportement** visible des utilisateurs est livré derrière un
  **interrupteur de changement** par organisation … à sa date limite (30 jours), il s'allume seul ».
- **Écart :** chaque module doit lire un interrupteur par organisation, avec une date limite, et prouver
  qu'il ne survit pas à cette date. Ce n'est ni dans C12, ni dans C13, ni dans un champ du manifeste.
  On ne sait pas non plus où vit l'interrupteur (`Entitlement.config` existe et transporte déjà
  `dossiersMax`). Sans clause, les PRD des lots 2 à 4 l'ignoreront. C'est le même défaut que R-04.
- **Correction :** l'ajouter à C12 (« tout changement de comportement est derrière un interrupteur
  déclaré au manifeste ») et nommer son support : par exemple `config.interrupteurs` dans
  `entitlement.changed`, ou la vue de FR-34.

### N-19 · low · FR-4 (l. 509-510) : un cycle ne se détecte pas dans la CI d'un seul dépôt

- **Citation :** « Chaque dépôt de module détecte le cycle dans sa CI, avant la publication (FR-38). »
- **Écart :** un cycle traverse plusieurs manifestes, alors qu'un dépôt ne voit que le sien. Seul le
  catalogue, qui détient toutes les copies (Q1), voit le graphe.
- **Correction :** « le catalogue refuse à la publication ; la CI d'un dépôt peut vérifier son manifeste
  contre la copie publiée du graphe ».

### N-20 · low · §3.1 ligne `EN_INSTALLATION`, colonne « Droit » (l. 409)

- **Écart :** pour une réinstallation (FR-39), l'entitlement existe déjà en `REVOKED`. Les chemins 2, 3 et
  4 ne rouvrent jamais un `REVOKED` (`INCHANGE` / `REVOQUE`). Aujourd'hui, seul le `PUT` opérateur le
  fait.
- **Correction :** « absent, ou `REVOKED` pour une réinstallation ; seul le chemin 1 le rouvre ».

### N-21 · low · §3 « Version de plateforme » (l. 304), FR-17 (l. 876), FR-21 : la version de plateforme coexiste avec une version épinglée par organisation

- **Code :** `Entitlement.versionCode` épingle une version **par organisation et par module**. L'octroi
  retient la plus haute version `ACTIVE` du moment, donc deux organisations ouvertes à deux dates
  peuvent avoir deux versions.
- **Écart :** FR-17 sur la plateforme (« code promu pour toutes les organisations ») suppose que la
  promotion réécrit `versionCode` pour tous. Le PRD ne le dit pas, ni ce que devient l'épinglage.
- **Correction :** « une promotion de version de plateforme met à jour `versionCode` de tous les droits
  concernés (une seule écriture, journalisée) ».

---

## 3. Contrôles sans écart

- **Q2** (FR-3, `MODULE_REQUIS_PAR` 409), **Q3** (FR-5, §3.1 combinaison `SUSPENDU`), **Q5** (`depends`
  par code, `raison` en plus) : respectées.
- **Q4** : l'exception est écrite, bornée à l'essai prospect, et demandée au contrat.
- **C9** : `DELETE` = `REVOKED`, rien de supprimé ; c'est bien le code (`entitlements.service.ts`).
- **C10/D3** : FR-25 et le §7 (agent hors des profils) sont cohérents avec un socle sans profil.
- **D1** : FR-36 (coque pour le client, console pour Money Vibes) suit D1 et le plan §1.5.
- **Reprise, feu vert** : FR-8 et Reprise FR-15 concordent (fait publié, par lot, rejoué dans le réel).
- **Connecteurs, vocabulaire** : Connecteurs FR-3 emploie « pack » au sens commercial, comme le §3 du
  moteur.
- **Six chemins de FR-4 contre le code de STORY-727** : les chemins 2 (`octroi-par-abonnement`, source
  `abonnement:<id>`), 3 (`propagation-des-packs`, `pack:<clé>`), 4 (`octroi-par-vertical`,
  `vertical:<pack>`, `distributeur`/`imf-sfd`/`assurance-cima`, sans terme) et 5 (`PUT`, source `admin`)
  existent tels que décrits ; le 6 (licence) est neuf ; le 1 (console) n'existe pas encore. Les manques
  sont listés en N-08.

---

## 4. Ce que la spine de `prospera-app` peut consommer tel quel, et ce qui manque encore

### Consommable tel quel

| Élément | Source |
|---|---|
| La **forme** de la lecture : instance (espace, gel, version figée, version), puis par module : `code`, état publié, `finLe`, version, droits déclarés, puis l'accueil | FR-34 |
| Une valeur inconnue se lit `NON_INSTALLE` (fermé par défaut) | FR-34 |
| La table menu, URL saisie, garde et bandeau pour `NON_INSTALLE`, `DESINSTALLE`, `EN_SERVICE`, `LECTURE_SEULE` et `SUSPENDU` | §3.1 (projection vérifiée sur le code) |
| La règle de l'espace : un module installé dans l'essai n'apparaît jamais au menu du réel ; bandeau jaune et titre d'onglet de l'essai | §3.1 axe 1, FR-9, FR-34 |
| Le menu construit **par code**, avec le libellé du module commercial | FR-37 |
| Deux lieux : la coque porte l'« Administration » du client (mises à jour, fichier, tunnel, consentements, export, bilan, rôles, essai prospect) | FR-36 |
| L'emplacement vide `{ etat: "NON_INSTALLE", module }` ; la dépendance suspendue ne ferme pas le dépendant | contrat C4, §3.6, Q3 ; FR-5 |
| Le refus d'écriture en lecture seule `ABONNEMENT_EXPIRE` (déjà livré) | STORY-727 lot 4 |
| Les codes de refus à afficher : `MODULE_DEPENDANCE_MANQUANTE`, `MODULE_REQUIS_PAR`, `MODULE_NON_SOUSCRIT`, `MODULE_HORS_LICENCE`, `MISE_EN_SERVICE_SANS_FEU_VERT`, `ECRITURE_REELLE_DEPUIS_ESSAI`, `<MODULE>_NOT_ENTITLED` | FR-3, FR-4, FR-8, FR-9, FR-12, FR-14 ; C2 |

### Ce qui manque encore (l'architecte devrait l'inventer)

1. **Le sort de l'impayé** : `PREAVIS` puis `LECTURE_SEULE`, ou `SUSPENDU` à J+7 comme dans le code
   (N-01).
2. **La représentation de `ESSAI_PROSPECT` et de `PREAVIS`** dans le droit, et l'état d'un essai terminé
   pendant les 30 jours d'export (N-02).
3. **L'état publié d'un droit ouvert sans installation** (chemins 2 à 5, c'est-à-dire tout l'existant)
   et la reprise de l'existant (N-03).
4. **Le canal de lecture** : route, droit exigé, calcul à la lecture, sens de « < 1 min » (N-07).
5. **Le code de module des droits du moteur** (`instance:*` refusés par STORY-167) et le **lieu de
   l'intersection** « droits attribués ∩ modules ouverts » (N-06).
6. **Les droits derrière « administrateurs » et « DG »** pour chaque bandeau et chaque écran
   d'Administration (R-26).
7. **La règle de garde en lecture seule** : par verbe, par catégorie ou par droit (N-11).
8. **La traduction contrat → menu** : les clés `VerticalPack` du contrat ne figurent pas dans la table
   de FR-37 (N-04).
9. **L'identité d'une organisation dans deux espaces**, et la manière dont la coque passe de l'un à
   l'autre pour un même utilisateur (N-05 ; FR-34 donne l'espace, pas le lien entre les deux).
10. **Le support des interrupteurs de changement** que la coque devra peut-être lire (N-18).
