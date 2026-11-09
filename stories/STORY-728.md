# STORY-728 : Un cabinet prend l'IMF ou l'assurance EN OPTION — et deux défauts de la plateforme relevés par 650

Status: done

**Services :** `platform-catalog-service`, `paiement-service` · **Recette :** `prospera-recette`
**Branches :** `MNV-728` dans les trois dépôts. Base `origin/dev` pour le catalogue et le paiement.
Pour la recette, la branche est empilée sur `MNV-280-recette-cabinet` (PR #8, même fichier) et sera
rebasée sur `dev` après fusion de #8.
**Origine :**
- l'arbitrage 1 de STORY-727 (2026-11-08) : le cabinet prend le module en option ; la story était à
  ouvrir ;
- deux défauts relevés par STORY-650, que le PO a rangés dans celle-ci le 2026-11-08 : le 403 au lieu
  du 404 sur les surfaces plateforme, et le module `notification` de Money Vibes.

**Arbitrages PO du 2026-11-09 :**
1. **Le référentiel va à l'option SEULE.** `bilan` et `balance` du cabinet restent SYSCOHADA.
   `bilan-service` résout le référentiel **par organisation** (`resolveReferentielForOrg`). Dès qu'il
   y en a deux, il lève `ReferentielAmbiguError` (409) hors exercice épinglé, et la liasse SYSCOHADA
   du cabinet ne sortirait plus.
2. **Déclarer le module `assurance` et l'ajouter au package `assurance-cima`.** Le module filtré par
   `assurance-service` (`ASSURANCE_MODULE_CODE`) n'était déclaré nulle part : ni un assureur ni un
   cabinet ne pouvait l'ouvrir.

---

## Critères d'acceptation

- [x] AC-1 — Une option normative (un module qu'aucun package du contrat ne contient) s'ouvre avec
      les référentiels des packages du catalogue qui la **contiennent**, filtrés à ses familles :
      `microfinance` reçoit `sfd-bceao@2.0` (`imf-sfd`), `assurance` reçoit `cima-assurances@7.0`
      (`assurance-cima`). Avant, l'option tombait en `REFERENTIEL_REQUIS`.
- [x] AC-2 — ⛔ L'apport ne profite qu'à l'option : le `bilan` du cabinet garde `[syscohada-revise@2.3]`.
      Un module que le contrat apporte déjà par un package n'emprunte rien aux autres packages.
- [x] AC-3 — L'option suit le package qui la contient : une nouvelle version de `sfd-bceao` dans
      `imf-sfd` passe sur l'option `microfinance` d'un cabinet. Un octroi d'opérateur (`admin`)
      n'est pas une option, la propagation n'y touche pas. Un cabinet n'est pas titulaire
      d'`imf-sfd` : un module ajouté à ce package ne s'ouvre pas chez lui.
- [x] AC-4 — Le module `assurance` est semé (famille `cima-assurances` seule) et entre en queue
      d'`assurance-cima`.
- [x] AC-5 — Le registre, l'exploitation et les abonnements du paiement rendent le **404 commun**
      à un client, même sans le droit (avant : `403 PERMISSION_DENIED`). Le décorateur
      `@SurfacePlateforme()`, posé sur la classe, est lu par la porte globale juste après
      l'authentification. Un invariant exige ce décorateur, ou `@ActeDelegue`, sur tout contrôleur
      qui injecte `PorteDeLaPlateforme`.
- [x] AC-6 — L'amorçage déclare le module `notification` et l'octroie à Money Vibes (étapes 5 et 6) ;
      le retrait révoque les deux droits. La recette de délégation ne l'octroie plus : elle le
      constate.
- [x] AC-7 — Recette sur la vraie pile, **depuis `dev` après fusion** (consigne PO). Elle couvre le
      cabinet aux deux options, les 404 vus par un cabinet et le droit `notification` de Money Vibes
      posé par l'amorçage. ✅ Jouée le 2026-11-09 (pile `recette728` du 2026-11-09 — images construites depuis `origin/dev` après fusion, volumes neufs) :
      `abonnement` (deux étapes 728), `delegation`, `distributeur` et `facturation` sont verts, soit
      41 tests. `pile.recette` a rougi une fois, sur un `429` de la route directe de
      notification : le quota était épuisé par les quatre recettes qui avaient envoyé avant elle.
      Rejouée seule sur la même pile : 7/7.

## Exploitation — une base déjà semée

⚠️ Les seeds n'écrivent qu'à **l'insertion** (`$setOnInsert`). Sur une base existante :
- le module `assurance` est bien créé au redémarrage (module absent, donc inséré) ;
- le package `assurance-cima` **garde ses anciens modules**. Il faut faire
  `PATCH /catalog/admin/packs/assurance-cima` avec
  `modules: ["balance", "bilan", "finance-transactions", "assurance"]` depuis la console. La
  propagation ouvre alors `assurance` chez les assureurs (comptabilité incluse, sans terme).

## Preuves

- **Catalogue** `MNV-728` (`dbb0303`) :
  - 1 026 unitaires, 202 e2e, `tsc` et lint propres ;
  - mutations : sans l'apport, 2 tests rouges ; apport étendu à tous les modules, 1 rouge (le bilan
    gagnerait SFD).
- **Paiement** `MNV-728` (`043bd0e`) :
  - 4 447 unitaires (garde de câblage comprise), 352 e2e, lint propre ;
  - contre-épreuve : sans `@SurfacePlateforme()` sur le registre, l'invariant (2 tests) et l'e2e
    (le 403) rougissent.
- **Recette** `MNV-728` (`1f84b54`) : les étapes, jouées depuis `dev` le 2026-11-09 (AC-7).

## Ce qui reste hors de cette story

- **Produire la liasse SFD ou CIMA d'un client IMF depuis un cabinet** : il faudrait que
  `bilan-service` résolve le référentiel **par dossier**. Story `bilan-service` à ouvrir.
- `tsc` du paiement : sur ce poste, le checkout partagé a `packages/rapprochement` supprimé dans son
  arbre de travail (modification locale non commitée, non touchée). Un worktree qui emprunte son
  `node_modules` voit donc 27 erreurs de type qui ne sont pas les siennes. Il faut lier
  `@prospera/rapprochement` au paquet du worktree et le compiler (`npm run build --workspaces`).

## Notes

Voir [[STORY-727]], [[STORY-650]], [[STORY-280]], [[STORY-613]].
