# STORY-935 : Enregistrer les manifestes du cabinet et des démos

Status: done

**Complexité :** moyenne (des copies, un semis transactionnel, un événement nouveau)

**Épic :** EPIC-143 (le catalogue connaît chaque module par son manifeste)
**Dépôts :** `MoneyVibesGroup/prospera-platform-catalog-service`, `MoneyVibesGroup/prospera-stories` (sources des manifestes)
**Plage :** groupe B, n° 6 du lot de B (`coordination/PLAN-4-SESSIONS-2026-11-14.md` §4).

---

## Pourquoi

« Dev B enregistre au catalogue les manifestes des modules de la démo et du cabinet ; la garde compare dès que les deux
existent » (EPIC-143). Les 45 manifestes de `prospera-stories/manifestes/` sont les sources tant que chaque propriétaire
ne les a pas posés dans `src/module.manifest.ts` de son service. Le catalogue publie aussi le contrat
`catalogue.manifeste.publie` (AD-17), lu par le read-model de manifestes de `paiement-service` (STORY-939).

## Ce qui doit être vrai à la fin (plan §4, n° 6)

| Exigence | Fait |
|---|---|
| Les manifestes, depuis `prospera-stories/manifestes/` | oui : 45 copies, plus celle du module `instance` (46) |
| Publication de `catalogue.manifeste.publie` | oui : outbox, topic compacté, schéma au registre |
| Les cinq codes de plus de 40 caractères renommés (relecture de A) | oui, dans les sources et les copies |

## Ce qui a été livré

1. **Cinq droits renommés**, pour tenir dans la borne de 40 caractères du jeton :

   | Avant | Après |
   |---|---|
   | `approvisionnement:commande-fournisseur:valider` (46) | `approvisionnement:bon-commande:valider` (38) |
   | `approvisionnement:commande-fournisseur:suggerer` (47) | `approvisionnement:bon-commande:suggerer` (39) |
   | `approvisionnement:commande-fournisseur:consulter` (48) | `approvisionnement:bon-commande:consulter` (40) |
   | `finance-transactions:rapprochement:effectuer` (44) | `finance-transactions:releve:rapprocher` (38) |
   | `finance-transactions:tresorerie:consulter` (41) | `finance-transactions:tresorerie:lire` (36) |

   Ils sont renommés dans les deux manifestes, le PRD du distributeur, le PRD de la microfinance et les épics du
   distributeur. Les journaux de coordination gardent l'ancien nom, comme historique. Aucun code n'en dépendait.
2. **Le manifeste du module `instance`** (`src/module.manifest.ts` du catalogue) : `depends: []` et huit droits
   `instance:*`. Il déclare aussi ce que la partie A publie et consomme (AD-17). Le catalogue est la partie A : il en
   tient la source.
3. **Les copies** (`src/modules/catalog/manifeste/copies.json`) :
   - `npm run manifestes:copier` les tire des sources ; le nom de chaque module est lu dans l'en-tête de son manifeste ;
   - `npm run manifestes:garde` compare sources et copies. Une divergence sans motif fait échouer, un motif périmé
     aussi ; `divergences.json` est vide.
4. **`ManifestesSeedService`** (`onApplicationBootstrap`, après le semis des modules) :
   - module absent : il naît ;
   - version de même numéro semver absente : elle naît avec son manifeste ;
   - version `1.0` du semis sans manifeste : le manifeste lui est rattaché ;
   - version qui porte déjà ce manifeste : intacte ;
   - version qui porte un autre manifeste : elle est signalée divergente et rien n'est écrit, car une version publiée ne
     change pas.

   Les copies passent d'abord les refus de publication de STORY-934, sur le graphe entier. Il y a une transaction par
   copie, événement compris.
5. **`catalogue.manifeste.publie`** :
   - charge : l'état absolu d'une version (module, version, statut, manifeste) ;
   - clé : `<module>@<version>` ;
   - émis à la publication, au semis, et à chaque changement de statut d'une version qui porte un manifeste (une
     version retirée ne se vend plus) ;
   - topic **compacté**, créé au démarrage (`TopicsDuCatalogue`) : le read-model de paiement relit tout le catalogue,
     même des mois après ;
   - schéma : `contrat/schemas/catalogue.manifeste.publie.json`.

## Preuves

- `docker build --target verification` (Node 24) : **1142/1142**.
- `docker compose up` (pile `grp-b`, image de la branche, base neuve) :
  - le catalogue démarre `healthy` ;
  - `Manifestes — créés : 27, rattachés : 19, refusés : 0, échecs : 0` : les 21 modules du semis, dont 19 ont un
    manifeste, plus 27 modules nés de leur manifeste ;
  - `catalogue.manifeste.publie` est créé avec `cleanup.policy=compact` et porte **46** messages, de clé
    `<module>@<version>` ;
  - au **redémarrage** : 46 intacts, aucun message de plus.
- Karapace : les sujets `catalogue.manifeste.publie-value`, `entitlement.changed-value`,
  `etat-publie.changed.essai-value` et `.reel-value` sont enregistrés, et compatibles BACKWARD.
- **Sur le poste** : les tests du catalogue passent (443).
- **`test:socle`** (vrai MongoDB, transactions) : **8/8**. Les 46 manifestes sont semés :
  - `reseau` (version `1.0` du semis) reçoit son manifeste ;
  - 45 versions naissent ;
  - 46 événements partent ;
  - rejoué, le semis donne 46 versions intactes, sans aucun événement de plus.
- La garde est **verte** contre les sources renommées. Elle est **rouge** contre les sources d'avant le renommage :
  elle voit bien l'écart.

## Décisions

- **D-935-1 — Les nouveaux noms.** Le deuxième segment est raccourci, sauf pour `tresorerie:consulter`, devenu
  `tresorerie:lire` (une action déjà employée par quatre droits), et pour `releve:rapprocher` (l'objet devient le
  relevé).
- **D-935-2 — Une version publiée ne change pas.** Une copie modifiée exige une version nouvelle. Le semis ne réécrit
  jamais un manifeste existant ; il le signale divergent.
- **D-935-3 — Le manifeste s'attache à la version de même numéro semver** : le `1.0` du semis porte le manifeste
  `1.0.0`. Aucun doublon de version n'est créé.
- **D-935-4 — Un topic compacté** plutôt qu'une relecture HTTP : le read-model de paiement se reconstruit depuis le
  début du topic, sans dépendre de la disponibilité du catalogue.
- **D-935-5 — L'outbox est déclarée dans le module du catalogue** (modèle et service sans état). `OutboxModule` importe
  déjà `CatalogModule`, un import en retour ferait un cycle.

## Suite

- STORY-939 : le read-model de manifestes de `paiement-service`, qui consomme ce topic.
- Quand un propriétaire pose `src/module.manifest.ts` dans son service, la garde se branche sur ce fichier au lieu de
  `prospera-stories/manifestes/`.
