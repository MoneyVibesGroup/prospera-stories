# STORY-934 : Le manifeste dans `ModuleVersion`

Status: done

**Complexité :** moyenne (un contrat, des règles pures, un branchement dans la publication)

**Épic :** EPIC-143 (le catalogue connaît chaque module par son manifeste)
**Dépôt :** `MoneyVibesGroup/prospera-platform-catalog-service`
**Plage :** groupe B, n° 5 du lot de B (`coordination/PLAN-4-SESSIONS-2026-11-14.md` §4).

---

## Pourquoi

Le moteur ne connaît un module que par son manifeste (FR-38). La source du manifeste est `module.manifest.ts`, dans le
dépôt du service. Le catalogue en garde une **copie par `ModuleVersion`**, comparée à la source par une garde (C1, Q1).
Il refuse à la publication ce qui casserait l'installation (AD-23).

## Ce qui doit être vrai à la fin (plan §4, n° 5)

| Exigence | Fait |
|---|---|
| Champs du manifeste, dont `depends`, `objetsDeReprise`, `domainesEchange` | oui : `contrat/manifeste-module.schema.json` (C1 amendée les 10, 11 et 12/11), `ModuleVersion.manifeste` |
| Refus nommés `MODULE_DEPENDANCE_MANQUANTE`, `MODULE_REQUIS_PAR`, `MANIFESTE_CYCLE`, `MANIFESTE_DEPENDANCE_MINEURE` | oui : les deux derniers à la publication, les deux premiers dans la résolution (D-934-3) |
| Garde source/copie | oui : la comparaison, avec motif obligatoire et motif périmé refusé ; les copies arrivent en STORY-935 |

## Ce qui a été livré

1. **Le contrat du manifeste** : `contrat/manifeste-module.schema.json` (draft-07, fermé), et sa copie embarquée dans le
   build. Un test garde l'égalité des deux. Les règles d'écriture :
   - un droit tient en **40 caractères au plus**, à tiret dans ses trois segments (borne du jeton, relecture de A) ;
   - un topic existant garde sa graphie sans `@` (AD-27).

   Sur les 45 manifestes de `prospera-stories/manifestes/`, 43 passent. Les 2 refusés portent les 5 droits trop longs
   que STORY-935 renomme.
2. **`ModuleVersion.manifeste`** et `POST /api/v1/catalog/admin/modules/:code/versions` avec `manifeste`. Une version d'avant le
   moteur n'en a pas, et elle n'est ni installable ni vendable (FR-37).
3. **Les refus à la publication** (422, avec un détail nommé), dans cet ordre :
   1. `MANIFESTE_INVALIDE` : la forme, un autre code ou une autre version que la `ModuleVersion`, un droit étranger au
      module ;
   2. `MANIFESTE_OBJET_HORS_MODULE` ;
   3. `MANIFESTE_ARGENT_SANS_CONTROLE` (sauf la sorte `LECTURE`) ;
   4. `AVEC_PERTE_INTERDIT_PLATEFORME` ;
   5. `MANIFESTE_DEPENDANCE_MINEURE` ;
   6. `MANIFESTE_CYCLE`, avec le chemin du cycle.

   Ces refus sont lus sur le snapshot de la transaction. Le manifeste « en vigueur » d'un autre module est celui de sa
   plus haute version `ACTIVE`.
4. **La résolution, en fonctions pures** :
   - `resoudreOffre` donne les dépendances ajoutées avec leur raison (FR-2) et nomme les modules inconnus ;
   - `verifierInstallation` refuse avec `MODULE_DEPENDANCE_MANQUANTE` et la liste des manquants ;
   - `verifierDesinstallation` refuse avec `MODULE_REQUIS_PAR` (FR-3, FR-39).

   **`contrat/resolution-dependances.json`** porte leurs cas (7). Ils sont rejoués ici, puis par `paiement-service` en
   STORY-939 (test de contrat joué des deux côtés, fin d'EPIC-143).
5. **La garde source/copie** (`garde-source-copie.ts`) compare la source et la copie chemin par chemin :
   - une divergence sans motif fait échouer ;
   - un motif qui ne couvre plus rien fait échouer aussi (leçon de STORY-497).
6. **La configuration de l'instance servie** : `INSTANCE_ID`, `INSTANCE_ESPACE`, `INSTANCE_HEBERGEMENT`,
   `VERSION_PLATEFORME`. Elle sert aussi à STORY-936.

## Preuves

- `docker build --target verification` (Node 24) : **1127/1127**. Le premier passage avait rougi sur la garde des
  chemins Mixed (STORY-724) : `ModuleVersionSchema.manifeste` est un objet libre **voulu**, il y est désormais déclaré
  avec sa raison.
- La règle de version compare en semver : la `ModuleVersion` `1.0` du semis porte le manifeste `1.0.0`.
- **Mutation** : un refus calculé mais jamais levé fait rougir le test du cycle.

## Décisions

- **D-934-1 — Deux codes nommés pour les règles de Connecteurs** (la spine ne les nomme pas) :
  `MANIFESTE_ARGENT_SANS_CONTROLE` et `MANIFESTE_OBJET_HORS_MODULE`.
- **D-934-2 — Le préfixe est imposé aux objets, pas aux codes de domaine.** `liaison-assureur` est, voulu, le point
  d'échange unique de `assurance.contrats`, `sinistres.dossiers` et `ged.documents-sinistres` (son manifeste,
  contrat §6). Ses objets sont bien les siens. Que chaque objet existe dans `contrats/objets/<code>/` se vérifie avec
  `prospera-plateforme`, pas au catalogue (le dossier est encore vide).
- **D-934-3 — `MODULE_DEPENDANCE_MANQUANTE` et `MODULE_REQUIS_PAR` ne sont pas branchés sur le `PUT` et le `DELETE`
  des droits.** Ces deux chemins sont retirés par EPIC-144, qui installe par le point de décision. Les y brancher
  maintenant changerait le comportement de recettes qui doivent rester vertes jusqu'à la bascule. Les deux refus vivent
  dans la résolution pure, que l'installation (EPIC-144) et la vente (STORY-939) appellent.
- **D-934-4 — Une dépendance vers un module sans manifeste est une feuille** : ni cycle ni refus à la publication. La
  résolution la nomme « inconnue », non vendable, sans faire échouer le reste (FR-37).
- **D-934-5 — Une mineure peut retirer une dépendance**, jamais en ajouter (FR-38).

## Suite

- STORY-935 : les copies des 45 manifestes (et du module `instance`) au catalogue, les 5 droits renommés, la garde
  branchée sur la source, et la publication de `catalogue.manifeste.publie`.
