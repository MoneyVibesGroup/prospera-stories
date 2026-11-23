# STORY-1099 : La mémoire des choix dans les cahiers — la pièce suivante du même fournisseur reprend la catégorie déjà choisie

Status: in-progress — **créée le 2026-11-18** à la demande de l'utilisateur. **Prise le 2026-11-23** par la session
du groupe C (après STORY-1097 et 1098, livrées), contrat annoncé ci-dessous avant le code.

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
