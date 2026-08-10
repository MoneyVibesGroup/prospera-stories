# TICKET-BACKEND — le dossier client devient une entité de premier rang

**Cible :** `BACKEND` — nouveau `dossier-service` + `balance-service`, `bilan-service`, `document-service`, `fiscal-service`. *Un volet `FRONTEND` (app cabinet) en découle et ne peut pas démarrer avant : il est décrit au bloc **I** pour que la portée soit lisible d'un bloc, mais il ne se traite pas ici.*
**Origine :** question du PO — « au niveau des stories backend, y en a-t-il une qui permet de créer un dossier client au niveau du cabinet ? » → **non**, vérifié dans le code
**Ouvert le :** 2026-08-09 · **Statut :** ➡️ **REPRIS le 2026-08-09 — les 16 blocs sont devenus 13 stories, toutes slottées au SPRINT 20 sous `EPIC-043`. Les stories font désormais foi ; ce ticket devient un état transitoire clos.**

> **Table de reprise** — 8 stories créées, 5 **réancrées** (elles gardent leur numéro, `origin/main` fait foi) :
>
> | Bloc | Story | Pts | Service | Origine |
> |:--:|---|--:|---|---|
> | **B** noyau | **STORY-301** | 8 | `dossier-service` | ⚡ réancrée *(S23, `fiscal-service`)* — 5→8, porte aussi le scaffold |
> | **B** RBAC | **STORY-353** | 5 | `dossier-service` | 🆕 |
> | **O** | **STORY-354** | 2 | `dossier-service` | 🆕 |
> | **C** | **STORY-304** | 5 | `dossier-service` | ⚡ réancrée *(S23)* |
> | **C / D10** | **STORY-302** | 3 | `dossier-service` | ⚡ réancrée et **scindée** *(S23)* — 5→3 |
> | **J** | **STORY-355** | 8 | `dossier-service` | 🆕 |
> | **D** | **STORY-356** | 8 | 3 services | 🆕 |
> | **E** | **STORY-236** | 8 | `balance-service` | ⚡ réancrée *(S22, tête de sprint)* — porte `dossierId`, pas un `societeId` local |
> | **F** | **STORY-357** | 5 | `bilan-service` | 🆕 |
> | **G** | **STORY-358** | 3 | `document-service` | 🆕 |
> | **M** | **STORY-303** | 5 | `dossier-service` | ⚡ réancrée *(S24)* |
> | **K + P** | **STORY-359** | 8 | `dossier-service` | 🆕 |
> | **L + N** | **STORY-360** | 5 | `dossier-service` | 🆕 |
>
> **73 points.** Bloc **A** (correction des PRD) = documentation, pas une story. Bloc **H** se réduit à
> supprimer le `dossierId` local de `fiscal-service` — à traiter au sprint fiscal.
>
> ⚡ **Bloc I (frontend) — PORTÉ DEPUIS LE 2026-08-09.** Il restait hors de ce ticket *par
> construction*, et n'avait donc **aucun porteur** : c'est exactement le défaut de chaînage que ce
> programme a déjà payé trois fois. Il est désormais découpé en **11 stories frontend, 57 points,
> `FE-EPIC-008`, sprints frontend 19.1 → 19.3** — toutes `blocked` sur l'amont unique qu'est le
> sprint 20 backend :
>
> | Sprint FE | Stories | Pts | Objet |
> |:--:|---|--:|---|
> | **19.1** | FE-059 · FE-060 · FE-061 | 18 | portefeuille · assistant de création + mandat · fiche du dossier |
> | **19.2** | FE-062 · FE-063 · FE-066 | 18 | sélecteur de dossier actif · re-scopage Atelier · exercices |
> | **19.3** | FE-067 · FE-064 · FE-065 · FE-068 · FE-069 | 21 | re-scopage Bilan · pièces · axes datés · journal · Integration Gate 🏁 |
>
> Détail dans `frontend-sprint-status.yaml` v5.4.0 et `frontend-stories/FE-059.md` → `FE-069.md`.
> ⚠️ Les stories réutilisent **FE-040/041/042** (identité, OCR, 2 axes) et **FE-029** (exercices) au
> lieu de les réécrire — même discipline que les 5 réancrages backend ci-dessus.
**Mis à jour le 2026-08-09** *(2ᵉ entrée)* : maquette du parcours cabinet **validée par le PO** → **4 blocs J/K/L/M ajoutés** au §5 bis et **4 questions Q6→Q9** ouvertes. Q3 tranchée.
**Mis à jour le 2026-08-09** *(4ᵉ entrée)* : ⚡ **question du PO — « ces stories ne sont-elles pas déjà programmées ? »** Vérification faite sur les 296 stories du tracker : **STORY-301, 302, 303 et 304 (module Fiscalité, sprint 23-24) portent déjà les blocs B, C et M**, et STORY-066/067 ont livré le cycle de vie d'exercice et la piste d'audit. ⇒ **§5 ter ajouté : 4 réancrages + 8 stories neuves**, au lieu de 12 créations. Toutes les questions Q1→Q12 sont closes.
**Mis à jour le 2026-08-09** *(3ᵉ entrée)* : analyse détaillée de la partie dossier → **6 décisions D11→D16** prises, **3 blocs N/O/P ajoutés**, blocs **B** et **K** étendus, Q4 et Q5 tranchées, **Q10→Q12** ouvertes. ⚡ Découverte : `notification-service` **n'existe pas dans le dépôt** alors que D12 en dépend.
**Méthode :** chaque constat est **lu dans le code des services** (contrôleurs, schémas, DTO), jamais déduit d'un tracker
**Ne rien implémenter avant :** validation de la maquette interactive du parcours cabinet par le PO

---

## Pourquoi un ticket et pas des stories directes

La décision renverse une **invariante d'architecture livrée et assumée**, présente dans le schéma le
plus consommé du produit. Elle touche neuf briques et casse le contrat d'un grand nombre de routes
déjà en production interne. Découper en stories avant d'avoir arrêté le modèle produirait des stories
qui se contredisent entre elles — c'est exactement ce que ce ticket existe pour éviter.

Le PO a demandé une **maquette interactive du parcours cabinet complet** avant le découpage : il
veut voir le process de bout en bout pour compléter ce ticket si nécessaire. **Rien ne démarre avant
cette validation.**

---

## 1. Le constat — vérifié dans le code le 2026-08-09

| Ce qui a été lu | Où | Ce que ça dit |
|---|---|---|
| « **Une organisation = une société** […] aucune notion de « dossier » ; un cabinet qui gère 20 clients a **20 organisations** » | `balance-service/src/modules/profil-societe/schemas/profil-societe.schema.ts` §36-38 | Le modèle actuel exclut explicitement le dossier |
| Index **unique** sur `orgId` + `409 PROFIL_SOCIETE_DEJA_EXISTANT` | même schéma · `profil-societe.service.ts:85,96` · `profil-societe.controller.ts:74-77` | Un cabinet ne **peut pas** créer une 2ᵉ société : le serveur refuse |
| « Aucune route ne prend d'`orgId` : l'organisation vient **toujours** du JWT » | `profil-societe.controller.ts:37-40` | Le scope est le tenant, jamais un dossier |
| `referentiel` est **envoyé par le client** à chaque balance (`@IsIn(['SN','SMT','SFD-BCEAO'])`) | `balance-service/src/modules/balance/dto/submit-balance.dto.ts:128` | Rien n'empêche de calculer une microfinance sur le plan entreprise |
| `dossierId` = « regroupement, **local au service** » | `architecture-fiscal-service-2026-08-03.md:302,309` | Le seul « dossier » planifié (STORY-301, S23) n'ouvrirait ni Atelier ni Bilan |
| `ActionnaireSub` = `nom`, `type`, `parts`, `pourcentage` | `profil-societe.schema.ts:12-22` | Ni nationalité ni n° de pièce (demandés par la maquette FE-D01) |
| ⚡ **Une seule route sur les exercices de l'Atelier : `POST /exercices/:exercice/ouvrir`** | `balance-service/.../reprise/exercices.controller.ts:43` | **Aucun `GET`** : la liste des exercices d'un dossier n'a **aucune source** |
| ⚡ **Deux modèles d'exercice**, divergents : `ExerciceAtelier` (`CLOS` **terminal**, clôture uniquement en **effet de bord** de la reprise) vs `Exercice` du Bilan (CRUD complet **+ `POST :id/rouvrir`**) | `exercice-atelier.schema.ts:6-16,29-40` · `exercices.repository.ts:97` · `bilan-service/.../exercice.controller.ts:76-143` | « L'exercice 2023 est-il clos ? » a **deux réponses** possibles selon le service interrogé |
| `listerAudits` n'est appelé **que** pour reconstituer l'état à une date passée (consommé par le snapshot de liasse) | `profil-societe.service.ts:356` — **aucun contrôleur** ne l'expose | La piste d'audit du profil est **écrite mais illisible** : même défaut que STORY-144 → STORY-294 |
| `systemeComptable` / `regimeFiscal` sont des champs **courants** du profil, non datés | `profil-societe.schema.ts:114-118` | Changer un axe en 2026 change ce que le moteur applique à un **recalcul** de 2023 — seule la liasse **figée** est protégée |

**Déjà couvert, à ne pas refaire :** OCR carte CFE + statuts (STORY-081), identité fiscale complète et
historisée (STORY-079), proposition + confirmation des 2 axes (STORY-080), NIF du dirigeant
(`DirigeantSub.nif`), exercice à bornes libres (`ExerciceAtelier.bornes` — 1ᵉʳ exercice irrégulier
possible), référentiels packagés SN / SMT / SFD-BCEAO / CIMA.

---

## 2. La décision — dix règles tranchées par le PO le 2026-08-09

> **Le dossier devient l'unité de travail du cabinet.** Une organisation cabinet porte **N dossiers**.
> L'admin du cabinet, s'il détient les modules Balance et Bilan, les exerce **sur un dossier client
> ou sur lui-même**. Aujourd'hui le dossier client n'est pas intégré.

| # | Règle | Décision |
|:--:|---|---|
| **D1** | Dossier propre du cabinet | **Créé automatiquement à l'activation**, marqué « Mon cabinet », **non supprimable, non détachable** |
| **D2** | KYC | **Reste au cabinet.** Le client final n'a pas de compte : on ne peut pas lui demander de se vérifier. Ce qui le remplace = **l'attestation de mandat** à la création du dossier |
| **D3** | Abonnement | **Sur le cabinet en v1** : un module octroyé vaut pour **tous** ses dossiers. Aucun compteur, aucun plafond technique |
| **D4** | Propriétaire du dossier | **Service dédié et mince** — dossier, affectation, mandat, événements. `balance`, `bilan`, `document` et `fiscal` en tiennent chacun un **read-model**. ⚡ *Précision PO : « ainsi dans son dossier client on a toutes les informations »* — le dossier est le point de convergence, pas un simple identifiant |
| **D5** | Re-scopage des routes | **Oui, en une fois** — `orgId` → `orgId + dossierId`. ⚠️ *Nuance PO : « si c'est nécessaire, parce que ce n'est pas toutes les routes »* → **inventaire route par route obligatoire** (§4), on ne re-scope que ce qui porte de la donnée de dossier |
| **D6** | Visibilité | Admin = **tout le portefeuille** ; collaborateur = **ses dossiers affectés**. Un dossier a **un responsable** et éventuellement des **contributeurs** |
| **D7** | Référentiel | **Déduit du type d'entité**, conjointement : Entreprise → SYSCOHADA · Microfinance → SFD-BCEAO · Assurance → CIMA — plan de comptes + table de passage + gabarit de liasse + paquet fiscal **ensemble**. Une combinaison incohérente est **refusée**, jamais calculée |
| **D8** | Migration | **Automatique** : chaque profil existant devient le dossier « Mon cabinet » de son org ; balances, exercices et liasses s'y rattachent. Après migration, `dossierId` est **obligatoire partout** |
| **D9** | Suppression | **Non — archivage.** Sort du portefeuille actif, reste consultable, pièces toujours opposables. Aucune suppression physique |
| **D10** | Multi-pays | **Un seul pays en v1.** Le multi-implantation viendra **par-dessus** via le module Fiscalité, sans casser ce socle. Clé conservée : `(dossier, pays)` |

### Deuxième passe — tranchée le 2026-08-09 après analyse de la maquette

| # | Règle | Décision |
|:--:|---|---|
| **D11** | Visibilité du dossier « Mon cabinet » | **Administrateur uniquement.** Il porte la comptabilité du cabinet — salaires, résultat : il n'est jamais affectable à un collaborateur, ni visible de lui |
| **D12** | Droit de modification du collaborateur | **Oui**, un collaborateur modifie un dossier qui lui est affecté — **mais l'administrateur doit être informé de chaque modification et de son auteur**. ⚡ Le droit est large ; c'est la **traçabilité remontée** qui l'encadre, pas une liste de champs interdits |
| **D13** | Droit d'archivage | **Administrateur uniquement.** Un collaborateur qui archiverait son dossier le ferait disparaître du portefeuille de tout le cabinet |
| **D14** | Unicité | **Le NIF de la société est toujours différent** d'un dossier à l'autre. Le **NIF du dirigeant** peut, lui, être partagé par plusieurs dossiers (un même gérant tient plusieurs sociétés) |
| **D15** | Échéance | La **carte du dossier porte la prochaine échéance**. Le portefeuille dit ce qui presse, sans qu'il faille ouvrir chaque dossier |
| **D16** | Passage à l'échelle | **Vue liste dense + pagination.** La grille de cartes ne tient pas au-delà de quelques dizaines de dossiers |

---

## 3. Le process cible — six temps

| # | Temps | Qui | État aujourd'hui |
|:--:|---|---|---|
| 1 | **Le cabinet s'active** — e-mail, KYC, abonnement, modules octroyés. Ne se rejoue **jamais** par dossier | admin | ✅ livré |
| 2 | **Créer un dossier** — CFE + statuts → OCR → identité vérifiée → type + pays → 2 axes confirmés → exercice → affectation → **attestation de mandat** (ligne de journal horodatée, sans pièce) | admin | ⛔ rien côté serveur |
| 3 | **Ouvrir un dossier** — il devient le **contexte actif** ; tout ce qui suit s'écrit et se lit pour lui | collaborateur | ⛔ rien côté serveur |
| 4 | **Travailler** — Atelier Balance (Sage / saisie / cahiers) → contrôles → validation → Bilan &amp; liasse → fiscal | collaborateur | 🟠 moteurs livrés, **scope à poser** |
| 5 | **Restituer** — liasse figée, DSF, déclarations, accusés, rattachés au dossier / exercice / obligation | expert-comptable | 🟠 partiel |
| 6 | **Clore sans perdre** — archivage ; historique consultable même après le départ du collaborateur ou la fin de la relation | admin | ⛔ à définir |

---

## 4. Inventaire de re-scopage — application de la nuance D5

⚠️ **Cette table est le premier passage, à la maille du contrôleur.** Le détail route par route se
fait à la rédaction des stories. Le principe : *une route ne prend `dossierId` que si elle porte de
la donnée propre à une société traitée.*

### 4.1 — Ne bouge pas (donnée de cabinet, pas de dossier)

| Service | Familles | Pourquoi |
|---|---|---|
| `auth-service` | `/users`, `/users/me`, `/organizations/me`, `/admin/*`, invitations, rôles, JWKS | Le cabinet reste le tenant : membres, identité de compte, permissions |
| `kyc-service` | `/kyc/*`, `/admin/kyc/*` | D2 — le KYC est au cabinet |
| `platform-catalog-service` | `/catalog/modules`, `/catalog/referentiels`, `/catalog/entitlements/*`, `/catalog/admin/*` | D3 — l'octroi porte sur le cabinet ; les référentiels sont des artefacts versionnés, pas de la donnée client |
| `expert-comptable` | `/tenant/state`, `/auth/me`, `/billing/plans` | État et facturation du cabinet |
| `prospera-admin-panel-service` | tout `/admin/*` | La console administre des **organisations** |

### 4.2 — Passe en `orgId + dossierId`

| Service | Familles | Note |
|---|---|---|
| `balance-service` | `profil-societe` *(→ **migre** vers le nouveau service)*, `profil-societe/regime`, `balances`, `imports`, `balance/rejets`, `exercices`, `balance` *(reprise)*, `balance/import` *(Sage)*, `balance` *(agrégation cahiers)*, `balance/comptes-ventilation`, `cahiers/depenses`, `cahiers/recettes`, `pieces/ocr`, `rattachement`, `fiscal/*` *(7 contrôleurs)* | ⚠️ **`cahiers/categories` à trancher** : configuration réutilisable d'un dossier à l'autre, ou propre au dossier ? |
| `bilan-service` | `bilan/audit`, `bilan` *(diagnostics)*, `bilan/comparaison`, `bilan/consultation`, `bilan/exercices`, `bilan/export`, `bilan/hypotheses`, `bilan/etats`, `bilan/mapping-overrides`, `bilan/previsionnel` | La comparaison N/N-1 et le prévisionnel n'ont de sens **qu'à l'intérieur d'un dossier** |
| `document-service` | `documents`, `piece-extractions`, `profil-extractions` | **Additif** : le rattachement au dossier s'ajoute, l'org reste |
| `fiscal-service` *(S22+)* | tout le module | **Allégé** : STORY-301 ne crée plus le dossier, elle le **consomme** ; son `dossierId` local disparaît |

---

## 5. Le travail à faire — non encore découpé

> Ordre imposé : chaque bloc rend le suivant possible. **Aucun numéro de story attribué** tant que la
> maquette n'est pas validée — le PO a annoncé vouloir compléter ce ticket après l'avoir analysée.

| # | Bloc | Portée | Dépend de |
|:--:|---|---|---|
| **A** | **Corriger les PRD** — PRD Atelier Balance et PRD Fiscalité : la société traitée est un **dossier**, pas une organisation | documentation | — |
| **B** | **Socle `dossier-service`** — modèle Dossier (identité fiscale, type d'entité, pays, 2 axes, statut), création, **attestation de mandat** (D2), **affectation** responsable + contributeurs (D6), **archivage** (D9), dossier « Mon cabinet » auto-créé à l'activation (D1), événements `dossier.*` | nouveau service | A |
| **C** | **Résolution conjointe type d'entité → référentiel + paquet fiscal** (D7), combinaison incohérente **refusée** | `dossier-service` | B |
| **D** | **Migration** — profils existants → dossier « Mon cabinet » ; rattachement des balances, exercices et liasses ; `dossierId` rendu obligatoire (D8) | `balance-service`, `bilan-service` | B |
| **E** | **Re-scopage `balance-service`** — §4.2, plus le read-model `dossier` | `balance-service` | D |
| **F** | **Re-scopage `bilan-service`** | `bilan-service` | D |
| **G** | **Rattachement au dossier dans `document-service`** *(additif)* | `document-service` | B |
| **H** | **Réancrage `fiscal-service`** — STORY-301 devient consommatrice ; suppression du `dossierId` local | `fiscal-service` | B |
| **I** | **Frontend cabinet** — portefeuille, assistant de création, **sélecteur de dossier actif**, re-scopage de tous les écrans Atelier et Bilan livrés | app cabinet | E, F |

**Complète les manques déjà relevés par les maquettes**, à intégrer au bloc B :
`ActionnaireSub` sans **nationalité** ni **n° de pièce d'identité** · champs de dirigeants **variables
selon la forme juridique** (gérant + associés vs président + actionnaires ; ni l'un ni l'autre pour un
entreprenant).

---

## 5 bis. Ce que la maquette validée le 2026-08-09 ajoute

> Le PO a validé le prototype augmenté des Dossiers clients (portefeuille scopé au rôle, **liste des
> exercices dans le dossier**, **configuration modifiable**). Trois surfaces validées à l'écran n'ont
> **aucun serveur** derrière. Elles ne relèvent pas du re-scopage : ce sont des **manques de contrat**,
> qui existeraient même sans la décision « dossier ».

| # | Bloc | Ce qui manque, vérifié dans le code | Dépend de |
|:--:|---|---|---|
| **J** | **Exercices d'un dossier : lecture et cycle de vie explicite** | `exercices.controller.ts` n'expose qu'un `POST :exercice/ouvrir` — **aucun `GET`**, donc la liste de la maquette est **inservable**. Il manque : lister les exercices d'un dossier (bornes, statut, origine, auteur et date d'ouverture/clôture), **clore explicitement** (aujourd'hui la clôture n'arrive qu'en effet de bord de la reprise), et **ouvrir un exercice futur** sans reprise. ⚠️ Inclut l'**arbitrage Q6** ci-dessous. | B, E |
| **K** | **Vue consolidée : ligne d'exercice et compteurs de portefeuille** | Une ligne de la maquette (« 2023 · clos · balance validée · liasse figée v2 · impôt dû 1 964 000 ») agrège **trois services** : `balance-service` (statut de balance), `bilan-service` (liasse figée + version), `fiscal` (liquidation). **Aucune route ne les réunit.** Idem pour les 3 compteurs du portefeuille (« dossiers », « à configurer », « bilans en cours ») : ils supposent un état agrégé **par dossier**, calculé serveur. La portée doit être **dérivée du jeton**, jamais d'un paramètre de requête. | B, E, F |
| **L** | **Historique de configuration lisible** | `profils_societe_audit` est écrit en append-only depuis STORY-079, mais `listerAudits` n'est appelé **que** pour reconstituer un état passé (usage interne du snapshot) : **aucune route ne l'expose**. La maquette affiche « dernière modification le 2 août par Kofi Santos · version 4 » — sans source. C'est **la répétition exacte** du défaut STORY-144 (écriture sans lecture), repris par STORY-294 pour le journal des organisations. | B |
| **M** | **Régime daté par exercice** | `systemeComptable` et `regimeFiscal` sont des champs **courants** du profil. La maquette promet « un changement d'axe ne rejoue pas les exercices déjà clos » : c'est vrai pour une **liasse figée** (snapshot), **faux pour tout recalcul** — le moteur fiscal lit la valeur courante. Il faut soit dater le couple d'axes par exercice, soit refuser le changement quand un exercice ouvert le consomme. | B, E |

### Blocs ajoutés par la deuxième passe de décisions (D11 → D16)

| # | Bloc | Ce qui manque, vérifié dans le code | Dépend de |
|:--:|---|---|---|
| **N** | **Informer l'administrateur des modifications (D12)** | ⚠️ **`notification-service` N'EXISTE PAS dans le dépôt.** Son architecture est cadrée (spine AD-1→AD-19 du 2026-08-04, port `:3008`), **aucun code n'est écrit**. Le besoin « l'admin est informé de chaque modification et de son auteur » n'a donc **ni service, ni story, ni sprint**. ⇒ **Arbitrage obligatoire** : *(a)* créer le service et faire dépendre le socle dossier d'un module entier non commencé, ou *(b)* **v1 sans notification poussée** — un **fil d'activité du portefeuille** lisible par l'admin (qui a modifié quoi, sur quel dossier, quand) avec un compteur de non-lus, servi par le bloc **L**. **Recommandation : (b)** — le besoin est « savoir », pas « recevoir un e-mail ». | L, B |
| **O** | **Contraintes d'unicité du dossier (D14)** | Le seul index posé est `{ orgId: 1 }` unique (`profil-societe.schema.ts:142`) : **rien n'assure aujourd'hui l'unicité d'un NIF**, et pour cause — il n'y avait qu'un profil par organisation. À poser : **unique partiel `(orgId, pays, nifSociete)`** — *partiel*, parce que STORY-079 autorise délibérément la **saisie progressive** (un dossier se crée sans NIF connu, `GET /completude` dit ce qui bloque la DSF). **Aucune contrainte** sur le NIF du dirigeant : un même gérant tient plusieurs sociétés. Le contrôle doit rendre un **409 explicite nommant le dossier existant**, sinon l'utilisateur ressaisit tout sans comprendre. | B |
| **P** | **Prochaine échéance par dossier (D15)** | La donnée **existe** — le paquet fiscal `paquet-fiscal-togo-2026.json` porte une clé `echeances` — mais **aucun contrôleur ne l'expose** : `grep echeance` sur les contrôleurs de `balance-service/src/modules/fiscal/` ne rend **rien**. Le calendrier fiscal complet est planifié au **module Fiscalité** (FR-F16/F17, EPIC-030, sprint backend 24+), soit **après** le socle dossier. ⚡ **Inversion de dépendance à arbitrer** : soit le portefeuille attend le module Fiscalité, soit on sert une **échéance minimale** dérivée du paquet fiscal déjà chargé (prochaine date due pour le régime du dossier), remplacée plus tard par le calendrier complet. **Recommandation : l'échéance minimale**, sinon D15 bloque le portefeuille pendant six sprints. | B, K |

**Le bloc K est étendu par D16** : le portefeuille se lit **paginé, trié et recherché côté serveur**
(page, taille, tri, requête), avec une **vue liste dense** en plus des cartes. La portée reste dérivée
du jeton. Cible de tenue : le NFR du PRD Fiscalité parle de **500 dossiers** — une grille qui rend
tout d'un coup est hors-jeu dès le premier cabinet sérieux.

**Le bloc B est étendu par D11 et D13** : le dossier `estLeCabinet` n'est **ni affectable, ni visible**
d'un collaborateur — la règle vit dans la requête de portée, jamais dans l'affichage ; et l'archivage
porte une **autorisation d'administrateur**, distincte du droit de modifier.

**À intégrer au bloc C** *(et non à créer à part)* : la garde **« changer le type d'entité est refusé
dès qu'un exercice est validé »**, affichée à l'écran par la maquette. Elle répond à la question Q3 du
§8, désormais tranchée : une liasse figée cite son référentiel, le rejouer rétroactivement rendrait
faux un document déjà déposé. La bascule passe par une **demande tracée avec reprise à-nouveaux**.

**Ce que la maquette confirme comme DÉJÀ COUVERT**, à ne pas redemander : modification de l'identité
(`PATCH /profil-societe`, historisé + versionné + verrou optimiste), changement des 2 axes avec
**motif de surcharge obligatoire** (`POST /profil-societe/regime`), exercice à **bornes libres** donc
premier exercice irrégulier (`ExerciceAtelier.bornes`), reprise d'à-nouveaux et origine `MIGRATION`
pour un exercice tenu hors Prospera.

---

## 5 ter. ⚠️ Ce qui est DÉJÀ PLANIFIÉ — réancrer, ne pas dupliquer

> Vérification faite le 2026-08-09 sur les **296 stories** du tracker, avant tout découpage. **Quatre
> stories du module Fiscalité portent déjà l'objet de mes blocs B, C et M** — mais dans
> `fiscal-service`, aux sprints 23-24, et avec un `dossierId` **local au service**. Les écrire une
> seconde fois aurait produit exactement le défaut que ce ticket existe pour éviter : **deux concepts
> de client** à fusionner plus tard sur des données réelles.

| Bloc | Story existante | Sprint | Service | Statut | Ce qu'il faut en faire |
|:--:|---|:--:|---|---|---|
| **B** | **STORY-301** — « Dossier fiscal, attestation de mandat et historisation » | 23 | `fiscal-service` | `not_started` | ⚡ **RÉANCRER** : même objet, mauvais propriétaire (D4) et six sprints trop tard. Devient le socle du dossier **client** dans `dossier-service` |
| **C** | **STORY-304** — « Résolution conjointe type d'entité → référentiel et paquet » | 23 | `fiscal-service` | `not_started` | ⚡ **RÉANCRER** tel quel : c'est **exactement** D7, au bon niveau de détail, dans le mauvais service |
| **C / D10** | **STORY-302** — « Implantations fiscales : création, type d'entité, clôture » | 23 | `fiscal-service` | `not_started` | ⚡ **SCINDER** : le **type d'entité** remonte au dossier (bloc C) ; le **multi-implantation** reste au module Fiscalité et vient *par-dessus* le socle (D10, « un seul pays en v1 ») |
| **M** | **STORY-303** — « Proposition et confirmation des régimes par implantation » | 24 | `fiscal-service` | `not_started` | ⚡ **RÉANCRER partiellement** : tant qu'on est mono-pays, le couple d'axes appartient au **dossier**, pas à l'implantation. Le volet « par implantation » reste au module Fiscalité |
| **P** | **STORY-316** (calcul des échéances depuis le paquet) · **STORY-315** (calendrier centralisé) · **STORY-318** (alertes) | 25-26 | `fiscal-service` | `not_started` | ✅ **LAISSER EN PLACE.** Q11 a tranché : une **échéance minimale** en v1, remplacée par ces stories le moment venu. Le bloc **P** est une avance délibérément jetable, pas un doublon |
| **J** | **STORY-066** — « Gestion des exercices comptables + chaînage N/N-1 + ré-ouverture contrôlée » | 14 | `bilan-service` | ✅ `done` | ⚡ **Le modèle existe et il est LIVRÉ.** Q6 dit que le dossier fait foi ⇒ le bloc J **réancre** ce cycle de vie, il ne le réécrit pas. Idem `ExerciceAtelier` côté balance |
| **L** | **STORY-067** (piste d'audit du Bilan, `done`) · **STORY-294** (route de lecture du journal des organisations, S20) | 14 / 20 | `bilan` / `auth` | `done` / `ready-for-dev` | ✅ **Patron existant à rejouer**, pas à inventer : 067 écrit, 294 montre comment on ouvre la lecture. Le bloc **L** applique la même forme au dossier |

**Conséquence sur le découpage : on passe de 12 stories neuves à 8**, plus **4 réancrages**. Les quatre
stories réancrées gardent leur numéro (`origin/main` fait foi et le tracker les cite déjà) ; seuls leur
**service**, leur **epic** et leur **sprint** changent.

⚠️ **Effet de bord à assumer sur le module Fiscalité** : EPIC-028 perd 3 de ses 4 stories de sprint 23.
Ce n'est pas une perte de périmètre — c'est le même travail, fait plus tôt et au bon endroit, dont le
module Fiscalité devient **consommateur**. Le bloc **H** (« réancrage `fiscal-service` ») se réduit
d'autant : il ne reste qu'à supprimer le `dossierId` local et à brancher le read-model.

---

## 6. Ce que la décision ne touche pas

- Le parcours d'activation du cabinet : e-mail, KYC, abonnement, invitations, rôles.
- Les référentiels packagés (SYSCOHADA, SMT, SFD-BCEAO, CIMA) et leurs checksums.
- Les moteurs : équilibre de balance, mapping, liasse, `IS = max(MFP, IS)`, conseil fiscal.
- La console Money Vibes : elle administre des organisations, et continue.

---

## 7. Risques

1. ⚡ **Deux concepts de client.** Si le module Fiscalité démarre avant le bloc B, STORY-301 crée son
   propre dossier, local et incompatible — et il faudra les fusionner **sur des données réelles**.
   *Le module Fiscalité est planifié au sprint backend 22 ; le bloc B doit passer devant.*
2. **Le re-scopage frontend est sous-estimé.** Une trentaine d'écrans Atelier et Bilan supposent
   « une org = une société ». Ils ne cassent pas : ils **affichent silencieusement le mauvais
   dossier** — la panne la plus coûteuse à diagnostiquer.
3. **D3 rouvert trop tard.** Facturer au dossier après coup, c'est ajouter un plafond à un produit
   dont les cabinets auront déjà créé leurs dossiers sans limite. La décision v1 est « au cabinet » ;
   si le modèle commercial change, ça se décide **avant** le bloc B, pas après.
4. ⚡ **D12 s'appuie sur un service qui n'existe pas.** « L'administrateur doit être informé » suppose
   `notification-service` : son architecture est écrite depuis le 2026-08-04, **son code n'existe pas**
   et il n'est dans aucun sprint. Traiter D12 comme acquis ferait dépendre le socle dossier d'un module
   entier non commencé — d'où l'option *(b)* du bloc **N**.
5. **La migration D8 vieillit mal.** Chaque semaine ajoute des balances et des liasses sans dossier à
   rattacher — aujourd'hui la donnée est jeune, c'est la fenêtre.

---

## 8. Questions dérivées, encore ouvertes

| # | Question | Piste |
|:--:|---|---|
| Q1 | `cahiers/categories` : configuration de cabinet réutilisable, ou propre au dossier ? | ✅ **TRANCHÉE le 09/08 : propre au dossier.** La famille passe donc en scope `dossierId` (§4.2, la réserve est levée) |
| Q2 | Que devient un dossier quand son responsable quitte le cabinet ? | ✅ **TRANCHÉE : il retombe à l'administrateur**, jamais orphelin ; l'historique reste attaché au dossier, pas à la personne |
| Q3 | Un dossier peut-il changer de type d'entité après des exercices validés ? | ✅ **TRANCHÉE le 09/08 par la maquette : non.** Refus explicite, bascule par demande tracée avec reprise à-nouveaux → garde à écrire au bloc **C** |
| Q6 | ⚡ Quel service fait foi sur « l'exercice est clos » ? | ✅ **TRANCHÉE : le DOSSIER porte le cycle de vie de l'exercice** ; `balance` et `bilan` en tiennent chacun un **read-model**. Les deux modèles actuels deviennent des projections. Bloc **J** |
| Q7 | Un exercice antérieur à l'entrée en portefeuille est-il listable ? | ✅ **TRANCHÉE : OUI, en consultation, avec son contenu** (balance reprise, à-nouveaux, comparatifs) — « pour faciliter ». L'ajout rétroactif d'un exercice ancien est donc **autorisé**, en `origine: MIGRATION`, sans liasse Prospera. Bloc **J** |
| Q8 | Peut-on ouvrir un exercice futur pendant qu'un autre est en cours ? | ✅ **TRANCHÉE : NON — un seul exercice ouvert à la fois.** L'exercice courant est celui de l'année en cours ; **il faut le clore pour en ouvrir un autre**. Invariant serveur : `409` si un exercice `OUVERT` existe déjà. Bloc **J** |
| Q9 | Portée d'un changement d'axe | ✅ **TRANCHÉE : à partir de l'exercice ouvert, jamais globalement.** Le couple d'axes devient **daté par exercice**. Bloc **M** |
| Q4 | Le dossier « Mon cabinet » est-il visible de tous les collaborateurs, ou réservé à l'admin ? | ✅ **TRANCHÉE le 09/08 → D11 : administrateur uniquement** |
| Q5 | Deux dossiers d'un même cabinet peuvent-ils porter le même NIF ? | ✅ **TRANCHÉE le 09/08 → D14 : NIF de la société toujours différent ; NIF du dirigeant partageable.** Bloc **O** |
| Q10 | Le socle dossier attend-il `notification-service` ? | ✅ **TRANCHÉE : non — option (b).** Fil d'activité lisible dans l'app en v1 ; la notification poussée viendra quand le service existera. Bloc **N** |
| Q11 | L'échéance de D15 attend-elle le module Fiscalité ? | ✅ **TRANCHÉE : non.** Échéance **minimale** dérivée du paquet fiscal déjà chargé, remplacée par le calendrier complet quand EPIC-030 arrivera. Bloc **P** |
| Q12 | Le collaborateur peut changer le type d'entité | ✅ **CONFIRMÉE : conséquence assumée.** La seule barrière est la garde du bloc **C** — refus dès qu'un exercice est validé |

---

## Liens

- **Note de cadrage validée (D1→D10)** : artefact « Dossier client — le process à valider »
- **Maquettes** : `prototypes/prospera-prototype.html` → page **Dossiers clients** (portefeuille,
  dossier ouvert, assistant de création) — intégrée le 2026-08-09
- **Le seul « dossier » planifié à ce jour** : `STORY-301` (`fiscal-service`, EPIC-028, sprint 23) —
  à réancrer, cf. bloc **H**
- **Stories déjà livrées à réutiliser** : `STORY-079` (identité), `STORY-080` (2 axes),
  `STORY-081` (OCR CFE + statuts)
