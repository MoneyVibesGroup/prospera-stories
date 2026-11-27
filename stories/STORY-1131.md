# STORY-1131 : Les restes d'EPIC-145, 146, 147 — premier incrément : l'Administration exporte, module par module, dans tout état (`ESSAI_TERMINE` compris)

Status: done — **livrée le 2026-11-27** : platform-catalog-service **#91** (`4d01a70` sur `dev`), prospera-auth-service
**#53** (`c6b8e2b` sur `dev`) ; voir « Livraison ». Fiche écrite le 2026-11-27 par une sous-session du groupe B juste avant de coder (lot 7, n° 13 de B,
`coordination/PLAN-LOT-7-GROUPE-B-2026-11-25.md` §1, deuxième partie, ligne 13 ; identifiant réservé D-L7B-1).
**Date du plan : 08/01.**

**Dépôts :** `platform-catalog-service` (la partie A du moteur), `auth-service` · **BFF (`admin-panel`) : inchangé**
(D-1131-6) · **Points :** 3 · **Dépend de :** STORY-953 (contrats C13, `contrats-instance-v1.1` de la suite « e »), STORY-978
(le jeton du moteur par organisation), STORY-1128 (« Inventaire », D-1128-9, D-1128-10), STORY-979 septième suite (D-979-47)
· **Suite :** STORY-1133 (EPIC-148 : `sante`, `migrer`, commandes de l'agent), STORY-1135 (EPIC-151 : interrupteurs)
**Sources :** plan du lot 7 de B §1 (n° 13 : « les restes d'EPIC-145, 146, 147 nommés par l'inventaire du n° 10 — catalogue,
auth, BFF — 08/01 — l'état publié fait foi, deux espaces, essai du prospect ») ; fiche STORY-1128 (« Inventaire »,
D-1128-9, D-1128-10) ; STORY-979 (septième suite, D-979-47) ; STORY-1137 (`12c4c84`) ; `epics-moteur-installation-2026-11-11.md`
(EPIC-145 FR-43 et écrans `instance` ; EPIC-146 ; EPIC-147 : « `ESSAI_TERMINE` et 30 jours pour exporter ou signer ») ;
`PLAN-FEVRIER-2027-TOUT-CHARGE-2026-11-14.md` (EPIC-145 → 147 au 08/01) ; `CONTRAT-DE-MODULE-2026-11-09.md` (C2 « l'export
passe toujours », C13 point 7 : l'export sert la partie A et le détenteur de `instance:donnees:exporter`) ; spine du moteur
AD-37 (l'export de l'écran Administration passe par la partie A) ; journal de D, Q-D-18 (D-1075-3 : les modules n'ouvrent
leur export qu'au moteur) ; `prospera-plateforme@contrats-instance-v1.1` ; code sur `origin/dev` : catalogue `12c4c84`, auth
`d037506`, BFF `7ac4db4`, balance `4f75f4e` (l'export C13 de C, lu seulement).

---

## Pourquoi

EPIC-147 promet au prospect, à la fin de son essai, « 30 jours pour exporter ou signer » ; EPIC-145 (FR-43) promet que
« l'export passe toujours », par l'Administration de l'instance, module par module, même en lecture seule ou suspendu.
Aujourd'hui, rien de cela n'est servi : chaque module n'ouvre son export C13 qu'à l'identité du moteur (Q-D-18, D-1075-3),
la partie A ne le relaie pas, le module `instance` déclare une route d'export qu'aucun contrôleur ne sert (D-1128-9), et
**aucun rôle ne détient `instance:donnees:exporter`**. Un prospect en `ESSAI_TERMINE` ne peut donc rien récupérer.

## L'inventaire de 1128, ce qu'il en reste et à qui (relu le 27/11)

Le n° 13 réunit trop pour une story (rafraîchissement, journaux pseudonymisés, interrupteurs, export, relectures). Le
**premier incrément** qui a le plus de valeur avant le 08/01 est **l'export** : il ferme la promesse de l'essai montrée le
15/01 et celle de FR-43, il débloque l'écran Administration de A, et il repose sur ce qui existe (jeton du moteur, routes
C13 déclarées, contrats `contrats-instance-v1.1`). Le reste est nommé, avec sa raison (D-1131-8).

| Reste (inventaire de 1128) | Épic | Ici ? |
|---|---|---|
| La route d'export du module `instance` (et `import`, `effacement`, `sante`, `migrer`) déclarée, non servie | 145, 147 | **export servi** ; les quatre autres tranchés (D-1131-2) |
| L'export par l'Administration (FR-43, coque `instance`) et pendant `ESSAI_TERMINE` | 145, 147 | **oui** (D-1131-1) |
| `module.interrupteurs` vide ; `config` absent de l'état publié | 145, 159 | **non : STORY-1135** (D-1131-4) |
| `droitsEffectifs` filtré par préfixe : `fiscalite:*` absents quand seul `declarations` est ouvert (D-979-47) | 145 | **oui, côté catalogue** (D-1131-3) |
| Rafraîchissement (FR-10) ; NFR-3 à relire | 146 | non (D-1131-8) |
| Journaux pseudonymisés (`instance.journal`) | 147 | non (D-1131-8) |
| FR-35, droits hors du jeton étape 3, FR-12, FR-37, `libelle` dans l'émetteur | 142 → 145 | non (D-1131-8) |
| Copie de la garde sans test dans `document-service` | 145 | non : dépôt tenu par une autre sous-session (D-1131-8) |
| Routes d'import C13 des modules ; jeux des verticales | 146, 147 | **C, D, A** (« Demandes » déjà écrites par 1128) |
| Écrans (état, bandeaux, compte à rebours, export, marque d'essai) | 145 → 147 | **A** |

## Contrat annoncé avant le code (2026-11-27)

1. **Catalogue — l'export C13 du module `instance`** : `GET /api/v1/instance/instance/{organisationId}/export`
   (`format` = `json` par défaut ou `csv`, `objet`), la route que le manifeste déclare depuis STORY-953, à la forme de
   `contrats/instance/instance-c13.openapi.json` 1.1.0 (`export-c13-reponse@1` en JSON ; en CSV, un objet par fichier, les huit
   règles de `export-c13-csv.cas.json`), `Cache-Control: no-store`, rien d'écrit. Ouverte à l'**identité du moteur** limitée à
   l'organisation, et au **membre** de l'organisation qui détient `instance:donnees:exporter` (C13, tableau des routes).
   Objets, dans l'ordre : `organisation`, `naissances`, `offre`, `droits`, `installations`, `plans-installation`, `essai`
   (sans `destinataires` ni `avisEnvoyes` : adresses du prospect et du commercial de Money Vibes), `mises-en-service`,
   `interceptions-essai`, `effacements`. Refus : 403 `ORGANISATION_HORS_JETON`, 403 `DROIT_EXPORT_REQUIS`, 403
   `INSTANCE_NOT_ENTITLED` (organisation inconnue de l'espace : rien à exporter), 400 `FORMAT_NON_SERVI`, 400
   `OBJET_REQUIS`, 422 `OBJET_INCONNU`.
2. **Catalogue — l'export par l'Administration** (route neuve, AD-37 premier incrément) :
   `GET /api/v1/administration/{organisationId}/exports/{module}` (chemin public `/api/instance/v1/administration/…`),
   `format` et `objet` relayés. Réservée au **membre** de l'organisation qui détient `instance:donnees:exporter` (aucune
   identité de service : elles appellent le module elles-mêmes). Le module doit avoir un état publié autre que
   `NON_INSTALLE` (tous les autres ouvrent, `ESSAI_TERMINE`, `LECTURE_SEULE`, `SUSPENDU` compris, C2) ; `instance` est
   servi sur place (point 1) ; un autre module est appelé à sa route `routesInstance.export` (manifeste en vigueur), à son
   adresse `INSTALLATION_SERVICES`, sous le **jeton du moteur** de l'organisation ; sa réponse est relayée (JSON vérifié :
   `schemaVersion` 1, même `module`, même `organisationId` ; CSV : ses octets), `Cache-Control: no-store`. Refus de la
   partie A : 403 `ORGANISATION_HORS_JETON`, 403 `DROIT_EXPORT_REQUIS`, 404 `ORGANISATION_INCONNUE`, 404 `MODULE_INCONNU`,
   403 `MODULE_NON_INSTALLE`, 503 `HORLOGE_INDISPONIBLE` ; 503 `EXPORT_INDISPONIBLE` (`raison` : `SERVICE_NON_CONFIGURE`,
   `JETON_DU_MOTEUR_INDISPONIBLE`) ; 502 `EXPORT_INDISPONIBLE` (`raison` : `ROUTE_INVALIDE`, `SERVICE_INJOIGNABLE`,
   `DELAI_DEPASSE`, `STATUT_INATTENDU`, `REPONSE_HORS_CONTRAT`). Un 400, 403 ou 422 du module est **relayé tel quel**
   (`FORMAT_NON_SERVI`, `OBJET_REQUIS`, `OBJET_INCONNU`, `<MODULE>_NOT_ENTITLED`). Délai : `EXPORT_C13_DELAI_MS` (60 s par
   défaut).
3. **Catalogue — `droitsEffectifs`** (comportement, forme inchangée) : un droit est effectif quand **un** des modules qui
   l'ouvrent est ouvert, par la règle d'auth (`MODULES_DU_PREFIXE` : `fiscalite:*` ⇐ `declarations` ou `fiscalite`) ; ailleurs,
   le préfixe, comme avant. Le contrat d'état publié (1.1.0, figé) ne change pas d'un octet : `droitsEffectifs` gagne des
   valeurs pour un cabinet qui n'ouvre que `declarations`.
4. **Catalogue — copies** : `contrat/copies/instance/` recopié à **`contrats-instance-v1.1`** (`d68a468`) :
   `instance-c13.openapi.json` 1.1.0, `export-c13-reponse.schema.json`, `export-c13-csv.cas.json` neufs dans la copie ;
   `ORIGINE.json` à l'étiquette neuve (D-953-15 refermée).
5. **Auth — `instance:donnees:exporter`** attribué par défaut à **`CAB_ASSOCIE`** (table d'accès du cabinet) et à
   **`DIST_DG`** (ajouts à l'annexe B, D-1131-5) ; code déjà dans le jeton (catalogue de tenant inchangé, borne inchangée).
- **Inchangés** : le contrat d'état publié (1.1.0, ses trois fichiers, Karapace), le manifeste `instance` (1.1.0 : aucune
  recopie), les topics, la garde partagée, le BFF, `moi-droits`, `identity.droits.changed@1`.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | L'export C13 d'`instance` rend ce que la partie A tient de l'organisation, et rien d'une autre ; JSON valide contre `export-c13-reponse@1` ; CSV aux huit cas du contrat à l'octet | unitaires (collections en mémoire, schéma du contrat rejoué) |
| AC-2 | Le moteur et le détenteur du droit y entrent ; un membre sans le droit, un membre d'une autre organisation, une autre identité de service sont refusés, nommés | e2e |
| AC-3 | L'Administration exporte un module installé, en `ESSAI_TERMINE` comme en `EN_SERVICE`, sous le jeton du moteur ; `NON_INSTALLE` refusé sans appel ; chaque panne nommée ; les refus du module relayés | unitaires, e2e avec un module doublé en HTTP |
| AC-4 | Avec `declarations` seul ouvert, `fiscalite:*` est dans `droitsEffectifs` ; `fiscalite` seul aussi ; aucun autre préfixe ne change | unitaires |
| AC-5 | L'associé du cabinet et le DG du distributeur portent `instance:donnees:exporter` dans leur jeton ; les autres rôles non | tests d'auth |
| AC-6 | Tests relancés par chemin, lint des fichiers touchés, build, mutations rouges sur assertion ; **Node 24, étage `verification` complet du catalogue** (rejoue aussi `12c4c84`, STORY-1137) | « Preuves » |
| AC-7 | Annoncé dans « ⚠ Contrats » avant la fusion ; C et D prévenus ; ligne « → A » | journal ; message |

## Décisions retenues par défaut (contestables)

- **D-1131-1 — Le premier incrément est l'export**, par la partie A, synchrone. AD-37 fera passer l'export par une
  commande (`POST /api/instance/v1/commandes`, `instance.commande.deposee`) exécutée par l'agent sur site (EPIC-148) ; sur
  l'hébergement de Money Vibes (les essais), la partie A appelle le module elle-même. La route neuve est ce premier pas : la
  commande la réemploiera. Le corps est lu en entier, puis relayé (pas de flux : un export d'essai reste petit ; le flux va
  avec la commande).
- **D-1131-2 — D-1128-9 tranché** : l'**export** d'`instance` est **servi** (point 1). `import` et `effacement` d'`instance`
  restent déclarés (le schéma du manifeste les exige) mais **ne seront jamais appelés** : `instance` naît par la naissance
  (chemin 0) et efface sa part lui-même, à la fin du plan (`proprietairesDe` le retire) ; les servir serait une porte de
  plus sans appelant. `sante` et `migrer` vont à **STORY-1133** (EPIC-148) : leur seul appelant est l'agent sur site (la
  supervision et la montée de version), qui n'existe pas encore. Aucune version neuve du manifeste.
- **D-1131-3 — D-979-47 : le correctif côté catalogue s'impose, sans attendre C.** Même quand C alignera les codes du
  manifeste `declarations` sur `fiscalite:declaration:*`, leur préfixe restera `fiscalite` et le module ouvert
  `declarations` : le filtre par préfixe les écarterait encore. La règle est celle d'auth (`MODULES_DU_PREFIXE`, STORY-902),
  copiée dans le catalogue avec un test qui la compare à celle d'auth quand le checkout voisin est là. La recopie du
  manifeste aligné de C reste à faire le jour venu (rien ne change pour lui).
- **D-1131-4 — D-1128-10 : les interrupteurs et `config` vont à STORY-1135.** `module.interrupteurs` (`code`, `allume`,
  `dateLimite`) se remplit depuis une décision de Money Vibes portée par l'état voulu (AD-22, EPIC-151) : aucune source
  n'existe aujourd'hui, et les manifestes ne déclarent que des noms. `config` (la configuration libre du droit) n'est pas un
  interrupteur : s'il faut le publier, ce sera un ajout facultatif 1.2.0, à décider avec la forme des interrupteurs, quand
  un consommateur le demandera. Aucun consommateur ne quitte `entitlement.changed` avant le 08/01 (chacun chez son
  propriétaire, double lecture d'abord) : figer une forme aujourd'hui, sous le gel, serait la figer sans lecteur.
- **D-1131-5 — Qui exporte par défaut** : l'**associé** du cabinet (il administre le cabinet ; `TENANT_ADMIN` du cabinet en
  dérive, donc le premier administrateur d'un essai de cabinet) et le **DG** du distributeur (ajout à l'annexe B, comme
  `commande:parametres:modifier`). Pas `DIST_ADMIN` : l'annexe B ne lui fait lire aucune donnée métier, et l'export les
  porte toutes. Une organisation peut l'attribuer à d'autres rôles (STORY-167). Question au PO (journal), défaut appliqué.
- **D-1131-6 — Le BFF ne change pas.** L'export est un geste du client, dans son instance (coque `instance`, chemin public
  `/api/instance/v1/…`) ; l'opérateur de Money Vibes n'est membre d'aucune organisation et n'exporte pas ses données. Un
  relais de console n'aurait aucun lecteur.
- **D-1131-7 — `essai` exporté sans adresses** : `destinataires` (l'adresse du prospect et celle du commercial de Money
  Vibes) et `avisEnvoyes` sont retirés de l'export ; le reste du fait d'essai (dates, prolongation, statut) est à
  l'organisation.
- **D-1131-8 — Nommé pour plus tard, avec la raison** :
  - le **rafraîchissement** (FR-10) : l'agent l'exécute (AD-15) ; écrit sans lui, il ne serait jouable par personne →
    STORY-1133 ou après, avec la commande `espace.rafraichir` ;
  - les **journaux pseudonymisés** (`instance.journal`, AD-12) : un topic et une enveloppe neufs au registre, pour tous les
    services ; plus gros que l'export, et sans lecteur avant l'agent → story à part (à placer par la session de groupe) ;
  - les **relectures** FR-35, étape 3 des droits hors du jeton, NFR-3, FR-12, FR-37, `libelle` dans l'émetteur : non
    relues ici (le temps est allé à l'export) → la prochaine story de B sur le catalogue ;
  - le **test de copie de la garde** dans `document-service` : dépôt tenu en ce moment par une autre sous-session de B
    (« j ») → la prochaine story de B sur ce dépôt ;
  - les **écrans** → A (ligne « → A »).

## Livraison (2026-11-27)

Fusionnées en « Rebase and merge », `mergedAt` non nul, `headRefOid` = SHA poussé, arbre de la branche identique à `dev` :
**platform-catalog-service #91** (tête `3dca258`, **`4d01a70` sur `dev`**) ; **prospera-auth-service #53** (tête `df1bcfc`,
**`c6b8e2b` sur `dev`**). Contrat annoncé avant la fusion : stories #1041 (`main` `71a3245`). Conforme à l'annonce, sans écart.

- **Catalogue** : `src/administration/` (`administration.module.ts`, `administration.controller.ts` : `InstanceC13Controller`,
  `AdministrationController` ; `export-de-l-instance.ts` : plan d'export, demande, Extended JSON relaxed ;
  `exports-de-l-administration.ts` : état publié, route du manifeste, adresse, jeton du moteur, relais ; `export-csv.ts` : les
  huit règles ; `refus.ts` : qui exporte) ; `src/etat-publie/droits-effectifs.ts` (`MODULES_DU_PREFIXE`, `modulesDuDroit`) ;
  `EtatPublieModule` exporte `LectureEtatPublie` ; `EXPORT_C13_DELAI_MS` (configuration, validation) ; `contrat/copies/instance/`
  à `contrats-instance-v1.1` (`ORIGINE.json`) ; `test/utils/rs256.ts` signe aussi un jeton d'identité de service ; README
  (« L'export par l'Administration »).
- **Auth** : `table-d-acces-cabinet.ts` (`instance:donnees:exporter` à l'associé), `table-d-acces-distributeur.ts` (ajout à
  l'annexe B, au DG) ; tests de la table du cabinet, du distributeur, de la résolution et du jeton signé.
- **BFF** : inchangé (D-1131-6).

### Preuves

- **Catalogue, Node 25** : `src/administration` **38/38** (export d'`instance` : objets, ordre, filtre, essai sans adresses,
  schéma `export-c13-reponse@1` rejoué ; refus de la demande avant toute lecture ; relais vers un vrai serveur HTTP : route
  déclarée, jeton du moteur, demande relayée, sept états ouverts, CSV à l'octet, refus du module relayés, cinq réponses hors
  contrat, 500, 401 qui fait oublier le jeton, sans adresse, sans jeton, route `POST`, injoignable, délai) ; `export-csv` : les
  **huit cas du contrat à l'octet** ; `droits-effectifs` 6/6 (la règle comparée à celle d'auth dans le checkout voisin) ; e2e
  `administration-exports` **12/12** par la vraie chaîne de gardes (RS256/JWKS) ; suite complète **1 849 passés / 1 850**, trois
  suites rouges connues (binding de Confluent) ; `tsc`, lint des fichiers touchés.
- **Catalogue, Node 24, étage `verification` complet** (archive de `3dca258`, Node v24.22.3) : **111/111 suites, 1 867 passés**
  (1 sauté), lint 0, build 0. Il rejoue aussi **`12c4c84`** (STORY-1137 : la garde du Dockerfile des jeux dans le checkout seulement
  — verte dans l'image) et `app-cablage.invariant` (`AppModule` monté avec le module neuf).
- **Mutations catalogue 17/17 tuées sur assertion** (sept réécrites au second tour : la première forme rougissait au
  compilateur, variable devenue inutilisée) : préfixe seul, `instance:*` filtré, essai avec adresses, sans filtre
  d'organisation, organisation inconnue exportée, `NON_INSTALLE` ouvert, `instance` appelé en HTTP, sans jeton du moteur,
  autre organisation admise, refus non relayés, jeton gardé après 401, droit non exigé, moteur d'une autre organisation,
  moteur partout, formules non neutralisées, délai lu comme injoignable, tout en 502.
- **Auth, Node 25** : 23 suites par chemin **409/409** ; `test/auth.e2e-spec.ts` **13/13** (jeton signé de l'associé :
  quatre droits fiscaux et `instance:donnees:exporter`) ; complète **1 469 passés / 1 470**, quatre suites rouges connues
  (binding de Confluent) ; lint ; **mutations 3/3** (associé sans l'export, collaborateur qui exporte, `DIST_ADMIN` au lieu du DG).
- **Pile `grp-b-recette` neuve, volumes neufs, images reconstruites après la fusion** (catalogue `4d01a70`, auth `c6b8e2b`,
  dossier `2f6e058`, notification `749b3cd`, paiement `64b5838`, BFF `7ac4db4`, recette `7999caf` ; kyc `9cef9cb`, balance
  `4f75f4e`, bilan `7f96163` depuis l'archive de leur `origin/dev` par une surcouche non versionnée, leurs checkouts n'étant pas
  à B ou pas sur `dev`) : `modules-dans-l-essai` **4/4** (non-régression de 1137) et un cas **ad hoc, non versionné** (ajouté
  à la suite pour la passe, retiré ensuite) qui joue la preuve sur le vrai backend, avec l'associée d'un essai entrée par son
  lien :
  - son jeton porte `["fiscalite:declaration:preparer", "…valider", "…deposer", "…regler", "instance:donnees:exporter"]` ;
  - `GET /api/v1/administration/{org}/exports/balance` sur le catalogue de l'essai : **200**, `export-c13-reponse@1` de
    `balance-essai` (appelé sous le jeton du moteur), `balances` 2 documents du jeu, rien d'une autre organisation ;
  - `…/exports/instance` : **200**, `organisation` 1, `naissances` 1, `offre` 1, `droits` 2, `installations` 3,
    `plans-installation` 1, `essai` 1 (sans l'adresse du commercial), le reste 0 ; `GET /api/v1/instance/instance/{org}/export`
    par le membre : **200** ;
  - `…/exports/stock` : **403 `MODULE_NON_INSTALLE`** ; l'organisation d'un autre essai : **403 `ORGANISATION_HORS_JETON`**.
  - Verrou **13:34 → 14:06** (une passe : l'étage `verification`, les fusions, la pile ; une première construction coupée par
    `ECONNRESET` de npm, relancée), `down -v`, aucun conteneur, volume ni réseau `grp-b` restant.
- **`ESSAI_TERMINE` sur la pile** : non joué (il faut avancer l'horloge de 30 jours) ; prouvé par les unitaires (sept états
  ouverts) et par la matrice (l'export ouvert partout sauf `NON_INSTALLE`, `etat-publie.contrat.spec`).

### Décisions ajoutées à la livraison

- **D-1131-9 — La preuve sur pile est un cas ad hoc, non versionné.** Écrire un cas de recette d'export est une story de la
  recette (dépôt hors de ce n° 13) ; le cas a été joué tel quel dans `modules-dans-l-essai` (qui fait naître l'associée) puis
  retiré. À versionner avec la recette des archives ou de la fin d'essai (D-1131-8).
- **D-1131-10 — Aucun message à A n'était requis par un contrat changé** ; la ligne « → A » du journal dit ce qui est
  débloqué (l'écran d'export de la coque `instance`), avec la route, les codes et la forme (types : `instance-c13.openapi.json`
  et `export-c13-reponse.schema.json` de `prospera-plateforme@contrats-instance-v1.1`).

## Hors de cette story

Tout écran (A) ; les routes C13 des modules (leurs propriétaires) ; la commande d'export de l'agent (EPIC-148) ;
`entitlement.changed` (inventaire de 1128).
