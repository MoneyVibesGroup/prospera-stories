# STORY-727 : Le contrat vend des PACKAGES — ouverture, palier, lecture seule, version par exercice, évolution, verticaux inclus

Status: review

**Services :** `paiement-service`, `platform-catalog-service`, `dossier-service`, `balance-service`,
`bilan-service`, `prospera-microfinance-service`, `prospera-assurance-service`,
`prospera-fiscal-service`, `notification-service` · **Recette :** `prospera-recette` (STORY-631)
· **Branches :** `MNV-727` dans chaque dépôt (catalogue empilée sur `MNV-279-referentiel-requis`),
+ `MNV-727-org-chaine` (catalogue, correctif trouvé par la recette) — **toutes fusionnées sur `dev`
le 2026-11-08**
**Origine :** recette STORY-631 (2026-11-07) — le contrat ouvrait un module à la carte (`FISCALITE`),
retiré de l'offre, et un module normatif s'ouvrait sans référentiel (corrigé par MNV-279,
écart `REFERENTIEL_REQUIS`).
**Arbitrages PO (2026-11-07 / 08) :**
- un cabinet achète des **packages** ; les référentiels viennent du package, il n'a rien à choisir ;
- on peut **ajouter un module à un package**, et quand un référentiel change de version, le cabinet
  suit **automatiquement** — par la version du package ;
- un exercice en cours **garde** sa version (pas de changement de plan de comptes en clôture) ;
- la comptabilité des **distributeurs, IMF et assureurs est incluse**, sans paiement, ajoutable ;
  un cabinet qui prend le module IMF peut tenir une microfinance ;
- **une seule story** (pas de 728/729), livrée en 8 lots dans l'ordre : contrat, ouverture, quota,
  lecture seule, version par exercice, évolution du package, verticaux, recette.

---

## Les lots

| Lot | Ce qui change | Où |
|---|---|---|
| 1 — Contrat | L'abonnement porte `packs` (≤ 10 clés), des modules en option et `dossiersMax` (palier) ; un contrat de packages seuls est valide. Le fait `echeance.encaissee` les transporte. | paiement |
| 2 — Ouverture | Une échéance soldée ouvre **tous les modules des packages** + les options ; chaque droit porte les référentiels du package qui tombent dans ses familles, `packs` (origine), `debutLe`, `config.dossiersMax`. Package inconnu ⇒ écart `PACK_INCONNU`. | catalogue |
| 3 — Palier | `dossier-service` projette les droits ; créer ou réactiver un dossier client au-delà de `dossiersMax` ⇒ 403 `PALIER_DE_DOSSIERS_ATTEINT`. | dossier |
| 4 — Lecture seule | Les read-models projettent `terme`/`echeanceLe`. **Échu ⇒ lecture seule** : GET/HEAD/OPTIONS passent, toute écriture ⇒ 403 `ABONNEMENT_EXPIRE`. Jamais coupé (conservation OHADA dix ans). La cloche de notification reste. Dans `dossier-service`, seules la création et la réactivation d'un dossier client sont refusées. | paiement, notification, balance, bilan, microfinance, assurance, fiscal, dossier |
| 5 — Version par exercice | Un exercice garde la version de référentiel de son **premier** jugement (balance : `referentiels_epingles`, unique par exercice × code ; bilan : la version du premier jeu de l'exercice). | balance, bilan |
| 6 — Évolution du package | Modifier un package propage à ses titulaires : les référentiels suivent ; un module ajouté s'ouvre au terme de ses frères (sans terme si l'un l'est, sinon la plus lointaine échéance), source `pack:<clé>`. Un droit révoqué n'est ni suivi ni rouvert. | catalogue |
| 7 — Verticaux inclus | Consommateur `identity.org.created/updated` (groupe `platform-catalog-identite`, `fromBeginning`) : `distributeur`, `imf-sfd`, `assurance-cima` reçoivent le package de leur vertical **sans terme**, source `vertical:<code>`. Un droit payé devient sans terme et gagne la famille du package. Idempotent par l'état. | catalogue |
| 8 — Recette | STORY-631 rejouée sur volumes neufs avec un contrat de packages, l'évolution d'un package et un distributeur. | prospera-recette |

## Critères d'acceptation

- [x] AC-1 — Un contrat de packages seuls s'engage ; `packs`, `dossiersMax` sont dans la vue et
      dans le fait `echeance.encaissee`.
- [x] AC-2 — Le paiement d'une échéance ouvre chaque module des packages, avec les référentiels du
      package, son origine et le palier ; un module normatif non couvert reste un écart nommé.
- [x] AC-3 — Au-delà du palier, un nouveau dossier client est refusé (403 nommé) ; sans palier,
      aucun plafond.
- [x] AC-4 — Un droit échu laisse lire et refuse d'écrire, dans chaque service gardé.
- [x] AC-5 — Un exercice entamé garde sa version de référentiel après une montée de version du
      package ; un exercice neuf prend celle du droit.
- [x] AC-6 — Un module ajouté à un package s'ouvre chez ses titulaires ; une nouvelle version de
      référentiel passe sur leurs droits.
- [x] AC-7 — Un distributeur, une IMF, un assureur reçoivent leur comptabilité sans terme, au seul
      fait de leur vertical ; un rejeu n'écrit rien.
- [x] AC-8 — La recette STORY-631 passe sur une pile neuve construite depuis les branches.
      ✅ **28/28 sur volumes neufs, pile construite depuis `origin/dev`** après fusion (2026-11-08).

## Preuves

- Test de câblage `AppModule` (`preview: true`) ajouté là où il manquait (dossier, bilan, balance,
  microfinance, assurance, fiscal) et complété (paiement, catalogue) — **chacun vérifié par
  mutation** (dépendance retirée ⇒ rouge).
- Assets d'artefacts : les ≈1 400 tests rouges « sha256 » de ce poste viennent d'autocrlf ; les
  suites de la story ont été jouées sur des assets ré-extraits en LF
  (`git -c core.autocrlf=false checkout`), donc **vertes pour de vrai**.

- **Recette (lot 8)** — `prospera-recette`, branche `MNV-631` : 28/28 (`abonnement`, `distributeur`,
  `pile`) sur volumes neufs (`COMPOSE_PROJECT_NAME=recette631`), d'abord depuis les branches, puis
  **rejouée depuis `origin/dev`** de chaque dépôt une fois tout fusionné. Elle couvre le contrat de
  packages, l'ouverture de tous les modules, la prolongation, l'évolution d'un package (module ajouté
  ⇒ ouvert chez le titulaire) et le distributeur qui reçoit sa comptabilité sans terme.
- ⛔ **Ce que la recette a trouvé, et que 4 000 tests unitaires verts ne voyaient pas** : l'octroi
  (paiement, vertical, package) écrivait `organizationId` en **`ObjectId`**. Dans le catalogue ce
  chemin est `Mixed` (`@Prop({ type: Types.ObjectId })` sans `SchemaTypes`) : rien n'est converti, le
  droit écrit est **introuvable** par `GET /entitlements/:org/:module` (qui cherche une chaîne) et
  **échappe à l'index unique** (org, module). Les doubles de test comparaient par `String()`, donc ne
  pouvaient pas le voir. Correctif `MNV-727-org-chaine` : la chaîne partout, comme le reste du
  service ; les doubles comparent désormais le **type** et la valeur, et les specs assèrent le type
  écrit. ⚠️ Une base de dev où l'octroi de 279 a déjà tourné peut garder des droits à `ObjectId` :
  les purger (aucune donnée de production concernée).
- Échecs **préexistants** de ce poste Windows, hors story : chemins à antislash (microfinance
  « classement », balance « devise-paquet », bilan « analyse.agnosticisme ») et fin de ligne CRLF
  (bilan `dossier-scope.invariant`) — rouges sur `origin/dev` avant la story, verts sous Linux.

## Arbitrages PO du 2026-11-08 sur les points ouverts

1. **Un cabinet qui tient des IMF ou des assureurs prend le module EN OPTION** (pas de package
   `cabinet-sfd` / `cabinet-cima`) : il ne tient que leur comptabilité. ⛔ **Aujourd'hui, ça ne
   marche pas** (doute du PO confirmé dans le code) : une option ne reçoit des référentiels QUE
   des packages du contrat (`ciblesDeLOffre`). Le package `cabinet` n'apporte que
   `syscohada-revise@2.3`, donc `microfinance` (famille `sfd-bceao`) tombe en écart
   `REFERENTIEL_REQUIS` et ne s'ouvre pas. Même s'il était ouvert à la main, la garde de
   microfinance exige `sfd-bceao@2.0` sur le droit de l'organisation. En revanche, la donnée est
   bien rangée **par dossier** (`dossiers/:dossierId`, référentiel du dossier contrôlé) : un
   cabinet peut structurellement tenir des dossiers d'IMF. ➡️ **Story à ouvrir** : une option
   normative apporte ses référentiels (ceux du package de son vertical), et la comptabilité du
   cabinet (`balance`, `bilan`) gagne la famille correspondante.
2. **Un impayé SUSPEND les accès, sans supprimer aucune donnée.** Consommer
   `paiement.abonnement.impayee` (suspendre) et `regularise` (rétablir) dans le catalogue. Portée
   par **STORY-280** (« Impayé, suspension et préavis », au tracker, sans fiche).
3. **`facturation` du package `distributeur` en écart `REFERENTIEL_REQUIS` : normal**, rien à
   changer (le référentiel `zone-franche-togo` ne concerne que les entreprises en zone franche).
4. **Un reclassement hors d'un vertical inclus ne retire rien** : confirmé (règle STORY-549).
5. **La propagation remplace les référentiels posés à la main** : confirmé, c'est le
   comportement voulu (le package fait foi).

## Ce qui était ouvert (texte d'origine)

1. **Packages `cabinet-sfd` / `cabinet-cima`** : un cabinet qui tient des IMF ou des assureurs
   achète-t-il un package dédié, ou le module en option ? Rien n'est semé.
2. **`paiement.abonnement.impaye` / `regularise`** ne sont toujours consommés par personne : un
   impayé ne suspend rien. Suspendre ou révoquer ? (STORY-279, point légué.)
3. **Package `distributeur`** : son module `facturation` est de la famille `zone-franche-togo`,
   que le package n'apporte pas ⇒ écart `REFERENTIEL_REQUIS`, il ne s'ouvre pas. Ajouter le
   référentiel au package, ou retirer la famille du module ?
4. Un reclassement **hors** d'un vertical inclus ne retire rien (règle STORY-549) — à confirmer.
5. La propagation remplace les référentiels d'un droit par ceux de ses packages d'origine : un
   référentiel posé à la main par l'opérateur sur un droit issu d'un package serait retiré.
