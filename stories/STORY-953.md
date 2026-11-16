# STORY-953 : le contrat du jeu de démonstration, l'effacement, cinq essais simultanés

Status: done

**Complexité :** grande (six contrats neufs, un plan d'effacement, un certificat signé ; deux dépôts)

**Épic :** EPIC-147 (le prospect essaie avant de signer)
**Dépôts :** `MoneyVibesGroup/prospera-plateforme` (#17, `5a50249` sur `dev`, étiquette **`contrats-instance-v1`**),
`MoneyVibesGroup/prospera-platform-catalog-service` (#58, `4dfde25` sur `dev`) ; contrats annoncés avant la fusion
(stories #562)
**Plage :** groupe B, n° 13 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §3).

---

## Pourquoi

EPIC-147 : « Jeu de démonstration (décision du PO, 18e séance) : option de l'offre d'essai. En janvier, l'essai s'ouvre
avec le jeu de sa verticale. Le contrat du jeu est publié le lundi 14/12 ; son contenu vient de chaque verticale
(EPIC-160). Cinq essais simultanés sur l'hébergement Money Vibes. Effacement à la fin : plan enregistré et idempotent
qui appelle la route d'effacement C13 de chaque propriétaire ; journaux pseudonymisés ; certificat d'effacement signé,
avec la date d'expiration de la dernière sauvegarde qui contient les données. »

AD-38 (amendement de Connecteurs) : l'effacement d'un prospect non converti part automatiquement à `effacementLe`.
STORY-952 avait posé l'échéance `EFFACEMENT` et réservé le point d'accroche (« Pour STORY-953 »).

## Ce qui doit être vrai à la fin (plan du lot 2, §3, n° 13)

| Exigence | Fait |
|---|---|
| Contrat du jeu de démonstration publié au plus tard le 14/12 | oui, le 16/11 : `jeu-demonstration@1`, étiquette `contrats-instance-v1` ; jeu témoin de B |
| Effacement idempotent avec certificat signé | oui : plan enregistré, rejoué il reprend, fini il rend le même certificat ; JWS EdDSA vérifié de la racine à la charge |
| Cinq essais simultanés | oui : cinq ouvertures concurrentes avec le jeu témoin en 433 ms sur la pile, sans mélange ; aucun verrou global |

## Ce qui a été livré

**Plateforme** (`contrats/instance/`, générés par `npm run contrats:instance` depuis `scripts/contrats-instance.ts`) :

1. `jeu-demonstration@1` : un jeu est un dossier.
   - `jeu.json` porte le code, la version, la verticale et un `generateur` éventuel (nom, source à une étiquette,
     graine, paramètres : celui de C, STORY-987, s'y décrit).
   - Il a une part par module dans l'ordre d'import.
   - Chaque objet a un fichier de données (un tableau JSON), son nombre d'enregistrements et son sha256.
2. `import-c13-demande@1` et `-reponse@1` : la forme générique de la route C13 d'import. Un lot porte un objet et est
   idempotent (`IMPORTE`, puis `DEJA_IMPORTE`).
3. `effacement-c13-demande@1` et `-accuse@1` : la forme générique de la route C13 d'effacement et l'accusé du
   propriétaire (`EFFACE`, `DEJA_EFFACE`).
4. `certificat-effacement@1` : la charge du JWS `prospera-certificat-effacement+jws`, audience `prospect`.
   `@prospera/signature` reconnaît ce `typ`, signé par une clé d'usage `centrale`.
5. `instance-c13.openapi.json` : les deux routes génériques.
6. `jeux-demonstration/temoin/` : le jeu témoin (deux objets du module `stock`) ; `npm run jeu:verifier -- <dossier>`.

**Catalogue** (`src/essai/`) :

1. `jeux/` : la lecture d'un jeu (même verdict que le schéma, rejouée contre lui), le registre des jeux lu au démarrage
   (`JEUX_DEMONSTRATION_DIR` ; le jeu témoin est dans l'image), l'import part par part, objet par objet, en lots, par la
   route C13 que le module déclare à `routesInstance.import`.
2. `c13/appels-c13.ts` : les appels aux routes C13 d'import et d'effacement, à l'adresse du module (`INSTALLATION_SERVICES`)
   sous l'identité du moteur ; réponses lues au contrat ; tout échec est nommé.
3. `effacement/` : le plan (`effacements`, entrée du registre d'effacements d'AD-16), le bail par organisation, le
   certificat (JCS et Ed25519 par `node:crypto`), le compteur des certificats par clé, la tâche automatique à
   `effacementLe` (file `effacements-d-essai`).
4. L'essai : `jeuDemonstration` à l'ouverture, `jeu` (état de l'import par part), statut `EFFACE`, `effaceLe` ; routes
   `POST …/jeu-demonstration`, `POST` et `GET …/effacement`.
5. Copies épinglées de la plateforme à `contrats-instance-v1` (`contrat/copies/instance/ORIGINE.json`, octets gardés).

## Preuves

- **Plateforme**, Node 24 (`node:24-slim`, export `git archive`) : `npm ci`, `typecheck`, `npm test` **424 passés,
  0 échec, 1 sauté** (la matrice du catalogue, absente du conteneur) ; `jeu:verifier` du témoin : conforme.
  `test/contrats-instance.test.ts` (17 tests) couvre :
  - les fichiers sont à jour avec leur source ;
  - les schémas sont en draft-07 fermé et passent Ajv en mode strict ;
  - le jeu témoin est conforme, et un jeu altéré est refusé (empreinte, nombre, doublon, fichier absent, `..`) ;
  - le générateur de C se décrit dans le contrat ;
  - le certificat se vérifie de la racine à la charge ; signé par une clé de CI : `USAGE_NON_COUVERT` ; altéré :
    `SIGNATURE_INVALIDE` ; présenté à une autre audience : `AUDIENCE_INCORRECTE`.
- **Catalogue**, Node 24 (étage `verification`) : `tsc`, lint de `src`, **96/96 suites, 1457/1457**.
- **Mutations**, toutes rouges sur l'assertion :
  - plateforme : l'empreinte non vérifiée ; un certificat signable par une clé `ci` ; un import du jeu sans `jeu` ;
  - catalogue : un certificat signé malgré un propriétaire en attente ; un import qui continue après une part en échec ;
    un essai effacé qui rouvre ses modules ; un bail sans effet (deux ordres simultanés) ; une clé expirée qui signe.
  Deux premières versions du catalogue rougissaient à la compilation (`false && …`) ou laissaient survivre la
  mutation du bail : le faux modèle confondait les `Date` d'un autre royaume (`structuredClone` sous jest), et le test
  ne forçait pas le chevauchement. Les deux tests sont corrigés.
- **Pile `grp-b-953`**. Composition :
  - l'image `runtime` de la branche, MongoDB 8 en jeu de répliques, Kafka, Redis ;
  - un module `stock` simulé qui sert les deux routes C13 et garde ses données par organisation ;
  - une clé `centrale` de test certifiée par la racine de test, valable jusqu'en 2028.

  La clé de test de la plateforme expire le 01/01/2027, avant `effacementLe`, d'où la garde « hors validité ».

  Déroulé :
  1. **Cinq ouvertures simultanées** avec le jeu témoin, en **433 ms**. Chaque organisation tient ses 2 entrepôts et
     ses 3 articles. 10 appels d'import, 10 clefs distinctes, toutes sous le jeton du moteur, et aucune clef d'une
     organisation chez une autre.
  2. Ordres refusés ou sans effet :
     - le rejeu de l'ouverture rend 200 sans nouvel import ;
     - un jeu inconnu rend 422 `JEU_DEMONSTRATION_INCONNU` ;
     - effacer avant `effacementLe` rend 409 `EFFACEMENT_PREMATURE`.
  3. Quatre essais sont signés, puis l'horloge est avancée de 61 jours. **L'effacement du cinquième part seul**
     (`AUTOMATIQUE`) :
     - le module accuse `EFFACE` (5 enregistrements) ;
     - `stock` passe `DESINSTALLE` à l'état publié ;
     - l'essai passe `EFFACE` et n'a plus d'adresse ;
     - la dernière sauvegarde expire 92 jours plus tard.
  4. Les quatre essais signés sont intacts : leurs données sont chez le module, et ils n'ont aucun effacement.
  5. **Le certificat se vérifie par `@prospera/signature`** (racine de test, certificat de clé, artefact) **et par le
     schéma `certificat-effacement@1`**. Une autre audience, une autre instance ou une signature altérée sont refusées.
     Le rejeu de l'ordre rend le même certificat.
  6. La pile est descendue avec ses volumes, et le verrou Docker est rendu.

## Décisions

- **D-953-1 — Les contrats C13 d'import et d'effacement sont génériques, publiés une fois dans la plateforme.** C13 ne
  fixait que les chemins ; 946 avait réservé les corps « quand le moteur les publiera ». Un module les sert à ses chemins
  déclarés (`routesInstance`), sans forme propre.
- **D-953-2 — Un lot d'import porte un seul objet, idempotent par sa clef.** Un jeu de taille réelle (25 000 polices
  chez C) ne tient pas dans une requête. La clef `jeu|<org>|<code>@<version>|<module>|<objet>|<lot>` est fixe : rejouer ne
  double rien.
- **D-953-3 — Une part qui échoue arrête l'import.** Les parts suivantes restent `A_IMPORTER`. L'ordre des parts est
  celui des dépendances : on ne saute jamais une dépendance.
- **D-953-4 — Pas de certificat sans tous les accusés.** Un propriétaire injoignable laisse le plan `EN_COURS`. La file
  rejoue (10 tentatives, ~17 h), puis le démarrage, puis l'ordre suivant. Un module sans route d'effacement est
  `SANS_ROUTE` au certificat : il dit ne rien garder (à charge du module de le rendre vrai).
- **D-953-5 — La part de la partie A passe après les propriétaires**, dans cet ordre :
  1. l'axe 2 passe `DESINSTALLE` ;
  2. l'essai passe `EFFACE`, sans adresse (les avis) ;
  3. un droit lu avec un essai effacé vaut `REVOKED` : l'état publié dit `DESINSTALLE`, jamais une réouverture.

  Le plan reste : c'est l'entrée du registre d'effacements (AD-16).
- **D-953-6 — Signé par une clé d'usage `centrale`, audience `prospect`.** C'est Money Vibes qui atteste. Un usage
  nouveau aurait changé le contrat `certificat-cle`, alors qu'un `typ` nouveau n'est qu'un ajout. Sans clé, ou avec une
  clé hors de sa validité (lue dans son certificat de clé), l'organisation est effacée mais le certificat attend
  (`CLE_DE_SIGNATURE_ABSENTE`, `CLE_DE_SIGNATURE_HORS_VALIDITE`) : un certificat qu'un vérificateur refuserait ne sort
  jamais.
- **D-953-7 — La dernière sauvegarde expire 92 jours après l'effacement par défaut** (AD-16 : 3 mensuelles),
  réglable par `EFFACEMENT_RETENTION_SAUVEGARDES_JOURS`.
- **D-953-8 — Les jeux vivent dans un dossier lu au démarrage, pas dans une base.** Un jeu non conforme n'est pas chargé
  et le journal le dit (`JEU_DEMONSTRATION_NON_CONFORME`). Les verticales livrent leurs jeux au format du contrat, et
  l'exploitation les dépose à côté du témoin.
- **D-953-9 — L'effacement d'un essai signé est refusé** (`ESSAI_SIGNE`) : ses données sont celles d'un client.
  L'effacement à la fin d'un contrat (`FIN_CONTRAT`) est prévu par le contrat, mais pas servi ici.

## Ce qui reste

- **Jeux des verticales** (A, C, D, EPIC-160) : livrer leur jeu au format `jeu-demonstration@1`, et servir les deux
  routes C13 dans chaque module de démo (demande au journal de B).
- **Journaux pseudonymisés (AD-12)** : `instance.journal` n'existe pas encore. Le plan ne garde aucune donnée de
  l'organisation, et l'essai effacé n'a plus d'adresse.
- **Pile sans MinIO**, comme pour 942, 950 et 952 : le catalogue ne s'en sert pas pour l'essai.
