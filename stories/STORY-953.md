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

## Suite du 2026-11-26 — le contrat de l'export C13 (groupe B, lot 7, ordre « e »)

**Demande :** D, STORY-1140 (journal de D, « Demandes » : « → B (2026-11-26, STORY-1140) : publier le contrat de l'export
C13 en CSV de `prospera-bilan-service` dans `prospera-plateforme/contrats/instance/` » ; docs #953, `main` `67efaf9`) ;
placée par la session de groupe après STORY-1123, avant STORY-1124 (D-L7B-9). **Aucun identifiant neuf.** **Dépôt :**
`prospera-plateforme`, branche `MNV-953-export`, commits `MNV-953(plateforme): …` · **Exécutée par :** groupe B.

**Pourquoi :** la réponse du PO à Q-D-19 (25/11) veut l'export C13 aussi en CSV, à une seule forme sur le poste. Balance
la sert depuis STORY-1021 (D-1021-6 → 8), bilan depuis STORY-1140 ; aucun contrat publié ne la portait :
`instance-c13.openapi.json` ne décrivait que l'import et l'effacement, et le `routesInstance.export` des manifestes ne
renvoyait à rien.

### Où en est-on

- [x] Rituel : plan du lot 7, journaux de A, B, C, D (une seule demande neuve à B : celle-ci) ; la plateforme était en
  HEAD détachée sur `a06d8c9` (ancêtre de `origin/dev`), propre ; branche `MNV-953-export` partie d'`origin/dev`
  (`de8f0d3`). Le worktree `_wt-d-plateforme` (D) n'est pas touché.
- [x] Relu avant d'écrire : `scripts/contrats-instance.ts` (la seule source de `contrats/instance/`), son générateur et
  son test ; le code servi (lecture seule) : `balance-service` `origin/dev` `44be0c1` (`instance-c13/export-c13.ts`,
  `export-csv.ts`, `refus.ts`, le contrôleur, `fiscal/export-liasse.regles.ts`) et `prospera-bilan-service`
  `origin/MNV-1140` `e13d874` ; les copies : `platform-catalog-service/contrat/copies/instance/` (épinglée à
  `contrats-instance-v1`), `balance-service/src/modules/instance-c13/contrat/ORIGINE.json` ; aucune copie dans
  `agent-instance`, `centrale-service`, le BFF ou la recette.
- [x] Contrat écrit dans sa source, fichiers régénérés (`npm run contrats:instance`), tests et mutations.
- [x] « ⚠ Contrats » du journal de B annoncé avant la fusion (cette PR de docs ; PR de code : plateforme #41, `f1e0a20`).
- [x] PR de code fusionnée en rebase : `prospera-plateforme` **#41** (`dev` **`d68a468`** ; arbre identique au commit testé
  `f1e0a20`) ; étiquette **`contrats-instance-v1.1`** poussée sur `d68a468`. Annonce : stories #957 (`main` `329b9d4`).
- [x] PR de docs finale (fiche, tracker, journal de B : avancement, « Réponses » → D). Verrou Docker non pris.

### Livré

- `contrats/instance/export-c13-reponse.schema.json` (`export-c13-reponse@1`), `contrats/instance/export-c13-csv.cas.json`
  (`export-c13-csv@1` : `regles`, `cas`), `contrats/instance/instance-c13.openapi.json` 1.1.0 (route `exporter`,
  `ExportReponse`, `RefusExport` ; `Refus` + `error?`, `details?`) ; une seule source, `scripts/contrats-instance.ts`
  (`EXPORT_REPONSE`, `REGLES_EXPORT_CSV`, `CAS_EXPORT_CSV`, `REFUS_D_EXPORT`), le générateur écrit aussi les cas ;
  README (tableau des contrats, étiquettes).
- Empreintes (sha256) à l'étiquette : `export-c13-reponse.schema.json` `93074ea3…4dba`, `export-c13-csv.cas.json`
  `2a139ec9…b1c4`, `instance-c13.openapi.json` `c128e320…3052`.

### Preuves (Node 25, sans Docker)

- `test/contrats-instance.test.ts` **29/29** (17 avant : 12 neufs) : fichiers à jour avec la source (le cas compris), le
  schéma neuf en draft-07 fermé sous Ajv strict, l'OpenAPI qui porte le corps à l'identique, un export de balance
  accepté et six écarts refusés (espace, `nombre` négatif, `collection` absente, nom d'objet hors motif, date, champ en
  trop), chaque cas du CSV rejoué sur une lecture de référence écrite depuis les règles, BOM et CRLF de chaque cas, la
  route (paramètres, `no-store`, statuts) et l'ordre des refus.
- `npm test` **669/669** ; `npm run typecheck` vert.
- **Mutations, 7/7 rouges sur l'assertion visée** (fichiers régénérés à chaque fois, pour que seul le test visé parle) :
  la neutralisation retirée d'un cas ; `nombre` sans minimum ; `espace` ouvert ; deux refus inversés ; `no-store` retiré ;
  le cas « aucun document » sans CRLF ; les noms de champs d'un document bornés à `^[a-z]` (`_id` refusé).
- **Contre le code servi** (hors dépôt, `node` sur les fichiers extraits par `git show`) : les huit cas passent à l'octet
  contre `objetEnCsv` de balance (`dev` `44be0c1`) et de bilan (`MNV-1140` `e13d874`), 8/8 chacun.

## Ce qui reste

### Décisions retenues par défaut (contestables)

- **D-953-10 — La suite se rattache à STORY-953.** C'est elle qui a publié `contrats/instance/` et son générateur ; la
  route d'export est la troisième route générique de C13, point 7, à côté de l'import et de l'effacement. Aucun
  identifiant neuf (D-L7B-9).
- **D-953-11 — Le JSON : un schéma voisin, `export-c13-reponse@1`, dans le style du dépôt** (draft-07, aucun `$ref`, objets
  fermés, Ajv strict, une seule source) ; la route entre dans `instance-c13.openapi.json`, qui passe en 1.1.0 et porte le
  corps à l'identique (`ExportReponse`). Un document exporté appartient au module (`_id`, `__v`, champs de la
  collection) : il est fermé dans la forme (`additionalProperties: false`) mais tout nom de champ y passe
  (`patternProperties` sans borne), là où l'import borne les noms (`^[a-z]…`). `organisationId` garde la forme générique des
  autres contrats (1 à 64 caractères) plutôt que les 24 hexadécimaux que D écrit : balance et bilan, sur MongoDB, servent
  24 hexadécimaux, qui la tiennent ; un module d'une autre base n'en sera pas exclu. **Seul écart avec la forme de D**,
  sans effet sur ce que servent les deux.
- **D-953-12 — Le CSV n'est pas un schéma JSON : ses règles et des cas exécutables** (`export-c13-csv.cas.json`, contrat
  `export-c13-csv@1`). Huit règles écrites, huit cas : documents (Extended JSON relaxed) → texte exact du fichier, BOM
  compris. Les six premiers sont les vecteurs de balance (`export-csv.spec.ts`), que bilan rejoue déjà ; deux de plus
  bornent ce qu'ils laissaient ouvert (tabulation, CR, `+`, guillemets, saut de ligne, `false`, `$numberLong` négatif ;
  une feuille `$` à valeur composée, `$binary` et `$date` hors plage, écrite en JSON). Le test de la plateforme les rejoue
  sur une lecture de référence écrite depuis les seules règles ; et les huit ont été rejoués, hors dépôt, contre le code
  de balance (`44be0c1`) et de bilan (`e13d874`) : **8/8 et 8/8**, à l'octet. Le contrat décrit donc ce que les deux
  servent.
- **D-953-13 — Les refus : ce que les modules servent.** Le corps `Refus` de 1.0.0 était fermé sur `code` et `message`,
  alors que les modules servent aussi `error` et, souvent, `details` : les deux entrent, facultatifs (ajout seul).
  `RefusExport` nomme les `details` de l'export (`formatsServis`, `objetsServis`, `etatPublie`). L'ordre des refus est une
  constante (`REFUS_D_EXPORT`) que la description de la route recopie et que le test garde : l'identité, puis la demande
  (rien de lu), puis l'état publié ; `{MODULE}_NOT_ENTITLED` est générique (`BALANCE_NOT_ENTITLED`, `BILAN_NOT_ENTITLED`).
  `IDENTITE_DE_SERVICE_REFUSEE` vient du garde commun de bilan ; balance ne le rend pas sur cette route (son garde ne
  connaît que `IDENTITE_DE_SERVICE_REQUISE`) : le contrat le nomme comme possible, aucun des deux ne s'en écarte.
- **D-953-14 — Étiquette `contrats-instance-v1.1`** : ajouts seuls, les schémas restent `@1`, l'OpenAPI passe en 1.1.0 ;
  `contrats-instance-v1` reste où elle est (jamais déplacée). Le garde de copie de balance attend l'origine
  `prospera-plateforme@contrats-instance-v1 ` (espace compris) : C l'ajuste quand il recopie (information → C au journal
  de B, « Demandes » ; la recopie reste la sienne, comme celle de bilan reste à D).
- **D-953-15 — Aucune recopie au catalogue maintenant.** Sa copie (`contrat/copies/instance/`) est **épinglée** à
  `contrats-instance-v1`, et elle reste vraie : l'import, l'effacement, le certificat et le jeu n'ont pas changé d'un
  octet. Le catalogue n'appelle pas l'export ; la règle de 953 est de recopier une version étiquetée quand un lecteur en
  a besoin, pas à chaque étiquette. Écart noté, non servi ici : le manifeste du module `instance` (le catalogue) déclare
  `routesInstance.export` (`GET /api/v1/instance/instance/{organisationId}/export`), qu'aucun contrôleur ne sert encore ;
  la story qui le servira (n° 10, STORY-1128, l'inventaire du contrat d'état publié, au plus tard) recopie
  `contrats-instance-v1.1`.

## Ce qui reste

- **Jeux des verticales** (A, C, D, EPIC-160) : livrer leur jeu au format `jeu-demonstration@1`, et servir les deux
  routes C13 dans chaque module de démo (demande au journal de B).
- **Journaux pseudonymisés (AD-12)** : `instance.journal` n'existe pas encore. Le plan ne garde aucune donnée de
  l'organisation, et l'essai effacé n'a plus d'adresse.
- **Pile sans MinIO**, comme pour 942, 950 et 952 : le catalogue ne s'en sert pas pour l'essai.
