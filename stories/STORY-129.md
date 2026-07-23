# STORY-129 : Identité visuelle du cabinet — logo téléversable + couleur de marque sur l'organisation

**Epic :** EPIC-002 — Organisations & profil (auth-service)
**Réf. architecture :** `architecture-auth-service-2026-07-04.md` § organisations ; `architecture-kyc-service-2026-07-03.md` § stockage MinIO (patron d'upload à recopier)
**Priorité :** Should Have
**Story Points :** 5
**Statut :** done ✅
**Sprint :** 16 (proposé)
**Créée le :** 2026-07-22
**Services :** `auth-service` (:3001) + stockage objet (MinIO, déjà en place pour le KYC)
**Couvre :** demande PO du 2026-07-22 (« je dois pouvoir téléverser le logo du cabinet et choisir sa couleur »)

---

## User Story

En tant qu'**administrateur de cabinet**,
je veux **téléverser le logo de mon cabinet et choisir sa couleur**,
afin que **mon espace et surtout mes documents produits portent mon identité, et non une marque générique.**

---

## Description

### Constat

`OrganizationResponseDto` porte exactement `id, name, slug, phone, country, address, status`.
**Aucun champ visuel**, et aucune route d'upload sur ce service. `PATCH /organizations/me` accepte
`name, phone, country, address` (whitelist stricte : tout autre champ ⇒ 400).

Or l'identité visuelle n'est pas cosmétique pour ce produit : le livrable d'un cabinet, c'est un **bilan
remis à un client**. Un cabinet qui envoie une liasse sans son logo diffuse la marque de son outil à la
place de la sienne.

### Ce que la story change

L'organisation porte `logoUrl` et `brandColor`. Le logo suit le **même chemin de stockage que les pièces
KYC** (MinIO), déjà éprouvé dans l'écosystème.

### Portée d'usage (à respecter côté consommateurs)

La couleur habille **le logo par défaut, l'en-tête des exports PDF et la signature des documents produits**.
Elle **ne repeint pas la navigation de Prospera** : sinon chaque cabinet redéfinit l'ergonomie du produit, et
les règles de contraste du design system ne tiennent plus.

---

## Scope

**Inclus**

- Champs `logoUrl?: string` et `brandColor?: string` sur `Organization` + exposition dans
  `OrganizationResponseDto`.
- `brandColor` accepté par `PATCH /organizations/me`, **validé** (hexadécimal `#RRGGBB`).
- `POST /organizations/me/logo` (multipart) : upload vers MinIO, remplacement de l'existant.
- `DELETE /organizations/me/logo` : retour aux initiales.
- Contraintes de fichier : **PNG, JPG ou SVG**, **1 Mo max**, dimensions raisonnables — refus explicite
  (415 / 413) avec un message exploitable par l'UI.
- Réservé au `TENANT_ADMIN` (403 sinon), comme le reste de `PATCH /organizations/me`.

**Hors périmètre**

- Application effective aux exports PDF (le service Bilan les produit — story à ouvrir quand l'export
  existera).
- Thème complet par cabinet (police, couleurs secondaires) : hors sujet, et contraire à la règle ci-dessus.

---

## Acceptance Criteria

- **AC-01** — `POST /organizations/me/logo` avec un PNG de 300 Ko → **201/200**, et `GET /organizations/me`
  renvoie un `logoUrl` qui affiche l'image.
- **AC-02** — Un fichier de **2 Mo** est refusé (**413**) ; un `application/pdf` est refusé (**415**) — avec
  un message que l'UI peut afficher tel quel.
- **AC-03** — Un **SVG** est accepté mais **assaini** (pas de `<script>`, pas de référence externe) — un SVG
  est du code exécutable dans un navigateur : c'est le point de sécurité de la story.
- **AC-04** — `PATCH /organizations/me { brandColor: "#0F766E" }` → **200** ; `{ brandColor: "rouge" }` →
  **400**.
- **AC-05** — Un `TENANT_USER` ne peut ni téléverser, ni supprimer, ni changer la couleur : **403**.
- **AC-06** — `DELETE /organizations/me/logo` remet `logoUrl` à vide et l'ancien objet est supprimé du
  stockage (pas de fichier orphelin).
- **AC-07** — **Isolation** : le logo d'une organisation n'est jamais accessible via l'identifiant d'une
  autre.

---

## Technical Notes

- **Recopier le patron d'upload KYC** (validation de type réelle par signature de fichier, pas seulement par
  extension ; nommage par `orgId` ; stockage privé + URL de lecture).
- **SVG** : soit assainissement à l'entrée, soit servir le fichier avec `Content-Disposition: attachment` et
  un `Content-Security-Policy` strict. Trancher explicitement — ne pas laisser passer un SVG brut sur une
  origine de confiance.
- `logoUrl` : décider entre URL publique stable et URL présignée courte. Le logo est peu sensible, mais la
  cohérence avec le reste du stockage compte — documenter le choix.
- Événement `identity.organization.updated` s'il existe déjà (patron STORY-023) : y inclure les nouveaux
  champs pour que les read-models suivent.

---

## Dependencies

- **Bloque** : **FE-023** (carte « Identité visuelle » du profil du cabinet).
- **Cohérent avec** : STORY-023 (`PATCH /organizations/me` + outbox) — même surface, même patron.

---

## Definition of Done

- 7 AC passent, **AC-03 (SVG) revu spécifiquement** — c'est le seul risque de sécurité de la story.
- OpenAPI à jour (champs + routes) ; types régénérables côté frontend.
- Aucun fichier orphelin après suppression (vérifié sur MinIO).

---

## Progress Tracking

**Status History :**
- 2026-07-22 : Créée (Scrum Master) — demande PO formulée sur la maquette FE-015 ; écart confirmé dans
  `OrganizationResponseDto` (aucun champ visuel, aucune route d'upload sur ce service).
- 2026-07-22 : `in_progress` → `done` (vivianMoneyVibesGroupes) — implémentée, validée, vérifiée sur
  stack docker neuve.

### Décisions techniques tranchées

1. **`logoUrl` = URL présignée éphémère, jamais persistée.** La base porte `logoStorageKey`
   (+ `logoMimeType`), et l'URL est **signée à la volée** à chaque réponse. Figer une URL en base
   produirait un `logoUrl` mort au bout de quelques minutes. Corollaire : l'événement Kafka transporte
   la **clé**, pas l'URL — un événement est durable et rejouable, une URL présignée non.
2. **Deux clients MinIO.** Écriture/suppression par l'endpoint **interne** (`minio:9000`) ; **signature**
   par l'endpoint **public** (`localhost:9000`) — la signature S3 couvre l'hôte, et `minio` n'est pas
   résoluble depuis le navigateur de l'utilisateur.
3. **SVG : parseur + allowlist, ET `Content-Disposition: attachment`, ET origine distincte.** Les trois
   étages, pas l'un ou l'autre (cf. AC-03 et *Revue de sécurité* ci-dessous). L'assainissement ne filtre
   **pas** le texte XML à la regex — il **parse** le document (fast-xml-parser) et le **reconstruit depuis
   une allowlist** d'éléments et d'attributs, en décidant sur le **nom local** (le préfixe de namespace ne
   masque rien). Ce qui n'est pas explicitement permis disparaît ; le parseur travaille en temps linéaire.
4. **Bucket `org-branding` propre à l'IdP**, distinct de `kyc-documents` : une base et un cycle de vie
   par service (invariant n°2 de l'architecture).

### Vérification docker réelle (stack neuve, `docker compose down -v` préalable)

Cabinet `cabinet-story-129` créé par l'API (register → vérification e-mail → login), puis :

| Contrôle | Preuve observée |
|---|---|
| Bucket créé au boot | `StorageBootstrapService … Bucket MinIO « org-branding » créé.` |
| **AC-01** upload PNG | `200` ; `mongosh` → `logoStorageKey: 'org-logos/<orgId>/<uuid>'`, `logoMimeType: 'image/png'` |
| **AC-01** l'URL affiche l'image | `GET <logoUrl>` → `HTTP 200`, `content_type=image/png`, **octets identiques à l'original** |
| **AC-02** 2 Mo | `413` + `Logo trop volumineux : 1 Mo maximum…` |
| **AC-02** PDF renommé `.png` | `415` + `Format de logo non supporté…` (type détecté sur le **contenu**) |
| **AC-03** SVG hostile | `200` ; l'objet **réellement stocké** ne contient plus ni `<script>`, ni `onload`, ni `href` externe, ni `javascript:`, ni `@import` — seuls `<rect>`/`<text>` subsistent |
| **AC-03** en-têtes servis | `Content-Disposition: attachment` + `X-Content-Type-Options: nosniff` |
| **AC-03** SVG Inkscape légitime (racine `<svg:svg>` qualifiée) | `200` ; dessin **et** déclaration `xmlns:svg` **préservés** — un filtre trop strict aurait vidé le logo |
| **AC-03** les 3 variantes d'XSS (voir *Revue de sécurité*) | `<svg:script>`, CDATA nue portant `<script>`, `<style><script>` → objet stocké **0 occurrence active** |
| **AC-04** `#0F766E` / `rouge` | `200` (persisté en base) / `400` avec le format attendu dans le message |
| **AC-05** `TENANT_USER` | `POST` `403`, `DELETE` `403`, `PATCH` `403`, `GET` `200` — **aucun** effet de bord en base ni dans le bucket |
| **AC-06** suppression | `200` ; `$unset` effectif (`logoStorageKey`/`logoMimeType` absents, `brandColor` conservé) et **0 objet** restant dans le bucket |
| **AC-06** remplacement | après PNG puis SVG : **1 seul objet** dans le bucket — l'ancien est supprimé, pas d'accumulation |
| **AC-07** bucket privé | accès direct sans signature → `403` ; signature falsifiée → `400` |
| Outbox | 4 `identity.org.updated` cohérents, chacun portant l'**état absolu** (dont l'absence de `logoStorageKey` après suppression) |

**Bug trouvé et corrigé par cette vérification** (invisible aux e2e, qui mockent la couche données) :
le client MinIO **découvrait la région par le réseau** avant de signer. Le client public visant
`localhost:9000` — soit le conteneur lui-même —, la signature échouait en `ECONNREFUSED` et `logoUrl`
disparaissait **silencieusement** de la réponse (`200` sans logo, dégradation volontaire). Corrigé en
fixant la région explicitement (`MINIO_REGION`, défaut `us-east-1`) : une URL présignée doit se calculer
**hors-ligne**.

### Revue de sécurité — 3 vulnérabilités trouvées ET corrigées dans la PR

La revue (agent `securite-prospera`, 3 passes) a trouvé **trois** contournements réels, tous de la même
classe — **XSS stockée via le SVG téléversé** (CWE-79) — et tous **corrigés avant merge**, chacun dans un
commit dédié avec test de régression, mutation rouge et **preuve sur stack docker (0 occurrence active
stockée)** :

1. **`<svg:script>` (élément qualifié) + ReDoS quadratique.** Un nom d'élément préfixé par un namespace
   *est* l'élément `script` pour le navigateur ; un motif ancré sur `<script` ne le voyait pas. Et un
   fichier de `<?` non fermés faisait boucler le sanitizer **~115 s**, gelant **tout l'IdP** (Node
   mono-thread). → Abandon de la blocklist regex pour un **parseur + allowlist** (décision sur le nom
   local) ; plafond SVG 256 Ko avant parsing ; refus des `<!DOCTYPE/<!ENTITY>`. 256 Ko adversarial : ~7 ms.
2. **CDATA re-sérialisée en markup vivant.** Le parseur fondait le contenu d'un `<![CDATA[…]]>` dans un
   nœud texte brut, que le builder ré-émettait sans échapper `<` : un `<script>` **inerte** redevenait
   **actif**. → `cdataPropName` isole puis **supprime** le CDATA ; le CSS légitime d'un `<style>` reste.
3. **Élément actif enfant d'un `<style>`.** La branche `<style>` (seule branche non récursive) réémettait
   ses enfants bruts : un `<script>` niché dans un `<style>` court-circuitait l'allowlist. → un `<style>`
   ne garde que ses nœuds texte/CDATA, tout élément enfant est jeté. Audit : aucune quatrième variante.

Passe finale de l'agent : **CLOS NET** — ReDoS clos, aucun type de nœud oublié (commentaires/PI abandonnés
par le parseur), aucune évasion d'attribut par le builder, tous les `url(...)` externes filtrés partout
(`filter`/`mask`/`clip-path`/`fill`), pas seulement dans `href`. Atténuations de repli indépendantes
maintenues : bucket privé, `attachment`, origine distincte.

**Leçon réutilisable** : on **n'assainit jamais du SVG à la regex** — c'est du XML arborescent, il faut le
**parser et le reconstruire depuis une allowlist**. La blocklist regex a rouvert la faille deux fois par
des chemins différents (namespace, puis CDATA) ; l'allowlist sur l'arbre les ferme structurellement.

### Portes qualité

Lint 0 warning · build OK · **594 tests unitaires** (couverture **96,88 / 89,65 / 97,8 / 96,91** pour des
seuils 65/90/90/90) · **146 e2e** · non-régression des 11 suites e2e existantes · routes documentées dans
Swagger (`multipart/form-data`, 413/415/403/404).

**Mutation-testing** — 18 mutations volontaires, toutes rouges puis restaurées. Métier/infra : `$unset`→`$set`,
suppression de l'ancien objet **avant** commit, retrait du `Content-Disposition: attachment`, `brandColor`
oublié dans la détection de changement, signature par le client interne, retrait du `@Roles(TENANT_ADMIN)`.
Sanitizer : `localName` sans retrait de préfixe, allowlist éléments/attributs neutralisée, plafond 256 Ko
retiré, `XMLValidator` court-circuité, `cdataPropName` retiré (CDATA refond dans `#text`), `collectText`
ignorant le CDATA, enfants de `<style>` réémis bruts.

### Hooks inertes documentés (hors périmètre, posés pour la suite)

- `identity.org.updated` transporte désormais `logoStorageKey` et `brandColor` — **champs additifs
  optionnels**, `schemaVersion` inchangé à 1, donc **aucune relying party ne casse**. **Aucun consommateur
  ne les projette encore** : le seul usage cadré (en-tête des exports PDF) est explicitement hors
  périmètre. La projection côté relying party sera un ajout **local**, sans nouveau changement de contrat
  — d'où l'absence de PR sur un second dépôt pour cette story.
- L'application effective aux exports PDF reste à ouvrir quand l'export existera (Bilan).

---

**Cette story a été créée avec la BMAD Method v6 — Phase 4 (Planification d'implémentation).**
