# STORY-950 : notification-service sur le socle, garde en double lecture ; `metadataMaxAge` dans le catalogue et paiement

Status: done

**Complexité :** moyenne (une migration de client Kafka déjà faite deux fois, une garde en double lecture)

**Épics :** EPIC-155 (les services sur le socle du moteur), EPIC-145 (la garde partagée de l'état publié)
**Dépôts :** `MoneyVibesGroup/prospera-notification-service`, `prospera-platform-catalog-service`,
`prospera-paiement-service`
**Plage :** groupe B, n° 10 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §3).

---

## Pourquoi

`notification-service` était le dernier service de B encore sous Node 20 et `kafkajs`, et il gardait son module par
l'ancienne garde (`entitlement.changed` et son échéance). La spine du moteur (AD-24) veut que la garde applique
**l'état publié seul**, par la garde partagée (`garde-etat-publie-v1`, STORY-937).

C a mesuré (STORY-990) qu'un consommateur du client de Confluent ne voit un topic à peine créé qu'au rafraîchissement
suivant des métadonnées, 5 minutes plus tard. Le catalogue et paiement créaient déjà leurs topics avant `subscribe`
(STORY-940) ; il leur manquait `metadataMaxAge`.

## Ce qui doit être vrai à la fin (plan du lot 2, §3, n° 10)

| Exigence | Fait |
|---|---|
| notification sous Node 24 et client de Confluent | oui : `node:24-slim`, étage `verification`, `@confluentinc/kafka-javascript` ~1.11, `kafkajs` retiré |
| garde à `garde-etat-publie-v1`, en double lecture | oui : copie épinglée (sha256 gardé), projection de `etat-publie.changed.<espace>`, `EnvoiAccessGuard` en double lecture |
| `metadataMaxAge` dans le catalogue et paiement | oui : 10 s sur les deux consommateurs du catalogue et la supervision de paiement (et de notification) |
| un topic neuf vu en secondes dans les trois services | oui : mesuré sur pile neuve, voir « Preuves » |

## Ce qui a été livré

1. **notification, le socle** (patron de paiement, 937 et 940) :
   - `SupervisionConsommateur` reprise telle quelle : démarrage réussi = groupe rejoint, relance avec recul, blocage
     compté par partition ; topics abonnés créés avant `subscribe` ; `metadataMaxAge: 10_000` (`METADONNEES_MAX_MS`) ;
   - la classe de base des six read-models passe au client de Confluent, avec un point de lecture d'enveloppe
     (`lire`) qu'une sous-classe peut redéfinir.
2. **notification, l'état publié** :
   - `EtatPublieConsumer` lit `etat-publie.changed.<espace>` (`INSTANCE_ESPACE`, `REEL` par défaut ; groupe
     `notification-etat-publie`) dans l'enveloppe du moteur (`organisationId`, `emisLe`) ;
   - la projection n'écrit que si `(epoque, numero)` est plus récent (index unique) ; collection
     `etats_publies_notification` ;
   - la garde partagée est copiée dans `src/vendor/garde-etat-publie/` (`ORIGINE.json`, sha256 `a830c449…`, octets
     figés par `.gitattributes`).
3. **`EnvoiAccessGuard` en double lecture** : l'état publié connu décide seul ; la divergence avec l'ancienne garde est
   journalisée ; sans état publié, l'ancienne garde décide encore (D-950-1, D-950-2).
4. **Le producteur ne retient plus l'amorçage** (notification, catalogue, paiement ; D-950-5).
5. **Deux gardes de notification remises d'aplomb** : la suppression d'une organisation conserve
   `etats_publies_notification` (D-950-3), et l'inventaire AD-12 nomme `liste-fermee-ad2.spec.ts` (D-950-4).

## Preuves

- **Node 24** (étage `verification`, construit depuis `git archive` de chaque branche) :
  - notification : **276/276 suites, 3815 passés**, 1 sauté (comparaison à la source de la plateforme, absente de
    l'image) ;
  - catalogue : **85/85 suites, 1209/1209** ;
  - paiement : **336/336 suites, 4506 passés**, 2 sautés.
  - Lint des fichiers touchés et `tsc` verts dans les trois images.
- **Mutations** :
  - la double lecture qui relit `echeanceLe` ⇒ **5 tests rouges** (chaque cas est joué contre sept droits, échéance
    passée, future ou absente) ;
  - `await` remis devant la connexion du producteur ⇒ le test « ne retient pas le démarrage » rougit (délai
    dépassé).
- **Pile `grp-b-950`** (compose racine, surcouche de recette, images des branches, volumes neufs) :
  - les trois services démarrent `healthy` ;
  - un message publié à l'instant du démarrage est consommé (offset commité) en **15,8 s** par notification et
    paiement, **15,7 s** par le catalogue. Le chiffre compte le démarrage de Nest et l'outil de mesure (≈ 3 s par
    lecture du groupe) ; C mesurait 291 s sans le réglage ;
  - un topic supprimé puis recréé **après** l'abonnement est retrouvé par le catalogue en **19,1 s** ;
  - en régime, la projection de notification suit la publication de **1,7 s** ; l'ordre `(epoque, numero)` est
    vérifié en base (n° 1 → 4) ;
  - **Kafka arrêté** : notification répond `live` 200 en 25 s, et `/health` dit `503 kafka down` ; le catalogue et
    paiement répondent aussi. Avant le correctif, notification attendait **107 s**.
- Les arbres fusionnés sur `dev` sont **identiques** à ceux éprouvés (`dev` n'avait pas bougé).

## Décisions

- **D-950-1 — L'export de la rétention est une sorte `export` de la matrice.** La route `@ToleresResiliation` était
  l'exemption « résilié, export seulement » (AD-15) ; la matrice figée sert l'export dans tous les états sauf
  `NON_INSTALLE` (FR-43). Sous l'état publié, elle n'a plus besoin d'exemption.
- **D-950-2 — La cloche garde son exemption, locale et aussi étroite.** La matrice n'a pas de sorte pour « dire
  comment se rétablir » (STORY-612). Une route `@ToleresSuspension` reste ouverte sous `SUSPENDU` et `LECTURE_SEULE`,
  les deux états où l'ancienne garde l'ouvrait ; elle reste fermée ailleurs (`DESINSTALLE`, `ESSAI_TERMINE`…).
  **Contestable** : une sorte `cloche` à la matrice serait un ajout facultatif au contrat figé.
- **D-950-3 — `etats_publies_notification` survit à la suppression d'une organisation**, comme `org_entitlements`.
  La ligne porte le dernier `(epoque, numero)` : l'effacer laisserait un ancien message `EN_SERVICE`, rejoué par
  Kafka, rouvrir le module.
- **D-950-4 — `liste-fermee-ad2.spec.ts` entre à l'inventaire AD-12.** Elle nomme les topics qu'elle fige et n'en
  consomme aucun. MNV-607 l'avait ajoutée sans l'inventorier : la garde rougissait déjà sur `dev`, ce que l'étage
  `verification` a fait voir.
- **D-950-5 — `connect()` du producteur n'est plus attendu à l'amorçage**, dans les trois services. Avec le client
  de Confluent, une connexion à un broker absent ne rejette pas vite (`kafkajs` le faisait). L'attendre retenait tout
  l'amorçage de Nest, contre le démarrage dégradé de STORY-570. Trouvé au gate, hérité de 930 et 937.
- **D-950-6 — La preuve a tourné sans MinIO.** Aucune image MinIO n'était tirable sur ce poste (Docker Hub et quay
  refusent). Un bouche-trou a pris sa place ; la santé du catalogue ne lit pas MinIO.

## Suite

- Les autres services qui gardent un module (C : sinistres, assurance ; A : balance, bilan, fiscal, dossier) suivent
  le même patron (STORY-912, 913 pour A).
- D-950-2 : une sorte `cloche` à la matrice, si le PO veut sortir l'exemption de la garde de notification.
