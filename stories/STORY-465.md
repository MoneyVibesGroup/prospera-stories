# STORY-465 : Aucun rebasage : quand la liasse est re-validée, les jeux d'hypothèses continuent de projeter sur l'ancien snapshot, en silence

Status: in_progress

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé en confrontant `JeuHypothesesService.creer` (capture `snapshots.dernier`) au cycle de réouverture de la liasse (FE-034).

---

## Le fait

`base` est capturé **à la création** — `{ jeuEtatsId, snapshotId, version, exercice }` — et
`editer()` ne le touche pas (c'est voulu : « la base reste figée »). Mais **aucune route ne permet de
rebaser**, et le contrôleur n'expose que POST / GET / PUT.

Or la liasse **peut** être rouverte puis re-validée : STORY-065 produit alors un snapshot **version 2**.
Tous les jeux d'hypothèses créés avant continuent de projeter sur la **version 1** — c'est-à-dire sur
des chiffres que le cabinet a lui-même corrigés — et **rien, nulle part, ne le signale**. Sur le dossier
de démonstration, l'écart entre les deux versions est de **80 000** sur le résultat et **80 000** sur le
total actif.

⚠️ **Et « dupliquer » aggrave le problème plutôt que de le résoudre** : faute de route dédiée
(**STORY-466**), dupliquer ne peut être qu'un `POST` de plus — qui **recapture le dernier snapshot**. La
copie n'a donc pas la même base que l'original, silencieusement. C'est exactement le cas
d'hétérogénéité que le cadrage du 2026-07-23 (décision **D2**) prévoit d'autoriser avec un
`baseHomogene: false` — et il note déjà que *« si 071 durcit ce cas, elle **doit** livrer conjointement
un endpoint de rebasage, sinon elle livre un blocage sans issue »*.

## Critères d'acceptation

- [x] AC-1 — `POST /dossiers/:dossierId/bilan/hypotheses/:id/rebaser` recapture le **dernier** snapshot
      **du même `jeuEtatsId`** — jamais d'un autre exercice.
- [x] AC-2 — Le rebasage **crée une version** (`version + 1`) comme une édition : le triplet de
      reproductibilité doit rester exact pour les projections antérieures.
- [x] AC-3 — `GET` (liste et détail) publie `baseAJour: boolean` — vrai si `base.version` est la
      dernière version de snapshot du jeu d'états. C'est ce qui permet à l'écran de prévenir **avant**
      qu'on lise une projection périmée.
- [x] AC-4 — Rebaser sur une base **identique** est un no-op explicite (200, aucune version créée).
- [x] AC-5 — Rôle : réservé au `TENANT_ADMIN` (voir **STORY-470**).

## Conséquences ailleurs

- Débloque le durcissement éventuel de **STORY-071** (comparaison de scénarios) : sans rebasage, refuser
  une comparaison hétérogène serait un cul-de-sac.

---

## Progress Tracking

### Livrable

| AC | État | Où |
|---|---|---|
| AC-1 | ✅ | `POST …/hypotheses/:id/rebaser` — recapture le **dernier** snapshot du **même** `jeuEtatsId`, lu **sur le jeu** et jamais sur une entrée. |
| AC-2 | ✅ | Le rebasage **crée une version** : la version sortante garde l'**ancienne** `base`. |
| AC-3 | ✅ | `baseAJour: boolean` publié sur **la liste comme sur le détail**, et sur toute réponse rendant un jeu. |
| AC-4 | ✅ | Rebaser sur la base déjà portée est un **no-op explicite** : 200, aucune version créée. |
| AC-5 | ✅ | `@Roles(TENANT_ADMIN)` + `@CodeRefusRole('REBASAGE_RESERVE_ADMIN')`. |

### Décisions

- **`baseAJour` ne vit PAS sur le document.** Il se calcule contre la dernière version de snapshot de
  la liasse d'ancrage, qui change **sans que le jeu bouge** — une liasse rouverte puis re-validée
  produit une version 2 pendant que le jeu reste intact. Le persister serait figer une vérité qui se
  périme toute seule.
- ⛔ **Une seule requête d'agrégation pour toute la liste**, jamais une par jeu : le patron N+1 ne se
  voit pas sur un dossier de démonstration à trois jeux, et grossit à chaque validation de liasse. Son
  `$match` porte `tenantId` **et** `dossierId` explicitement — une agrégation n'emprunte pas le
  `scope()` de la classe de base, et sans eux la fraîcheur serait calculée contre les snapshots d'un
  **autre dossier** du même cabinet.
- ⛔ **Comparé sur la VERSION, pas sur le `snapshotId`** : les deux disent la même chose aujourd'hui,
  mais la version le dit aussi quand la carte est **incomplète**. Un jeu d'états sans aucun snapshot
  est **absent** de l'agrégation, et son jeu d'hypothèses est alors déclaré **à jour** — il n'existe
  aucune version plus récente que la sienne, et le déclarer périmé afficherait un avertissement
  qu'aucun rebasage ne pourrait lever.
- ⛔ **Calculé même à la CRÉATION**, jamais supposé : un `true` codé en dur y serait vrai à l'instant
  de la capture et faux si une validation concurrente a figé une version entre-temps. Le champ existe
  pour être cru.
- **Versionnement factorisé** entre l'édition et le rebasage : c'est ce qui garantit qu'un rebasage
  historise **exactement** comme une édition. Deux transactions écrites séparément auraient divergé au
  premier correctif appliqué à l'une seulement — et la version historisée est ce qui rend le **triplet
  de reproductibilité** encore exact pour les projections antérieures.
- **200 et non le 201 par défaut de `@Post`** : rebaser ne crée aucune ressource, et sur une base déjà
  à jour il n'écrit même rien.

### Mutations

| Mutation | Constaté |
|---|---|
| le no-op disparaît (AC-4) | **1 test rouge** |
| la version historisée porte la **nouvelle** base (AC-2) | **1 test rouge** |
| la comparaison de fraîcheur **inversée** (AC-3) | **2 tests rouges** |
| rebasage ouvert au `TENANT_USER` (AC-5) | **1 e2e rouge** |

### Couverture : deux trous dans le code NEUF, comblés

Le rapport **par fichier** a montré `hypotheses.controller.ts` à **0 %** — son spec ne compilait plus,
le service rendant désormais un couple *(jeu, fraîcheur)* — et `snapshot-liasse.repository.ts` à 81 %,
l'agrégation n'étant gardée par rien. Les deux sont comblés ; l'agrégation est à **100 %**, avec ses
deux gardes fail-closed et le cas « jeu d'états sans snapshot ».

### ⚠️ Le piège des modules de test

Ajouter une lecture au chemin de réponse oblige à mettre à jour **tous** les modules de test qui
montent ce contrôleur. `bilan-projection.e2e-spec.ts` monte `JeuHypothesesController` pour éprouver le
**piège d'ordre de routes** : sans le fournisseur de fraîcheur, cette lecture rendait 500 et l'essai de
non-collision cessait de mesurer ce qu'il nomme. Même leçon qu'en STORY-464.

### Vérification docker (stack réelle) — ⚡⚡ 12 jeux sur 21 projetaient sur une base périmée

Le dossier réel porte un jeu d'états dont la liasse a été **rouverte et re-validée deux fois** :
`snapshots_liasse` en contient les versions **1, 2 et 3**. C'est exactement le scénario de la story,
présent en base **sans que rien ne le signalait**.

| Mesure | Résultat |
|---|---|
| ⚡⚡ AC-3 sur la liste réelle | **21 jeux, dont 12 avec `baseAJour: false`** — dix sur la version 1, deux sur la version 2, tous projetant sur des chiffres corrigés depuis. |
| AC-5 | `POST …/rebaser` en `TENANT_USER` → **403 `REBASAGE_RESERVE_ADMIN`**. |
| AC-1/AC-2 | Rebasage de `v461-delais-constates` : version d'édition **1 → 2**, `base.version` **2 → 3**, `baseAJour` repasse à **true**. |
| ⚡⚡ AC-2 | `GET …/versions/1` rend `base.version = 2` — la version **sortante** garde bien l'**ancienne** base, donc le triplet de reproductibilité d'une projection déjà exportée reste exact. |
| ⛔ AC-4 | Rebaser à nouveau → **200**, version d'édition **inchangée à 2**, et `versions_hypotheses` ne contient **toujours qu'une seule** ligne. Aucune écriture. |

⚠️ **L'infrastructure est tombée pendant cette phase** : Mongo, Kafka et Redis ont disparu de la liste
des conteneurs sous une charge machine de 16, et `auth-service` a perdu son accès à Mongo — son JWKS
devenait injoignable, donc **tout jeton valide était refusé en 401**. Le diagnostic « jeton expiré » était
faux : c'est le service qui ne pouvait plus vérifier de signature. Relancer l'infrastructure **puis** les
deux services a suffi. À retenir : un 401 généralisé après un incident d'infrastructure se diagnostique
côté **émetteur de clés**, pas côté jeton.

### Portes

Lint 0 warning · build OK · **2 070** unitaires verts, seuils tenus (98,91 / 94,61 / 98,89 / 98,93) ·
**589** e2e verts (séquentiel, 22 suites sur 22).

⚠️ **Mesure de référence prise en `--runInBand`.** Trois passes en parallèle ont rendu des échecs **par
dépassement de délai à 5 s**, jusqu'à une suite entière, sur des suites que ce diff ne touche pas. La
charge machine était à **16**, la machine virtuelle Docker à 293 % de CPU, et Mongo/Kafka/Redis ont fini
par disparaître de la liste des conteneurs. Chaque suite passe isolément.
