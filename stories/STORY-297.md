---
baseline_commit: 595270e8ea89780d52e8cf8cee828054b298a1bc
---

# STORY-297 : Chargeur de paquet fiscal depuis le catalogue

Status: done

**Complexité :** high

**Épic :** EPIC-027 — Socle `fiscal-service` et gouvernance du paquet fiscal  
**Services :** `fiscal-service`, `platform-catalog-service`, `balance-service`, `dossier-service`  
**Points :** 8 · **Sprint :** S22  
**Assigné à :** `vivianMoneyVibesGroupes`  
**Prérequis :** STORY-296 (`done`) ; STORY-149, STORY-493 (`done`)  
**Origine :** `epics-fiscalite-2026-08-03.md` — FR-F67/F68, AR-06, AD-5/6.

---

## User Story

En tant qu'**administrateur plateforme**, je veux que `fiscal-service` résolve le paquet fiscal
publié et vérifie ses octets avant de l'exposer, afin qu'aucun futur calcul ne parte d'une donnée
réglementaire altérée ou destinée à un autre service.

## Décisions confrontées au code réel

- Le nom déployé est `platform-catalog-service`. Son API de lecture n'offre qu'une **liste** protégée
  par un jeton d'audience catalogue ; elle ne convient pas au chemin chaud d'un relying party. Le
  catalogue enrichit donc **additivement** les références de `entitlement.changed` v2 avec
  `artifactUri` et `checksum` ; `fiscal-service` les projette dans son read-model local.
- Le dépôt de STORY-149 publie `s3://referentiel-packages/<clé>` dans un bucket privé. Le chargeur
  lit cette URI via MinIO, limité au bucket configuré, puis vérifie le SHA-256 des **octets reçus**.
  Une URI ou une empreinte absente ne devient jamais un repli vers un paquet embarqué.
- Le paquet fiscal 2026 actuel est produit par `balance-service` et copié à l'octet chez
  `dossier-service`. Son `_meta` ne porte **aucune** liste de consommateurs, contrairement à AD-6 :
  la déclarer exige une nouvelle empreinte, propagée aux deux manifestes et aux deux copies.
- Le code catalogue demandé est `fiscal-tg-entreprise` et la version d'exemple `2026.1`. Le
  contenu réglementaire réutilise le paquet `togo@2026` ; on ne réécrit aucun taux ni aucune
  formule. Le module `fiscalite` et sa version ne sont pas semés sur une base neuve : leur
  publication ainsi que le dépôt du paquet restent des gestes d'administration.
- Une première stack neuve a montré que Mongoose **minimisait** `config: {}` dans le payload
  outbox : l'événement était marqué `SENT` mais le consommateur le rejetait. Le schéma outbox
  préserve maintenant les objets vides ; le consommateur tolère les événements v2 déjà émis
  sans `config` en les projetant comme `{}`. Les deux protections ont été mutées au rouge.

## Périmètre inclus

- Enrichissement additif des références d'entitlement fiscal avec le couple immuable
  `artifactUri`/`checksum`, depuis la `ReferentielVersion` déjà vérifiée à l'octroi ; état absolu
  et outbox existante inchangés. Les autres consommateurs v2 continuent à ne lire que
  `(code, version)`.
- Projection locale des deux champs et refus fail-closed d'une référence fiscale incomplète.
- Résolution `(type, pays, année)` contre les références **octroyées** à l'organisation, puis
  lecture S3 privée bornée, empreinte SHA-256, validation de l'identité `_meta` et de
  `_meta.consommateurs`, cache par version **et empreinte**, single-flight.
- Route authentifiée et gatée de lecture du paquet, documentée Swagger, permettant de constater
  `502 REFERENTIEL_INTEGRITY` sans exposer le contenu altéré.
- Déclaration des consommateurs dans le paquet source, génération déterministe et propagation
  byte-identique à `balance-service` et `dossier-service` avec leurs manifestes ajustés.

## Hors périmètre

- Nouveau bus ou topic Kafka, changement de version de schéma v2, client REST synchrone vers le
  catalogue, lecture de sa base Mongo depuis fiscal, jeton partagé ou URL MinIO publique.
- Semis automatique du module fiscal, dépôt automatique en production, migration des entitlements
  déjà octroyés : un ré-octroi republie l'état complet ; avant lui, le chargeur refuse.
- Calcul fiscal, sélection d'un régime dérogatoire, rattachement d'un exercice à une version
  (STORY-298), santé globale du paquet par tenant, remplacement des loaders historiques de
  `balance-service` et `dossier-service`.

## Critères d'acceptation

- [x] **AC-1 — Résolution exacte.** Pour une organisation habilitée à
  `fiscal-tg-entreprise@2026.1`, `(entreprise, TG, 2026)` charge l'URI et l'empreinte publiées ;
  ni un autre code, ni une autre année, ni un autre tenant ne fournit le paquet.
- [x] **AC-2 — Intégrité.** Un octet modifié en stockage donne **502
  `REFERENTIEL_INTEGRITY`** sans aucune rubrique servie ni entrée de cache créée.
- [x] **AC-3 — Consommateur déclaré.** Un paquet intact mais dont
  `_meta.consommateurs` ne contient pas `fiscal-service` est refusé avec
  `REFERENTIEL_CONSOMMATEUR_ABSENT` ; les trois copies du paquet 2026 portent la même liste.
- [x] **AC-4 — Cache.** Deux demandes du même couple `(code, version, checksum)` ne font qu'une
  lecture MinIO ; une nouvelle empreinte manque le cache ; les échecs ne sont jamais cachés.
- [x] **AC-5 — Contrat de publication.** L'événement fiscal v2 porte l'URI et l'empreinte de la
  `ReferentielVersion` exacte, en état absolu dans l'outbox transactionnelle. Une révocation ou un
  ré-octroi garde la même sémantique ; les autres modules et consommateurs v2 ne sont pas cassés.
- [x] **AC-6 — Parcours réel.** Sur stack Docker neuve, publication administrative du paquet,
  octroi fiscal et propagation Kafka convergent ; l'endpoint fiscal lit l'objet MinIO privé,
  puis un octet altéré donne le refus d'intégrité. Les bases restent isolées.

## Tâches

- [x] T1 — Publier les métadonnées d'artefact dans l'événement fiscal et garder le contrat v2.
- [x] T2 — Projeter les métadonnées dans `org_fiscal_entitlements` sans repli fail-open.
- [x] T3 — Charger, borner, vérifier et mettre en cache le paquet dans `fiscal-service`.
- [x] T4 — Publier `_meta.consommateurs` et propager les mêmes octets/empreintes aux deux lecteurs.
- [x] T5 — Prouver les mutations, la porte qualité de chaque dépôt et la stack Docker réelle.

## Table de mutations obligatoire

| ID | Mutation volontaire | Témoin rouge attendu |
|---|---|---|
| M1 | substituer le checksum annoncé aux octets réellement hachés | intégrité : 502 sur octet altéré |
| M2 | retirer la garde `fiscal-service` de `_meta.consommateurs` | refus nommé, aucun contenu |
| M3 | cacher le résultat sous `(code, version)` sans empreinte | nouvelle empreinte relit MinIO |
| M4 | accepter une référence d'entitlement sans URI ou checksum | projection/lecture fail-closed |
| M5 | résoudre par code seul en ignorant l'année et l'organisation | résolution exacte refuse |
| M6 | retirer l'enrichissement de l'événement fiscal | contrat producteur/consommateur rouge |

## Definition of Done

- [x] Branches `MNV-297` rebasées avant code, PR sur `dev` pour les quatre services et sur `main`
  pour la documentation ; intégration coordonnée uniquement après toutes les revues.
- [x] Porte unique eslint + build + test:cov + test:e2e verte sur chaque dépôt modifié.
- [x] M1 à M6 réellement rouges puis restaurées ; chaque source neuve couverte par fichier.
- [x] Vérification Docker réelle du trajet catalogue → Kafka → read-model → MinIO → HTTP,
  avec altération d'octet et contrôle des collections.
- [x] Revue de code et revue de sécurité Codex, correctifs, contre-revue ; statut synchronisé
  aux trois emplacements et `completed_date` à la clôture.

## Progress Tracking

**Statut : `done` (2026-09-19).** Contrats vérifiés dans les services réels. Branches docs et
quatre services créées puis rebasées avant le code. La liste de consommateurs et les métadonnées
d'artefact, absentes à ce jour, sont des prérequis explicites et non des hypothèses silencieuses.

**Implémentation et tests (2026-09-19).** Référence fiscale v2 enrichie par le catalogue et
projetée localement ; lecture MinIO privée, SHA-256 des octets, liste de consommateurs et cache
borné par `(code, version, checksum)`. Le paquet Togo 2026 a été régénéré : manifeste et copies
exécutables `balance-service`/`dossier-service` à
`sha256:9b6d11a65317f34edc36c975bddd551bd17c9e5b627bd14861008be224b811e2`, `cmp` = 0.
Portes complètes vertes sur les quatre dépôts ; après le correctif de minimisation outbox, les
portes catalogue et fiscal ont été relancées. M1–M6 : tests rouges sur le critère visé (pas de
simple erreur de compilation), code restauré ; deux mutations supplémentaires rouges sur la
perte/récupération de `config: {}`.

**Docker réel, projet Compose isolé `prospera-story-297`, volumes neufs (2026-09-19).** Après
un premier essai ayant révélé la perte de `config: {}`, seuls les volumes temporaires de ce
projet ont été effacés, puis la stack est repartie à froid. Santé des quatre API = 200. Dépôt
administratif `fiscal-tg-entreprise@2026.1` → `referentielversions: 1` ; octroi fiscal →
`entitlements: 1`, `outbox_events` sur `entitlement.changed: 1`, `payload.config` **présent `{}`**.
Le read-model fiscal réel porte `ACTIVE`, l'URI privée et l'empreinte exacte ; le consommateur
Kafka a écrit ses marqueurs (`processed_events: 4`). Pour ouvrir le gate sans modifier Mongo à la
main, un événement de **préparation** KYC `APPROVED` a été injecté sur le vrai Kafka ; le parcours
de décision KYC n'est pas revendiqué par cette story. Un octet changé dans l'objet MinIO **avant
la première lecture** a produit HTTP **502 `REFERENTIEL_INTEGRITY` sans `contenu`** ; après
restauration des octets, la même route a produit HTTP **200** avec l'empreinte et
`fiscal-service` dans `_meta.consommateurs`. Aucune requête cross-base ni appel catalogue sur le
chemin chaud. Le `docker-compose.yml` racine (non versionné dans ce workspace) porte localement
les variables MinIO du fiscal ; sa transposition de déploiement reste explicitement nécessaire.

**Revues et clôture (2026-09-19).** Revue de code Codex Opus : aucun constat retenu. Revue de
sécurité Codex Opus des cinq PR ouvertes : aucune vulnérabilité exploitable retenue. La revue des
preuves a relevé une lacune Swagger : aucun test ne protégeait l'annonce de la réponse 502.
Un test du document OpenAPI versionné et de la délégation au tenant couvre désormais le contrôleur
(2/2 fonctions). Le retrait volontaire du décorateur **et de son import** a produit une vraie
assertion rouge sur `502`, puis le code a été restauré ; porte complète fiscale relancée verte
et contre-revue Codex favorable. PR catalogue #21 (`97e717e`), balance #108 (`6d6d23d`),
dossier #30 (`429fbd2`) et fiscal #4 (`788d6ef`) rebase-mergées sur `dev` dans cet ordre ; PR
documentation #285 rebase-mergée sur `main` après synchronisation du statut.
