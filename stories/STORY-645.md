# STORY-645 : L'amorçage atteint le catalogue, et la pile déclare qu'elle est prête

Status: done

**Bloc :** Convergence E0 — le substrat de recette (`CONVERGENCE-RAILS-C-D-2026-09-08.md`)
**Service :** `prospera-paiement-service` (amorçage de STORY-613, `/health`) · **Points :** 5
**Prérequis :** STORY-643 (garde de câblage — présente)
**Branche :** `MNV-645`, depuis `origin/dev` après la fusion de STORY-644

---

## Le récit

En tant qu'**équipe**, je veux que la commande d'amorçage marche contre la vraie pile, afin que les
recettes croisées partent d'un état connu au lieu d'un état supposé.

## Le fait

Le repli de `AMORCAGE_URL_CATALOGUE` visait `http://platform-catalog-service:3004`. Le compose
racine publie `3003:3003` pour le catalogue, et **3004 est `bilan-service`**. L'étape 2 (déclarer le
module) échouait donc contre la vraie pile, l'étape 4 (droit d'usage) aussi, et Money Vibes ne
franchissait pas son propre contrôle d'accès. L'amorçage n'avait jamais tourné que contre des
doubles, qui répondent sur le port qu'on leur donne.

## Critères d'acceptation — verdicts

- **AC-1 ✅** — le repli vise `:3003`. Les trois cibles ont été **vérifiées contre le compose**
  (`docker compose config` : auth 3001, kyc 3002, catalogue 3003), pas contre une note.
- **AC-2 ✅** — `reglages-compose.invariant.spec.ts` lit le `docker-compose.yml` racine et compare le
  port de chaque repli au **port du conteneur** (celui qui compte dans le réseau du compose). Elle
  repose sur un extracteur sans dépendance (`ports-du-compose.ts`) : le dépôt ne déclare aucune
  bibliothèque YAML. **Contre-épreuve dans la story** : l'ancien repli `:3004` rend
  « `AMORCAGE_URL_CATALOGUE vise platform-catalog-service:3004, or le compose fait écouter ce
  service sur 3003` ».
  ⚠️ Le compose n'est dans aucun dépôt : la garde le cherche dans le dossier parent du dépôt (ou
  dans `COMPOSE_RACINE`). Introuvable (clone isolé, worktree ailleurs), elle se déclare
  **IGNORÉE** sous un titre qui le dit, au lieu de passer en vert.
- **AC-3 ✅** — le transport lève `ServiceInjoignable` avec un motif (`CONNEXION_REFUSEE`,
  `NOM_INCONNU`, `DELAI_DEPASSE`, `AUTRE`) au lieu du « fetch failed » générique, et l'arrêt imprime
  une phrase qui nomme la cible, sa variable et son remède. Exemple : « `Injoignable : le catalogue
  — AMORCAGE_URL_CATALOGUE = http://platform-catalog-service:3003. connexion refusée : rien n'écoute
  sur ce port — …` ». Un **404** est dit à part : « Route absente : … répond, mais pas à … —
  vérifiez la version du service ou le préfixe de l'URL, **pas le port** ». Éprouvé contre un vrai
  port fermé et un vrai serveur qui répond 404. Appels bornés à 30 s.
- **AC-4 ✅** — la disponibilité est une **convention explicite**, écrite dans
  `docs/AMORCAGE-MONEY-VIBES.md` (et reprise en code par la recette de STORY-646) :
  `GET /api/v1/health` = 200 pour auth, kyc, catalogue et notification ;
  **`GET /api/v1/health/live` = 200 pour le paiement**, une route **nouvelle** qui n'interroge
  aucune dépendance ; groupes Kafka `Stable` pour les consommateurs. L'amorçage attend ses trois
  cibles avant son premier geste (étape « 0. Disponibilité de la pile », `AMORCAGE_ATTENTE_MS`,
  2 min par défaut) et s'arrête en **nommant** chaque retardataire. L'environnement reste vérifié
  **avant** l'attente : rien n'est sondé en production.
- **AC-5 ✅** — l'idempotence existait (AC-4 de STORY-613 : lecture avant écriture, « déjà en
  place »). Nouveau test : avec l'attente, un second passage rend les six constats « déjà en
  place » et **aucune écriture créatrice** (seule l'ouverture de session réécrit).

## Trois gardes ont rougi sur le premier jet, et elles avaient raison

| Garde | Ce qu'elle a vu | Remède |
|---|---|---|
| STORY-246, sandbox | la méthode `live()` : « live » est un nom d'environnement (mode d'un fournisseur) | méthode renommée `vivacite()`, la route reste `/health/live` |
| STORY-278, catalogue | le littéral `platform-catalog-service` dans le diagnostic | cibles nommées par leur rôle ; l'URL affichée porte déjà le service |
| STORY-240, AD-12 | un `setTimeout` dans l'attente de l'amorçage | inscrit **explicitement** (`ATTENTES_D_OUTIL`) : minuterie d'outil hors du processus du service, aucun fait daté — le critère de la garde, appliqué |

⚠️ **Constat hors périmètre, non corrigé** : la garde de STORY-278 ne voit pas `reglages.ts`, qui
nomme pourtant le catalogue en clair. Son dépouillement des commentaires (`//[^\n]*`) prend le `//`
d'une URL (`http://…`) pour un début de commentaire et efface la fin de la ligne. Toute URL écrite
dans le code échappe donc à cette garde. L'amorçage est un appelant légitime du catalogue, mais le
trou vaut pour tout le dépôt : à traiter dans une story de garde.

## Preuves

| Contrôle | Résultat |
|---|---|
| `npx jest --runInBand --coverage` (avec `COMPOSE_RACINE`) | 313 suites / **4 233 tests**, seuils tenus |
| `npm run test:e2e -- --runInBand` | 27 suites / **335 tests** |
| lint | 0 |
| specs de l'amorçage + santé + trois gardes | 133 tests |

Gate Docker : la recette de STORY-646 lance cet amorçage dans le réseau du compose — voir sa fiche.
