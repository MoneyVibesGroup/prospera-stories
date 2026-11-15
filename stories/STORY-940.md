# STORY-940 : `declarations` s'ouvre aux paquets fiscaux — le seed du catalogue

Status: done

**Complexité :** petite (une donnée de semis, une migration, une recette), plus une régression de 930/937 trouvée au gate

**Épics :** EPIC-264 (le fiscal du cabinet en production) ; constat de STORY-901
**Dépôts :** `MoneyVibesGroup/platform-catalog-service` (PR #49), `MoneyVibesGroup/prospera-paiement-service` (PR #119),
`MoneyVibesGroup/prospera-recette` (PR #20)
**Plage :** groupe B (934 → 979). Hors du lot de B : demandée par l'utilisateur le 2026-11-15, à faire après lui.

---

## Pourquoi

Le module fiscal octroyable est `declarations` depuis que `fiscalite` est retiré de l'offre (STORY-549). Son semis
ne déclarait que les familles `syscohada-revise` et `zone-franche-togo`. L'octroi d'un paquet fiscal
(`fiscal-tg-entreprise`, `fiscal-tg-entreprise-zone-franche`) partait donc en `422 REFERENTIEL_INCOMPATIBLE` :
**en production, `fiscal-service` ne recevait aucun paquet**. La recette `zone-franche` contournait par un
`PATCH /admin/modules/declarations` (STORY-901).

## Ce qui doit être vrai à la fin

| Exigence | Fait |
|---|---|
| Une base neuve : `declarations` accepte les deux paquets fiscaux | oui : le semis les déclare |
| Une base déjà semée aussi | oui : migration `npm run migrate:familles-fiscales` (le semis ne réécrit pas) |
| La recette ne contourne plus | oui : le `PATCH` est retiré, la recette vérifie le semis |

## Ce qui a été livré

1. **Le semis** (`modules.seed-data.ts`) : `declarations.referentielFamilies` =
   `syscohada-revise`, `zone-franche-togo`, `fiscal-tg-entreprise`, `fiscal-tg-entreprise-zone-franche`. Les deux
   derniers viennent d'une constante partagée, `FAMILLES_FISCALES_DE_DECLARATIONS`.
2. **La migration** (`src/migrations/familles-fiscales-de-declarations.ts`) :
   - `$addToSet` des deux familles : rien n'est retiré ni réordonné, une famille posée depuis la console reste ;
   - idempotente : un second passage rend `deja` sans écrire ;
   - un paquet absent du registre est écrit quand même, et nommé (`aDeposer`) : sans dépôt, l'octroi part en 422
     « référentiel inexistant », jamais en octroi muet.
3. **La garde « famille packagée »** (`referentiels-packages.snapshot.ts`) : une seconde source, les paquets fiscaux
   packagés par `balance-service` (`PAQUETS_FISCAUX_PACKAGES`, sha256 relus le 2026-11-15). Sans elle, un module qui
   cite une famille fiscale rougissait (« famille non packagée »).
4. **La recette** (`zone-franche.recette.ts`) : le `PATCH /admin/modules/declarations` est retiré. Elle vérifie que
   le semis porte les deux paquets, avec un message nommé pour un catalogue d'avant 940.
5. **La procédure de mise en service** du paquet Togo (journal du groupe A, étape 3) : la migration remplace le
   `PATCH` à la main.
6. **Régression de STORY-930 et 937, trouvée au gate** : sur une pile neuve, le `globalSetup` de la recette
   s'arrêtait (« le groupe Kafka platform-catalog-abonnements n'existe pas »). Le client de Confluent ne crée pas un
   topic en s'y abonnant (kafkajs le faisait), et ne voit un topic créé plus tard qu'au rafraîchissement des
   métadonnées (5 minutes) ; `paiement.abonnement.*` n'est écrit qu'au premier abonnement vendu. Les deux
   consommateurs du catalogue (`assurerLesTopicsAbonnes`) et la supervision de paiement créent désormais leurs topics
   abonnés absents avant `subscribe`, aux réglages du broker. C'est le correctif de C pour `document-service`
   (STORY-982), repris à l'identique ; C l'avait signalé à B.

## Preuves

- **Catalogue**, Node 24 : **1207/1207**. Tests ajoutés : semis de `declarations`, migration (5 cas : base d'avant
  940, idempotence, paquet déjà ouvert à la main, module absent, paquet non déposé), snapshot à deux sources, topics
  abonnés créés avant `subscribe` (et garde de balayage sur les deux consommateurs).
- **Paiement**, Node 24 : tous les tests passent, dont 3 nouveaux (ordre `createTopics` → `subscribe`, rien à créer,
  refus non bloquant). Sur deux passages complets, une suite différente a expiré chaque fois sous la charge du poste
  (`app-cablage`, puis `relais-des-avis`), sans assertion en échec ; toutes deux passent seules.
- **Recettes à froid**, pile `grp-b` neuve (catalogue, paiement et recette de `MNV-940`, les autres services de `dev`,
  `document-service` depuis un worktree de `dev` par `RECETTE_SURCOUCHES`) :
  - `zone-franche` : **5/5**, sans `PATCH` ; le semis lu porte `syscohada-revise`, `zone-franche-togo`,
    `fiscal-tg-entreprise`, `fiscal-tg-entreprise-zone-franche` ;
  - `atelier-balance` : **51/51**. Au premier passage, un `ECONNRESET` vers auth dans son `beforeAll` (pendant le
    démarrage des quatre services de l'Atelier) a été reporté sur ses 51 tests ; rejouée sur la même pile, verte.
  - Avant le correctif des consommateurs, la pile neuve ne démarrait pas (constat ci-dessus).
- **Migration dans l'image** (`node dist/migrations/familles-fiscales-de-declarations.js`), sur la même pile, avec
  `declarations` remis à son état d'avant 940 : premier passage `modifie` (2 familles ajoutées, `aDeposer` vide car les
  paquets étaient déposés), second passage `deja`. Familles relues : les quatre.
- C'est aussi la **relecture finale de A rejouée** : `atelier-balance` + `zone-franche`, **56/56**, comme le
  15/11 avant le lot de B.

## Décisions

- **D-940-1 — `declarations` seul.** `conseil` garde les familles de `fiscalite` : aucun service ne le sert, et rien
  ne dit qu'il consommera un paquet fiscal. `fiscalite`, retiré de l'offre, n'est pas touché.
- **D-940-2 — Une migration jouée au déploiement, pas un semis réparateur.** Le semis reste `$setOnInsert` (une
  édition de la console n'est jamais rétablie de force, STORY-497). La migration n'ajoute que les deux familles, une
  fois : c'est le patron du backfill de STORY-148.
- **D-940-3 — Les packs ne changent pas.** Le pack `cabinet` octroie `syscohada-revise` à ses modules ; le paquet
  fiscal d'un cabinet s'octroie par module, à la mise en service (procédure du journal de A). Ajouter un paquet fiscal
  au pack l'octroierait aussi à `balance` et `bilan`, qui le refuseraient (`REFERENTIEL_INCOMPATIBLE`).
- **D-940-4 — La régression des consommateurs se corrige ici**, et non dans une story à part : elle empêchait le gate
  de cette story (et la recette de C). Même correctif que C, pour que les trois services se comportent pareil.

## Suite

- Mise en service : publier le paquet Togo 2026 (procédure du journal de A), jouer la migration, octroyer.
- `notification-service` passera au client de Confluent au lot suivant : il lui faudra le même correctif.
