# STORY-990 : les consommateurs Kafka de C voient un topic neuf en secondes, pas en cinq minutes

Status: review

**Complexité :** petite (une correction, trois dépôts, une mesure sur pile neuve)

**Épic :** EPIC-201 (le socle technique)
**Dépôts :** `MoneyVibesGroup/prospera-sinistres-service`, `MoneyVibesGroup/prospera-assurance-service`,
`MoneyVibesGroup/prospera-ocr-service` (`document-service`), tous tenus par C
**Plage :** groupe C, insérée par C après STORY-983 (journal de C, 2026-11-15). Elle corrige une régression que C a
livrée en STORY-980, 981 et 982 en migrant de `kafkajs` vers le client de Confluent.

---

## Pourquoi

`kafkajs` créait un topic absent en s'y abonnant. **Le client de Confluent ne le crée pas**, et un abonnement à un
topic absent (ou créé à l'instant, sans leader encore) prend « Unknown topic or partition » : librdkafka ne le
recherche qu'au **rafraîchissement des métadonnées, toutes les 5 minutes** par défaut. Sur une pile neuve, un
read-model rate donc les faits des cinq premières minutes :

- la recette de l'Atelier (STORY-982) a rendu 502 sur le profil société : le read-model des dossiers de
  `document-service` ne connaissait pas un dossier créé une seconde plus tôt ;
- `sinistres-service` (STORY-980) : le premier droit publié n'ouvrait la porte qu'après environ 4 minutes, que le
  journal de C avait rangées à tort en simple attente ;
- `assurance-service` (STORY-981) : même supervision que `document-service`, même défaut.

**Ce que STORY-982 n'avait pas prouvé.** Son correctif (créer les topics absents avant l'abonnement, `d71a294`)
est nécessaire mais **pas suffisant** : mesuré ici sur pile neuve, il laisse encore **291 s** entre la publication
d'un droit et sa projection, car l'abonnement arrive avant que le topic à peine créé ait un leader. La recette de
l'Atelier était verte parce que sa mise en place dure plus de cinq minutes : elle passait après le rafraîchissement.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | Chaque consommateur crée ses topics absents **avant** `subscribe`, aux réglages du broker ; un refus est journalisé et n'empêche pas l'abonnement | unitaires |
| AC-2 | Chaque consommateur rafraîchit ses métadonnées toutes les **10 s** (`metadataMaxAge`) | unitaires : la configuration du consommateur est assertée |
| AC-3 | **Sur une pile neuve**, un droit publié après le démarrage de `sinistres-service` est projeté en **secondes** | pile `grp-c` réelle, temps mesuré avant et après |
| AC-4 | Suites existantes vertes, lint 0, build, sous Node 24 | sorties |
| AC-5 | La recette de l'Atelier rejouée **depuis `dev`** (images reconstruites) reste verte | recette |

## Décisions retenues par défaut (contestables)

- **D-990-1 — Le consommateur crée le topic qu'il lit**, aux réglages du broker, comme le faisait `kafkajs`. Un
  topic dimensionné autrement se crée par l'exploitation avant le service ; il n'est alors pas touché.
- **D-990-2 — 10 s de rafraîchissement des métadonnées.** Le coût est une requête de métadonnées toutes les 10 s par
  consommateur, négligeable à l'échelle d'une instance ; le gain est un topic neuf vu en secondes. La même
  supervision est copiée à l'octet dans `document-service` et `assurance-service`.

## Ce qui a été livré

**2026-11-15** — trois PR fusionnées en « Rebase and merge » sur `dev` : `prospera-sinistres-service` **#2**,
`prospera-assurance-service` **#21**, `prospera-ocr-service` **#25** (têtes vérifiées avant fusion : `839e97f`,
`0393e9f`, `3bd38fc`).

- **Mesure sur pile neuve** `grp-c` (`sinistres-service`, image de la branche ; un droit publié après le démarrage,
  chronométré jusqu'à sa projection dans `socle_etat_des_modules`) : **291 s** avec la seule création du topic,
  **6,9 s** avec `metadataMaxAge` à 10 s. Journal du service : « Topic entitlement.changed créé avant l'abonnement ».
- Sous Node 24, depuis des exports LF : sinistres **292** unitaires + **11** e2e ; assurance **2 200** + **347** ;
  document **902** + **183** ; lint 0 et build pour les trois.
- La configuration du consommateur (`metadataMaxAge: 10_000`) est assertée dans les tests : la retirer les rougit.
- **Reste AC-5** : la recette de l'Atelier rejouée depuis `dev`, images reconstruites (image de `document-service`
  construite depuis `7068952`). Elle attend que la pile `grp-b` libère les ports du compose racine ; une tâche la
  lance dès la descente.
