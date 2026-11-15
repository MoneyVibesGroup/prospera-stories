# STORY-937 : La garde partagée, et paiement en double lecture

Status: done

**Complexité :** élevée (une bibliothèque partagée, la migration du socle de paiement, la double lecture)

**Épics :** EPIC-145 (l'état publié fait foi), EPIC-155 (socle maintenu)
**Dépôts :** `MoneyVibesGroup/prospera-plateforme`, `MoneyVibesGroup/prospera-paiement-service`
**Plage :** groupe B, n° 8 du lot de B (`coordination/PLAN-4-SESSIONS-2026-11-14.md` §4).

---

## Pourquoi

« Garde partagée publiée dans `prospera-plateforme` : elle applique l'état publié seul ; `entitlement.changed` ne ferme
plus rien. Chaque consommateur existant joue un test de double lecture avant le retrait » (EPIC-145, AD-24). Paiement est
le premier, sur le nouveau socle (Node 24, client Kafka de Confluent, AD-27).

## Ce qui doit être vrai à la fin (plan §4, n° 8)

| Exigence | Fait |
|---|---|
| Garde publiée | oui : `@prospera/garde-etat-publie` (plateforme #2), étiquette `garde-etat-publie-v1` |
| `paiement` la joue en double lecture avec l'ancienne | oui : l'état publié connu décide, la divergence est journalisée ; inconnu, l'ancienne garde décide |
| Sur le nouveau socle (Confluent, Node 24) | oui : paiement #117 |
| Mutation : falsifier `echeanceLe` ne change aucune décision | oui : huit états × six droits (échéance passée, future, absente, sans terme, suspendu, aucun) donnent la même décision |

## Ce qui a été livré

1. **`@prospera/garde-etat-publie`** :
   - `deciderGarde({ etat, versionMatrice, sorte, identite, espace, module })` et `sorteDeMethode` ;
   - la garde de la matrice FIGÉE du catalogue, recopiée par `npm run garde:generer` ;
   - un fichier unique sans import, copié par les services ;
   - on ferme, on n'ouvre pas : un état inconnu se lit `NON_INSTALLE`, une version de matrice inconnue refuse ;
   - 37 tests : la copie est égale à la source, les 1152 cellules sont rejouées.
2. **Le socle de paiement** :
   - `node:24-slim`, avec un étage `verification` qui copie tout le dépôt ;
   - le client de Confluent (module, producteur, consommateurs, santé par `listTopics`) ;
   - **`SupervisionConsommateur` réécrite**. Le client n'a ni `CRASH` ni `GROUP_JOIN` : un démarrage réussi vaut « dans
     son groupe », et un démarrage en échec est relancé avec un recul. Le blocage se compte par partition, sur les
     échecs consécutifs du même message (relivré par le client) ;
   - les interdits d'import du domaine et des ports s'étendent au nouveau client.
3. **Le read-model `etats_publies_paiement`** :
   - il consomme `etat-publie.changed.<espace>` ;
   - l'enveloppe du moteur se lit par une méthode surchargeable de la classe de base ;
   - un état n'est appliqué que si `(epoque, numero)` est plus récent.
4. **La garde de paiement en double lecture** (`PaiementAccessGuard`, copie épinglée de la garde, empreinte gardée).

## Preuves

- `prospera-plateforme` : **37/37**. Une mutation d'une cellule fait rougir 2 tests.
- Paiement, `verification` sous Node 24 : **4483 passés, 2 ignorés, 0 échec**.
- **Mutation de l'épic** : rendre la parole à l'ancienne garde (donc à `echeanceLe`) fait rougir 8 tests.
- Pile `grp-b`, image de la branche :
  - santé `ok` (mongodb, kafka, redis) et 5 consommateurs démarrés ;
  - parcours réel catalogue → Kafka → paiement :
    1. sans droit, `GET /creances` donne 403 `PAIEMENT_NOT_ENTITLED` ;
    2. le droit `paiement` octroyé au catalogue donne un état publié `EN_SERVICE` (n° 1), projeté chez paiement ; la
       garde du module passe (le refus suivant, `PERMISSION_DENIED`, vient de la garde de permission : le jeton de
       test ne porte aucun droit de tenant) ;
    3. le retrait donne `DESINSTALLE` (n° 2), puis 403 `PAIEMENT_NOT_ENTITLED`.

## Décisions

- **D-937-1 — Un fichier unique, copié et épinglé.** Il n'y a ni mono-dépôt ni registre de paquets (AD-26). La copie
  porte son origine (dépôt, étiquette, commit) et son sha256, que garde un test. `.gitattributes` fige ses octets
  (le piège `autocrlf` des empreintes).
- **D-937-2 — Pendant la double lecture, l'état publié décide dès qu'il est connu.** C'est la règle d'AD-24 ;
  l'ancienne garde ne sert plus qu'à journaliser l'écart. Divergence attendue : en `PREAVIS`, l'ancienne garde
  passait en lecture seule dès l'échéance (STORY-727 lot 4), l'état publié attend la fin du préavis (décision du PO
  du 2026-11-10).
- **D-937-3 — La garde ne lit aucune configuration** (invariant de STORY-606) : l'espace est celui du message
  projeté.
- **D-937-4 — Le champ du read-model s'appelle `etatPublie`**, pas `etat` : l'invariant de STORY-260 réserve le
  `$set: { etat }` à la machine à états des demandes.
- **D-937-5 — L'adhésion au groupe n'est plus observée en direct.** librdkafka la tient lui-même ; un consommateur
  démarré est réputé dans son groupe. Le blocage d'une partition et la santé du broker restent visibles.

## Suite

- Retrait de l'ancienne garde de paiement, une fois les droits réamorcés par le moteur (EPIC-144).
- Notification (S7), bilan et balance (EPIC-159), microfinance (S7) : même double lecture, chacun à sa semaine.
