# STORY-1125 : L'archivage se mesure et se vend — compteurs par cabinet, quota de l'offre, relais de la console

Status: done — **livrée le 2026-11-26** : document-service **#39** (`5c50ca6` sur `dev`), BFF admin-panel **#45**
(`959aeee`, `81817fe` sur `dev`) ; voir « Livraison ». Fiche écrite le 2026-11-26 par la session du groupe B juste avant de
la coder (lot 7, n° 7 de B, `coordination/PLAN-LOT-7-GROUPE-B-2026-11-25.md` §1, ligne 7 ; identifiant réservé D-L7B-1).

**Services :** `document-service` (GitHub `prospera-ocr-service`, module `ged`), `admin-panel` (le BFF,
`prospera-admin-panel-service`) · **Points :** 5 · **Dépend de :** STORY-1087 (quota du service, `volumeCabinet`),
STORY-1088 (boîtes et cotes), STORY-1121 (version détruite), STORY-1123 (passage du jour, `ged.quota.depasse`, D-1123-4),
STORY-1124 (copie retirée) · **Écran :** AP-51 (A, lot 8) · **Suite :** la recette de bout en bout (STORY-1126)
**Sources :** PRD des services du cabinet, FR-19 (« La console voit, par cabinet : fonds ouverts, pages numérisées,
volume stocké, boîtes cotées, et le quota de l'offre. Le dépassement d'un quota alerte (il ne bloque pas la
consultation) ») ; épics, AP-51 (AC-1 : « par cabinet : fonds ouverts, pages versées, volume stocké, boîtes cotées, sur
le mois et au total » ; AC-2 : « le quota de l'offre (Q-SC-5) et l'alerte de dépassement ; la consultation n'est jamais
bloquée » ; AC-3 : « aucune donnée de pièce (ni nom, ni contenu) ne remonte à la console : des compteurs seulement ») ;
STORY-1087 (D-1087-5) ; STORY-1123 (D-1123-4 : « STORY-1125 apporte les compteurs et le quota de l'offre ; l'alerte les
lira alors »).

---

## Pourquoi

Money Vibes vend l'archivage au cabinet et doit pouvoir le **facturer** et **anticiper la capacité** : combien de fonds,
combien de pages versées ce mois-ci, combien d'octets stockés, combien de boîtes sur les rayons. Aujourd'hui seul le
cabinet voit son volume (`GET …/ged/cabinet/quota`), contre un quota qui est **le même pour tous** (un paramètre du
service). Cette story donne à la console, par cabinet, des compteurs au mois et au total, un quota propre à chaque cabinet
(celui de son offre), et fait reposer l'alerte de dépassement sur ce quota. Aucune donnée de pièce ne sort de la GED.

## Ce qui est déjà livré (relu dans le code le 26/11)

- **STORY-1087** : `GET …/ged/cabinet/quota` (`ged:fonds:gerer`) et `quotaDepasse` dans la réponse d'un dépôt ; le quota
  est **un seul paramètre du service** (`GED_QUOTA_CABINET_OCTETS`, 20 Go) ; le volume est `DepotGed.volumeCabinet`, la
  somme des versions du cabinet **non détruites** (STORY-1121 l'a déjà fait) — une copie retirée (STORY-1124) y reste.
- **STORY-1123** : le passage du jour regarde chaque cabinet qui a un fonds et publie `ged.quota.depasse` (`volumeOctets`,
  `quotaOctets`, `constateLe`) une fois par franchissement (état dans `ged_alertes`) ; le quota lu est celui du service.
- **Pages** : le nombre de pages d'une version vient de sa trace de numérisation (`numerisation.pages`, facultatif) ; il est
  recopié sur la ligne du bordereau au versement (`lignes[].pages`). Les bordereaux sont dans `ged_fonds_cabinet`.
- **Boîtes** : `ged_boites` (`coteCle` tant qu'une cote est posée, `historiqueDesCotes[]` daté, `presence` `EN_PLACE` |
  `SORTIE` | `RESTITUEE`).
- **Aucun quota d'offre n'existe** ailleurs (relu) : l'offre du catalogue (`offres`) ne porte que des modules ; l'octroi
  n'a que le champ libre `config` (où `dossiersMax` arrive de `paiement`) ; `paiement` (prêté à D) n'a ni quota ni
  stockage dans ses contrats ; l'état publié que lit la GED ne porte que l'état. **Q-SC-5** (la valeur et le prix) reste
  ouverte chez l'utilisateur.
- **Surface plateforme** : la GED n'a **aucune** route pour Money Vibes ; son jeton ne projette pas `perms`. Le BFF n'a
  **aucun** client vers `document-service`.

## Contrat annoncé avant le code (2026-11-26)

**Ajouts seuls.** Trois routes neuves dans `document-service` (surface de la plateforme, sous `/api/v1/ged/plateforme`),
trois routes neuves dans le BFF, une collection neuve, deux champs facultatifs neufs sur des réponses existantes. **Aucun
droit neuf** (auth inchangé : `org:read` et `entitlement:grant` existent), **aucun fait neuf**, `ged.quota.depasse`
inchangé (schéma, sujet), **manifeste `ged` inchangé** (D-1125-12), aucune dépendance neuve, aucune minuterie neuve.

### 1. Les compteurs d'un cabinet (AC-1, AC-3)

Calculés à la lecture sur ce qui fait foi (D-1125-1). Un mois est `AAAA-MM`, en UTC (D-1125-10).

| Compteur | Au total (`total`) | Dans le mois (`mois[]`) |
|---|---|---|
| `fonds` | les fonds du cabinet, ouverts ou fermés | — |
| `fondsOuverts` | les fonds **en cours** (sans fermeture) | les fonds **ouverts** dans le mois |
| `fondsFermes` | les fonds fermés | les fonds **fermés** dans le mois |
| `piecesVersees` | les lignes de tous les bordereaux | les lignes des bordereaux versés dans le mois |
| `pagesVersees` | les pages de ces lignes (une ligne sans nombre de pages compte 0) | idem, versés dans le mois |
| `volumeOctets` | les versions **stockées** (non détruites ; copie retirée comprise) : le volume du quota | les versions déposées dans le mois, encore stockées |
| `boitesCotees` | les boîtes cotées **sur les rayons** (non restituées) | les boîtes cotées **pour la première fois** dans le mois |

⛔ **Rien d'autre** : aucun numéro de fonds, aucun dossier, aucune raison sociale, aucun nom de fichier, aucun tiers, aucun
contenu (AC-3, D-1125-9). Un cabinet se nomme par son `organisationId` (la console a son nom par auth).

### 2. Le quota de l'offre, par cabinet (AC-2)

- **Posé par Money Vibes** (la console), tenu par la GED dans la collection neuve **`ged_quotas_cabinet`** (`_id` =
  organisation ; `quotaOctets`, `offre?` libellé, `poseLe`, `posePar`, les 50 derniers changements) (D-1125-5).
- **Sans quota posé, celui du service** (`GED_QUOTA_CABINET_OCTETS`, 20 Go, D-1087-5) : `source: SERVICE` ; posé :
  `source: OFFRE`.
- Le bloc `quota` d'un cabinet : `{ quotaOctets, source: OFFRE | SERVICE, offre?, poseLe?, posePar?, volumeOctets,
  depasse, utilisationPourcent }` (`depasse` : volume > quota ; `utilisationPourcent` : entier arrondi par défaut).
- **Jamais un blocage** : ni du dépôt, ni de la consultation (FR-19). Poser un quota plus bas que le volume n'empêche rien.
- **L'alerte** (`ged.quota.depasse`, STORY-1123) lit désormais le quota **du cabinet** ; sa charge ne change pas
  (`quotaOctets` vaut le quota du cabinet) ; elle part au passage du jour (D-1123-13), y compris quand la console a
  baissé le quota (D-1125-7).
- **Le cabinet le voit** : `GET …/ged/cabinet/quota` et l'accusé d'un dépôt rendent le quota du cabinet, avec un champ
  facultatif neuf **`quotaSource`** (`OFFRE` | `SERVICE`) ; `quotaOctets` et `quotaDepasse` gardent leur nom.

### 3. Les routes de `document-service` (surface de la plateforme)

Ni `@ExigeModule`, ni droits `ged:*` : des **permissions de plateforme** lues dans le jeton (`perms`, patron de
STORY-105), sans elle `403` (D-1125-6). Un membre de cabinet n'a aucune permission de plateforme.

| Route | Permission | Réponse |
|---|---|---|
| `GET /api/v1/ged/plateforme/archivage?mois=AAAA-MM` | `org:read` | `{ mois, calculeLe, cabinets: [{ organisationId, total, mois, quota }], tronque }` — les cabinets qui ont un fonds ou un quota posé, par `organisationId` ; au plus 1 000 (`tronque: true` au-delà) ; `mois` absent : le mois courant |
| `GET /api/v1/ged/plateforme/cabinets/{organisationId}/archivage?du=AAAA-MM&au=AAAA-MM` | `org:read` | `{ organisationId, calculeLe, total, mois: [...], quota }` — un mois par mois de `du` à `au` (zéros compris) ; défaut : les douze derniers mois ; au plus 36 mois |
| `PUT /api/v1/ged/plateforme/cabinets/{organisationId}/quota` | `entitlement:grant` | corps `{ quotaOctets: entier ≥ 1 \| null, offre?: texte de 1 à 80 }` (`null` : retour au quota du service) ; rend le bloc `quota` |

Refus : `400` `MOIS_INVALIDE` (`mois`, `du`, `au` hors `AAAA-MM`), `400` `PERIODE_INVALIDE` (`du` après `au`, plus de 36
mois), `400` (corps invalide, `organisationId` hors ObjectId), `401`, `403`. Un cabinet sans aucune archive rend des zéros
(jamais un `404` : la GED ne sait pas si une organisation existe).

### 4. Le relais de la console (BFF, AP-51)

| Route du BFF | Permission | Relaie |
|---|---|---|
| `GET /api/v1/admin/archivage?mois=` | `org:read` | `GET …/ged/plateforme/archivage` |
| `GET /api/v1/admin/orgs/{orgId}/archivage?du=&au=` | `org:read` | `GET …/ged/plateforme/cabinets/{orgId}/archivage` |
| `PUT /api/v1/admin/orgs/{orgId}/archivage/quota` | `entitlement:grant` | `PUT …/ged/plateforme/cabinets/{orgId}/quota` |

Le BFF relaie le jeton de l'opérateur, **recopie champ par champ** (anti-fuite, STORY-378) : un corps hors forme ⇒ `503`.
Les refus de la GED traversent par leur statut, `MOIS_INVALIDE` et `PERIODE_INVALIDE` par leur code (D-1125-11). Variable
neuve facultative **`DOCUMENT_SERVICE_URL`** (défaut `http://document-service:3006/api/v1`). OpenAPI des deux services à
jour : A en génère les types. **B ne code aucun écran.**

## Livraison (2026-11-26)

- **Code, `document-service`** (`prospera-ocr-service`) **#39**, `5c50ca6` sur `dev` (un commit, arbre identique à `f742119`
  poussé) : `src/modules/ged/archivage/` — `archivage.ts` (compteurs, mois UTC, quota appliqué et son état),
  `depot-archivage.ts` (`DepotArchivage` : la mémoire applique les règles, MongoDB les rejoue en huit agrégations sur
  `ged_fonds_cabinet`, `ged_versions`, `ged_boites` ; collection `ged_quotas_cabinet`), `archivage.service.ts`
  (`ArchivageService`, `QuotasDesCabinets`, `exigerPermission`), `archivage.controller.ts` (surface `ged/plateforme`, DTO
  OpenAPI) ; `JwtStrategy` projette `perms` ; `CabinetService.etatDuQuota` (et l'accusé de dépôt) et
  `AlertesDeLArchiviste.quotas` lisent le quota du cabinet ; refus `MOIS_INVALIDE`, `PERMISSION_INSUFFISANTE` ; les trois
  routes classées au recensement de STORY-695 (hors portée de dossier). Manifeste `ged` **inchangé** (1.9.0), aucune recopie.
- **Code, BFF** (`prospera-admin-panel-service`) **#45**, `959aeee` puis `81817fe` sur `dev` (arbre identique à `dc06bb4`) :
  `src/admin/archivage/` (deux contrôleurs, proxy, projection champ par champ, DTO), `DocumentServiceClient`,
  `DOCUMENT_SERVICE_URL` ; le second commit garde l'ordre des champs de la GED dans la liste (relevé par la pile, D-1125-14).
- **Preuves** :
  - `document-service`, Node 25 : unitaires 1 379 passés (117 suites ; 3 rouges du poste, toutes en CRLF ou chemins Windows :
    `ged.service.spec`, `piece-conservation.spec`, et `sources-des-manifestes.spec` qui lit le manifeste en CRLF — vertes en
    Node 24) ; e2e **220/220** (+3) ; lint des fichiers touchés, `tsc`.
  - Node 24 (étage `verification`, image depuis `git -c core.autocrlf=false archive f742119`) : **117/117 suites**, 1 384
    passés ; e2e **220/220**.
  - BFF, Node 25 : unitaires **740/740** (51 suites) ; e2e **307/307** (18 suites ; `admin-archivage.e2e-spec` neuf contre une
    doublure HTTP de `document-service`, `openapi-contract` gardant les quatre schémas) ; lint, `tsc`, build.
  - Mutations : `document-service` **21/21** rouges sur assertion (+ M9 rouge au compilateur, sa variante typée M9b tuée) —
    fonds fermé, version détruite comptée, boîte restituée comptée, dernière cote, page devinée, borne du mois, dernier mois
    exclu, dépassé à égalité, quota retiré gardé, perms absentes, tronqué à 1 000, 37 mois, offre non nettoyée, période par
    défaut, lire avec la permission de poser, historique sans borne, alerte et dépôt sans le quota de l'offre, source figée,
    perms non filtrées, schéma Mongo sans l'historique ; BFF **9/9**.
  - **Pile `grp-b` neuve** (image depuis l'archive ; Mongo rs0, Kafka, Redis, MinIO Chainguard, doublure d'auth avec des
    opérateurs à `perms`) et **le BFF construit (`dist/main.js`) démarré pour de vrai contre cette GED** : un fonds, quatre
    pièces versées (3 + 2 + 5 + 0 pages), scellé, trois boîtes reçues, deux cotées, une restituée, deux pièces de 2015
    détruites par la file, une pièce de plus non versée. Compteurs = ce que Mongo dit compté à la main : `fonds 1, ouverts 1,
    pièces versées 4, pages 10, volume 9 241 octets` (les 5 094 octets des deux versions détruites hors du volume, leurs
    pages restées versées), `boîtes cotées 1` (mois : 2, la restituée comprise) ; détail sur trois mois (deux à zéro) ; aucun
    numéro de fonds, nom ni contenu (AC-3) ; GED : `403 PERMISSION_INSUFFISANTE` sans permission, pour un `TENANT_ADMIN` et
    pour l'archiviste, `400 MOIS_INVALIDE` ; **BFF** : la liste et le détail relayés à l'identique, `PUT …/quota` (1 000
    octets, « Essentiel 1 Ko ») écrit dans `ged_quotas_cabinet`, le cabinet le voit (`quotaSource: OFFRE`, sans l'offre),
    le dépôt suivant passe (alerte seulement), un second cabinet au quota posé apparaît à zéro, `403` sans permission, `400
    MOIS_INVALIDE` et `PERIODE_INVALIDE` relayés par leur code ; **alerte** : le passage du jour publie un
    `ged.quota.depasse` (`quotaOctets` 1 000, schéma inchangé, `SENT`), le quota retiré réarme l'état sans fait ;
    historique `[1000 « Essentiel 1 Ko », null]`. Aucune erreur au journal du service ni du BFF. Première passe 33/34 (la
    comparaison de la liste au JSON brut : ordre des champs), seconde après `81817fe` **35/35**. Verrou 11:22 → 11:30, `down -v`.
- **Recette de l'Atelier** non rejouée (D-1125-13) : le diff ne touche ni l'OCR, ni les extractions, ni le module commun ;
  la `JwtStrategy` gagne `perms` sur `request.user` (lu par la seule GED) et les e2e de l'OCR et des extractions, qui montent
  la vraie stratégie, sont vertes (Node 25 et 24).

### Écarts au contrat, décidés au code

- **D-1125-14 — La liste projetée par le BFF garde l'ordre des champs de la GED** (`tronque` avant `cabinets`) : la pile l'a
  relevé ; le contenu ne changeait pas, la console lit désormais le même corps qu'à la source.
- **D-1125-15 — `orgId` du BFF exigé en ObjectId** sur les routes de l'archivage (`OrgArchivageParamsDto`) : le paramètre
  commun des installations accepte toute chaîne, que la GED refuserait de toute façon ; le refus se fait au bord.
- **D-1125-16 — Les refus de la surface de la plateforme sont des `403` génériques** (`PERMISSION_INSUFFISANTE`, sans nommer la
  permission), comme `kyc-service` (STORY-105), plutôt que le `404` de la surface de `paiement` : la GED n'a pas d'organisation
  Money Vibes à cacher, et le BFF refuse déjà au bord.

## Critères d'acceptation

- **AC-1** : par cabinet, fonds (ouverts, fermés), pièces et pages versées, volume stocké, boîtes cotées, au total et pour
  chaque mois demandé, selon le tableau du § 1 ; une version détruite ne compte plus dans le volume ; une copie retirée y
  compte et n'est jamais versée ; une boîte restituée quitte le total des boîtes cotées.
- **AC-2** : le quota de l'offre se pose par cabinet depuis la console (`entitlement:grant`), se retire (`null`) ; sans lui,
  celui du service ; `depasse` et `utilisationPourcent` disent l'alerte ; le passage du jour publie `ged.quota.depasse`
  contre le quota du cabinet ; rien n'est jamais bloqué.
- **AC-3** : aucune réponse de la surface plateforme ne porte un numéro de fonds, un dossier, un nom, un tiers, un
  montant ou un contenu de pièce.
- **AC-4** : sans la permission de plateforme, `403` ; un membre de cabinet (même `TENANT_ADMIN`) est refusé.
- **AC-5** : le BFF relaie les trois routes pour de vrai (appel réel au BFF contre la GED d'une pile), projette champ par
  champ, rend `503` sur un corps hors forme ; les deux OpenAPI les décrivent.
- **AC-6** : `GET …/ged/cabinet/quota` et l'accusé de dépôt rendent le quota du cabinet et `quotaSource`.

## Décisions prises au contrat (contestables)

- **D-1125-1 — Des compteurs calculés, jamais tenus** : une agrégation à la lecture sur les collections qui font foi
  (`ged_fonds_cabinet` et ses bordereaux, `ged_versions`, `ged_boites`), par cabinet. Aucune collection de compteurs à
  tenir dans chaque écriture (dépôt, version, versement, cote, restitution, destruction, retrait) ni à rattraper pour les
  archives d'avant : rien ne peut dériver. Le coût est un regroupement par collection à chaque lecture, sur les index par
  cabinet existants ; la console lit rarement.
- **D-1125-2 — Le total dit ce qui est là, le mois dit ce qui a été fait** : volume et boîtes sont des stocks (ce qui coûte
  et occupe) ; fonds ouverts ou fermés, pièces et pages versées, boîtes cotées sont des actes datés. Le total des actes
  est leur cumul depuis l'origine.
- **D-1125-3 — Une pièce détruite ne compte plus dans le volume, ses pages versées restent** : son fichier n'est plus
  stocké (STORY-1121) ; un versement ne se défait pas, le bordereau scellé le garde.
- **D-1125-4 — Une copie retirée (STORY-1124) compte dans le volume** : ses fichiers restent stockés (D-1124) ; elle n'a
  jamais été versée, donc aucune page. Le volume est celui du quota, qui ne change pas de définition.
- **D-1125-5 — Le quota de l'offre est posé par cabinet par Money Vibes et tenu par la GED** : aucun quota d'offre n'existe
  au catalogue, dans `paiement` (prêté à D) ni dans l'état publié (figé le 11/12) ; le quota s'applique là où se mesure le
  volume. Sans quota posé, celui du service (20 Go, D-1087-5). Q-SC-5 (la valeur de chaque offre et son prix) reste à
  l'utilisateur ; quand un contrat portera le quota de l'offre (comme `dossiersMax`), la GED le lira et le quota posé
  restera la décision de l'opérateur.
- **D-1125-6 — Les permissions de plateforme existantes, lues dans le jeton** : lire = `org:read` (voir une
  organisation), poser = `entitlement:grant` (ce que le cabinet a acheté) ; aucun droit neuf (auth inchangé). `perms` est
  projeté par la `JwtStrategy` comme dans `kyc-service` (STORY-105), sans repli (un jeton sans `perms` n'a rien).
- **D-1125-7 — `ged.quota.depasse` inchangé** : même schéma, même sujet, même moment (le passage du jour) ; il lit le
  quota du cabinet. Un quota changé ne publie rien sur-le-champ ; le passage suivant juge (franchi, ou réarmé).
- **D-1125-8 — Le cabinet voit son quota d'offre** : `GET …/ged/cabinet/quota` et l'accusé d'un dépôt rendent le quota du
  cabinet, plus `quotaSource` (facultatif) ; l'offre (libellé) ne lui est pas montrée (elle est commerciale).
- **D-1125-9 — Ce qui ne remonte jamais** : ni numéro de fonds, ni dossier, ni raison sociale, ni rien d'une pièce ; le
  cabinet par son identifiant seul.
- **D-1125-10 — Le mois en UTC** : le jour du service, comme le passage des alertes (D-1123-3).
- **D-1125-11 — Le BFF ne relaie que des compteurs** : projection fermée, champ par champ, nombres entiers positifs ;
  hors forme ⇒ `503` ; aucune agrégation du BFF (la GED compte, le BFF relaie).
- **D-1125-12 — Manifeste `ged` inchangé** : les routes neuves sont une surface de la plateforme, hors de l'état publié du
  module (pas de `@ExigeModule`, pas de `routesLectureSeule`), sans droit ni fait neufs ; aucune recopie au catalogue.
- **D-1125-13 — La recette de l'Atelier n'est pas rejouée** si le diff ne touche ni l'OCR, ni les extractions, ni le
  module Nest commun : la `JwtStrategy` gagne un champ projeté (`perms`), lu par la seule GED ; les e2e de l'OCR et des
  extractions, qui montent la vraie stratégie, le prouvent.

## Nommé pour plus tard

- Le quota de l'offre porté par le contrat (`paiement` → catalogue → GED), quand Q-SC-5 sera tranchée.
- Un seuil d'approche (80 %) et sa cloche ; l'historique des quotas posés montré à la console.
- Les écrans (AP-51, A, lot 8).
