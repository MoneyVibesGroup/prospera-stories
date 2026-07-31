# STORY-146 : Dépôt d'un paquet de référentiel par la console (upload d'artefact, sha256 calculé côté serveur, publication versionnée)

**Epic :** EPIC-024 — Catalogue & entitlements
**Réf. architecture :** `architecture-catalog-service-2026-07-07.md` · **STORY-032** (catalogue admin CRUD) · **STORY-038** (`ReferentielPackage` : pointeur + checksum) · **STORY-105** (RBAC D15, catalogue figé de 8 permissions) · **AP-04** (console : registre des référentiels)
**Priorité :** Should Have
**Story Points :** 8
**Statut :** draft
**Assigné à :** Unassigned
**Créée le :** 2026-07-28
**Sprint :** à planifier
**Service :** `platform-catalog-service` — 1 dépôt, 1 branche, 1 PR
**Branche :** `MNV-146`

---

## Contexte

**Le catalogue décrit les paquets ; personne ne peut en déposer un.**

`ReferentielPackage` (STORY-038) stocke un **pointeur d'artefact** (`oci://`, `s3://`, `https://`)
et un **sha256**. Les deux sont saisis à la main par l'administrateur, qui doit avoir publié
l'artefact ailleurs, par un moyen extérieur à la plateforme, et recopier une empreinte de 64
caractères hexadécimaux.

Deux conséquences opérationnelles :

1. **Aucun chemin dans le produit** pour l'événement métier réel : un pays publie une évolution
   du plan comptable (nouvelle version SYSCOHADA, révision SFD-BCEAO, texte CIMA). Aujourd'hui
   l'admin doit passer par l'infra.
2. **Une classe d'erreur non rattrapable.** Une faute de frappe dans le sha256 produit un
   référentiel enregistré avec une empreinte fausse. Rien ne le détecte : `catalog-service` ne
   télécharge pas l'artefact. L'erreur se révèle quand un cabinet ouvre le module et que
   `bilan-service` refuse le paquet — c'est-à-dire loin, tard, et sans lien visible avec la saisie.

⚠️ **Ce que la console fait déjà, et ce qu'elle ne peut pas faire.** `frontend-admin-panel` calcule
désormais le sha256 du fichier choisi (Web Crypto, `src/features/catalog/artifact-digest.ts`) et
pré-remplit le champ — ce qui retire la faute de frappe. Mais **le fichier ne part nulle part** :
il n'existe aucune route de dépôt. L'écran le dit explicitement plutôt que de le laisser croire.

---

## Porteur : `platform-catalog-service`, et non `document-service`

Tranché, avec le motif.

`document-service` gère les **pièces KYC** : documents d'une organisation, privés, présignés,
soumis à rétention et à une chaîne de revue. Un paquet de référentiel est l'exact opposé : c'est un
**actif de plateforme**, public à tous les tenants entitled, immuable une fois publié, versionné, et
dont le cycle de vie est celui du catalogue (`ACTIVE` / `DEPRECATED` / `RETIRED`).

Le porter par `document-service` obligerait à y introduire une seconde notion d'objet, sans
organisation propriétaire ni rétention, et à faire dépendre le catalogue d'un service de pièces
justificatives. Le checksum, lui, appartient **déjà** à `catalog-service` (STORY-038) : séparer le
dépôt de l'empreinte reviendrait à couper en deux l'invariant que cette story vient renforcer.

⇒ **`platform-catalog-service`**, avec un backend de stockage objet (S3/MinIO) monté par l'infra.

---

## User Story

En tant qu'**administrateur plateforme**,
je veux **déposer le paquet d'un référentiel depuis la console et le publier en une version**,
afin de **répercuter une évolution réglementaire publiée par un pays sans passer par l'infra**.

---

## Périmètre

**Inclus :**

1. `POST /catalog/referentiels/:code/versions/:version/artifact` — dépôt **multipart**.
2. **Le sha256 est calculé PAR LE SERVEUR** sur le flux reçu, et c'est **lui** qui est enregistré.
3. Contrôle d'intégrité du transport : si l'appelant fournit un `expectedChecksum`, une divergence
   est un **422** — le dépôt est rejeté, pas enregistré avec l'empreinte serveur.
4. Publication versionnée : un paquet déposé est **immuable**. Re-déposer sur une version existante
   est refusé (409) — on publie une nouvelle version.
5. `zone` (pays / zone réglementaire) sur la version de référentiel — l'admin doit savoir à quel
   périmètre s'applique le paquet qu'il octroie.

   ⚠️ **Décision PO du 2026-07-28 : `zone` est reportée ICI, elle n'est PAS implémentée côté
   front.** Le brief console la demandait dans le parcours de dépôt ; la porter côté front seul
   produirait un champ saisi, affiché, puis perdu à l'enregistrement — `ReferentielVersion` ne le
   transporte pas et aucune route ne l'accepte. Un champ qui ne persiste pas est **pire** qu'un
   champ absent : l'admin croit avoir renseigné le périmètre réglementaire du paquet. La console
   l'ajoutera quand cette story l'aura exposé.

**Hors périmètre :**
- La vérification d'intégrité au **chargement** — c'est `bilan-service`, inchangé.
- L'attribut `referentielFamilies` — c'est **STORY-145**.

---

## ⚠️ Le sha256 est calculé côté serveur, jamais accepté du client

C'est l'invariant de cette story.

Accepter l'empreinte fournie par le client, c'est laisser l'appelant **décrire** le contenu qu'il
dépose au lieu de le **prouver**. Un client fautif — ou un octet perdu en transit — enregistrerait
un couple (artefact, empreinte) incohérent, et l'on retomberait exactement sur le défaut que la
story corrige, en le rendant plus difficile à voir puisqu'il y aurait eu un « upload réussi ».

Le calcul côté navigateur reste utile (retour immédiat, détection d'un mauvais fichier avant
l'envoi) mais il est **indicatif** : le serveur recalcule et fait foi.

---

## Critères d'acceptation

- [ ] `POST …/artifact` accepte un multipart, stocke l'objet et renvoie l'empreinte **calculée par
      le serveur**.
- [ ] L'empreinte enregistrée au catalogue est celle du serveur, en toutes circonstances.
- [ ] `expectedChecksum` divergent ⇒ **422**, rien n'est stocké ni enregistré.
- [ ] Re-dépôt sur une version déjà pourvue ⇒ **409** (immuabilité).
- [ ] Taille maximale et types acceptés configurables ; dépassement ⇒ **413** avec la limite dans
      le corps (l'écran doit pouvoir dire « 40 Mo max », pas « échec »).
- [ ] Un dépôt interrompu ne laisse **ni objet orphelin ni version à moitié publiée** (transaction
      ou nettoyage).
- [ ] `zone` exposée en lecture sur la version de référentiel.
- [ ] OpenAPI régénéré.

---

## Permissions — ⛔ IL EN MANQUE UNE

**C'est le point bloquant à arbitrer avant développement.**

Le catalogue des permissions D15 est **figé à 8 codes**, dupliqués à l'identique dans trois services
(K4), et la règle d'or est explicite : *« une permission n'existe que si un guard la vérifie »*.
Aucun de ces 8 codes ne désigne le dépôt d'un artefact de référentiel.

Deux options, à trancher par le PO :

| Option | Conséquence |
|---|---|
| **A — réutiliser `catalog:manage`** | Aucun changement de catalogue. Mais quiconque édite une fiche module peut aussi **injecter un binaire** servi à tous les cabinets. Les deux gestes n'ont pas le même rayon de dégâts. |
| **B — ajouter `referentiel:publish`** (9ᵉ code) | Sépare l'administration éditoriale du dépôt d'exécutable. Coût : ouvrir un enum figé, dupliqué **octet pour octet dans trois services**, et le propager (STORY-105, K4). |

**Recommandation : option B.** Un paquet de référentiel est du code exécuté par `bilan-service`
chez tous les porteurs. Le confondre avec « renommer un module » revient à donner un droit de
déploiement à qui n'a besoin que d'un droit de rédaction. Le coût de l'option B est ponctuel ; celui
de l'option A est permanent et invisible.

⚠️ Si B est retenue, la propagation des 8 → 9 codes est une **story préalable**, pas une tâche de
celle-ci.

---

## Definition of Done

- [ ] Critères d'acceptation validés ; tests unitaires + e2e (dont dépôt interrompu et re-dépôt).
- [ ] Décision de permission tranchée par le PO et **appliquée** (guard vérifié, pas seulement
      déclaré).
- [ ] Stockage objet provisionné par l'infra, documenté (bucket, rétention, accès).
- [ ] OpenAPI publié ; console rebasculée sur la vraie route (retrait du bandeau
      « aucune route de dépôt n'existe encore »).
