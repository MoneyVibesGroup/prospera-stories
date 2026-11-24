# STORY-1099 : La mémoire des choix dans les cahiers — la pièce suivante du même fournisseur reprend la catégorie déjà choisie

Status: done — **créée le 2026-11-18** à la demande de l'utilisateur. **Prise le 2026-11-23** par la session du
groupe C, contrat annoncé avant le code (#758). **Livrée le 2026-11-24** : balance-service **#160** (`0ff2402` sur
`dev`). Voir « Livraison » ci-dessous.

**Service :** `prospera-balance-service` (cahiers, tenu par B au lot 4) · **Points :** 5
**Pendant pour les écritures :** STORY-1098 · **Écran :** FE-150

---

## Contrat annoncé avant le code (2026-11-23)

**Ajouts seuls** dans `prospera-balance-service` : aucun champ ni aucune route renommés ; aucun événement ; manifeste
`balance` **inchangé** (les lectures des cahiers n'y sont pas déclarées, celles-ci non plus).

### Ce qui est mémorisé, et quand

- **Clé** d'une ligne : `NIF` (le NIF lu sur la pièce) ; sinon `NOM` (le fournisseur ou le tiers lu, normalisé : sans
  accents, casse, ponctuation ni espace) ; sinon `LIBELLE` (le libellé retenu, normalisé). Par **cahier** (`RECETTES`
  ou `DEPENSES`).
- **Choix** : en dépenses, la **catégorie** (`categorieId` et son libellé) et le `compteCharge` **seulement s'il
  s'écarte** de celui de la catégorie, avec le `motifSurcharge` saisi s'il y en a un ; en recettes (le cahier de
  recettes n'a pas de catégorie), le `compteProduit`.
- **Provenance** : `{ lotId, pieceId, ligneId, pieceRef?, choisiLe, choisiPar }`.
- **Apprendre** : à l'application d'un lot (`POST …/pieces/ocr/{lotId}/appliquer`), chaque ligne **créée** au cahier
  apprend, au **dossier** et au **cabinet** (la ligne de cahier est écrite par le geste du comptable : il n'y a pas
  d'étape de brouillard). Une ligne rejetée n'apprend rien. Un nouveau choix pour la même clé remplace l'ancien.

### Ce qui est suggéré

- **Lecture d'un lot** (`GET …/pieces/ocr/{lotId}`) : chaque ligne pré-proposée reçoit un champ **facultatif**
  `suggestion: { categorieId?, categorieLibelle?, compteCharge?, compteProduit?, source: { origine, memoireId,
  pieceRef?, choisiLe, choisiPar } }`, `origine` ∈ `MEMOIRE_DOSSIER` | `MEMOIRE_CABINET`. Mémoire du dossier d'abord,
  puis celle du cabinet ; sans mémoire, pas de `suggestion` (on ne devine pas). Rien n'est appliqué sans geste
  (NFR-A05 inchangé).
- **Catégories par dossier** (STORY-236) : la mémoire du cabinet ne garde que le **libellé** de la catégorie ; elle
  suggère, dans un autre dossier, la catégorie **active** de même libellé (normalisé), sinon rien. Une catégorie
  désactivée ou supprimée n'est jamais reproposée.
- **Saisie à la main** : `GET /api/v1/dossiers/{dossierId}/cahiers/memoire-des-choix/suggestion?cahier=DEPENSES|RECETTES
  &nif=&fournisseur=&libelle=` → `{ suggestion: … | null }`, mêmes règles.

### Consulter et oublier

| Geste | Route (sous `/api/v1`) | Rôle |
|---|---|---|
| La mémoire d'un dossier | `GET /dossiers/{dossierId}/cahiers/memoire-des-choix` | membre du cabinet (portée du dossier) |
| Oublier au dossier | `DELETE /dossiers/{dossierId}/cahiers/memoire-des-choix/{memoireId}` → 204 | membre du cabinet (portée du dossier) |
| La mémoire du cabinet | `GET /cahiers/memoire-des-choix` | membre du cabinet |
| Oublier au cabinet | `DELETE /cahiers/memoire-des-choix/{memoireId}` → 204 | `TENANT_ADMIN` |
| Le journal des oublis | `GET /cahiers/memoire-des-choix/actes` | membre du cabinet |

Refus : 404 `MEMOIRE_INTROUVABLE` (autre dossier, autre cabinet compris). Chaque oubli écrit un acte
`MEMOIRE_OUBLIEE` en ajout seul (AC-4). Collections neuves : `memoires_des_choix_cahiers`,
`actes_memoire_cahiers`, cloisonnées par `orgId` (et `dossierId` au dossier), à l'effacement C13 du service.

### Décisions prises au contrat (contestables)

- **D-1099-1** : le cahier apprend au dossier ET au cabinet à l'application (pas d'étape de validation dans un cahier).
- **D-1099-2** : la mémoire du cabinet relie une catégorie par son libellé, faute d'identifiant commun entre dossiers.
- **D-1099-3** : en recettes, la mémoire porte le compte de produit (pas de catégorie de recettes).
- **D-1099-4** : la saisie à la main reçoit sa suggestion par une route de lecture ; elle n'apprend pas (seule
  l'application d'un lot apprend, comme le dit la fiche).

### Livraison (2026-11-24)

- **Code** : balance-service #160, fusionnée sur `dev` (`0ff2402`) : module `src/modules/cahiers/memoire/` (schéma,
  règles pures, service, deux contrôleurs), apprentissage et suggestions dans `PiecesOcrService`, champ `suggestion`
  au DTO et au présentateur, deux collections au plan d'effacement C13. Manifeste `balance` inchangé.
- **Preuves** : unitaires sous Node 24 (étage `verification`) **5555 passés, 12 ignorés** (284 suites) ; intégration
  sur un **vrai MongoDB** **10/10** (`memoire-cahiers.mongo.spec.ts`, jouée avec `MONGODB_URI_TEST` : AC-1, AC-2 par
  libellé de catégorie, AC-4, AC-5, AC-6, catégorie désactivée jamais reproposée, remplacement) ; e2e OCR et contrat
  OpenAPI **253/253** ; mutation **5/5** (dont l'alignement des lignes créées sur les pièces retenues, qu'un premier
  test ne voyait pas) ; gate de câblage `grp-c` : `balance-service` `healthy`, deux contrôleurs montés, six routes
  neuves en 401, `suggestion` publié à l'OpenAPI. Verrou Docker pris à la session A (FE-140), rendu.

### Écarts au contrat, décidés au code

- **D-1099-5** : les routes de la mémoire **du cabinet** (`GET /cahiers/memoire-des-choix`, `…/actes`, `DELETE …`)
  sont sous **`@PorteeDuCabinet()`** (STORY-694) : réservées au `TENANT_ADMIN`, un collaborateur reçoit 404. La
  mémoire du cabinet est apprise dans tous ses dossiers, et sa provenance (lot, pièce, ligne) en dirait trop à un
  collaborateur hors de leur portefeuille. Le contrat les ouvrait à tout membre. Les **suggestions**, elles, restent
  servies à tout membre du dossier (elles ne montrent que la catégorie du dossier et la date du choix).
- **D-1099-6** : deux catégories actives de même libellé normalisé dans le dossier rendent la suggestion du cabinet
  ambiguë : rien n'est suggéré.
- **D-1099-7** : une mémoire qui échoue (base injoignable) n'annule pas l'application du lot : les lignes sont écrites,
  l'échec se dit au journal du service.

---

## Pourquoi

Aujourd'hui, une pièce lue par l'OCR des cahiers (STORY-084, `cahiers/pieces-ocr/pieces-ocr.regles.ts`) devient une
**ligne pré-proposée** avec sa date, son montant, sa TVA et son sens. La **catégorie**, et donc le compte, est choisie
par le comptable **à chaque fois** : rien ne retient ce qu'il a choisi pour ce fournisseur ou ce libellé. Le petit
commerçant (SMT) a les mêmes fournisseurs chaque mois, et le même besoin que l'entreprise au système normal
(STORY-1098).

## Ce qui est attendu

Les mêmes règles que STORY-1098, appliquées aux cahiers de recettes et de dépenses :

1. À l'application d'un lot (`POST …/pieces/ocr/{lotId}/appliquer`), chaque ligne **retenue** mémorise, pour sa clé
   (NIF lu, sinon fournisseur normalisé, sinon libellé normalisé) et son cahier (recettes ou dépenses) :
   - la **catégorie** choisie ;
   - le **compte** si le comptable s'est écarté de celui de la catégorie, **avec le motif déjà exigé** ;
   - la provenance : date, auteur, pièce.
2. À la lecture d'un lot (`GET …/pieces/ocr/{lotId}`), chaque ligne pré-proposée porte une **suggestion de
   catégorie**. On lit d'abord la mémoire du dossier, puis celle du cabinet, avec la **source** de la suggestion. Sans
   mémoire, aucune catégorie n'est suggérée : on ne devine pas.
3. La saisie à la main d'une ligne de cahier propose la même chose dès que le libellé correspond à une clé connue.
4. On peut **consulter** et **oublier** une mémoire. Une catégorie supprimée ou désactivée n'est jamais reproposée.
5. Le contrat existant ne change pas pour un client qui ignore les nouveaux champs : la suggestion est **ajoutée**,
   jamais imposée.

## ⛔ Cloisonnement par cabinet — exigence de l'utilisateur (2026-11-18), non négociable

> « Ça doit être lié par cabinet. Un cabinet A a sa façon d'écrire et sa propre compta : s'il insère quelque chose et
> que demain la même facture vient, on le lui suggère et on le remplit par défaut ; il peut modifier s'il veut, et
> c'est pris. Mais cela ne va pas apparaître pour un cabinet B, **même s'il a le même client**. C'est important. »

- Toute mémoire, toute suggestion et tout compte propre appartiennent à **l'organisation du cabinet** (`orgId` du
  jeton). Ils ne sont **jamais** indexés par le seul NIF du client ou du fournisseur : la clé contient toujours le
  cabinet.
- **Le même client suivi par deux cabinets** (même NIF, un dossier chez A, un dossier chez B) : B ne reçoit **rien** de
  A. Aucune suggestion, aucun compte, aucun tiers, aucune statistique, même anonymisée ou agrégée. Il n'existe **aucune
  mémoire « plateforme »** partagée entre cabinets.
- La valeur suggérée est **pré-remplie par défaut** ; le comptable la garde ou la change. **Ce qu'il valide devient la
  nouvelle mémoire** de son cabinet.
- **Test obligatoire** : deux cabinets A et B, un même client (même NIF) chez les deux. A comptabilise une facture de
  ce client. B dépose la même facture et ne reçoit aucune suggestion venant de A, alors que A la reçoit à la facture
  suivante.

## Critères d'acceptation

- **AC-1** : la deuxième pièce du même fournisseur, dans le même dossier, suggère la catégorie choisie pour la
  première, avec sa source.
- **AC-2** : la mémoire du dossier prime sur celle du cabinet ; sans mémoire, aucune catégorie n'est suggérée.
- **AC-3** : une suggestion n'est **jamais** appliquée sans geste du comptable ; le dépôt reste sans écriture
  (NFR-A05).
- **AC-4** : oublier une mémoire est journalisé, et elle n'est plus suggérée.
- **AC-5** : étanchéité entre cabinets et entre dossiers (patron du gate FE-069).
- **AC-6** : le même client (même NIF) suivi par les cabinets A et B : B ne reçoit aucune suggestion venant de A.
