# STORY-1130 : Effacer le dossier de démonstration à la fin d'un essai (D-1082-10) — `dossier-service` propriétaire du socle dans le plan d'effacement

Status: in-progress — fiche écrite le 2026-11-27 par la sous-session du groupe B juste avant de coder (lot 7, n° 12 de B,
`coordination/PLAN-LOT-7-GROUPE-B-2026-11-25.md` §1, deuxième partie, ligne 12 ; identifiant réservé D-L7B-1).
**Avant le certificat d'essai** (plan §1).

**Dépôts :** `dossier-service` (`prospera-dossier-service`), `platform-catalog-service` (la partie A du moteur) · **Points :**
3 · **Dépend de :** STORY-953 (le plan d'effacement, les contrats C13, le certificat), STORY-1082 (le dossier de
démonstration créé par le moteur, D-1082-10), STORY-978 (le jeton du moteur par organisation) · **Suite :** STORY-1137 (12
bis, les modules ouverts dans l'essai), STORY-1131 (n° 13, restes d'EPIC-145 → 147 : export pendant `ESSAI_TERMINE`,
journaux pseudonymisés)
**Sources :** plan du lot 7 de B §1 (n° 12 : « effacer le dossier de démonstration à la fin d'un essai (D-1082-10) —
dossier, catalogue — avant le certificat d'essai — effacement complet d'un essai ») ; fiches STORY-1082 (D-1082-10 et « Ce
qui reste »), 953 (D-953-1 → 8, suite « e »), 1112, 1128 (« Inventaire », EPIC-147 : « Reste : effacer le dossier de
démonstration à la fin d'un essai (D-1082-10) → STORY-1130 »), 1129 ; `prospera-plateforme@contrats-instance-v1.1`
(`contrats/instance/effacement-c13-demande`, `-accuse`, `certificat-effacement`, `jeu-demonstration`) ; plan d'effacement
de balance (C, `plan-d-effacement.ts`, D-928-6 → 8, lu seulement) ; journal de B (pièges, « Suivante : STORY-1130 ») ;
journal de C (« → B (STORY-564 …) », servie ici) ; code sur `origin/dev` : dossier `645a699`, catalogue `e528afc`.

---

## Pourquoi

À la fin d'un essai, le moteur efface l'organisation chez chaque **propriétaire** de ses données (C13, point 7 ; AD-38),
puis signe un certificat qui les nomme. Depuis STORY-1082, le **dossier de démonstration** (son identité, ses exercices,
ses axes, son journal) vit dans `dossier-service`, qui n'est pas un module du catalogue : le moteur ne l'appelait pas, et
le dossier restait après l'effacement (D-1082-10, dette nommée). Le certificat d'un essai disait donc l'organisation
effacée alors que ses dossiers restaient — dont tout dossier que le prospect a créé pendant l'essai.

## Ce qui existait (relu avant la fiche)

- **Catalogue** (`src/essai/effacement/`, STORY-953) : un plan idempotent par organisation ; les **propriétaires** sont les
  modules de l'organisation (installations hors `NON_INSTALLE`, droits, parts du jeu), moins `instance` ; chacun est
  appelé à la route `routesInstance.effacement` **de son manifeste**, à l'adresse d'`INSTALLATION_SERVICES`
  (`AppelsC13ParHttp`), sous le jeton du moteur de l'organisation (STORY-978) ; un module sans route est `SANS_ROUTE` ;
  un propriétaire qui n'accuse pas laisse le plan `EN_COURS` (aucun certificat, D-953-4) ; puis la part de la partie A
  (axe 2 `DESINSTALLE`, essai `EFFACE`), puis le certificat (`certificat-effacement@1`, `module` libre).
  `INSTALLATION_SERVICES` dit aussi, depuis STORY-1129, quels modules « le moteur sait vérifier ».
- **`dossier-service`** : aucune route d'effacement ; les routes du moteur (STORY-1082) sont gardées par
  `@AdmetIdentitesDeService('MOTEUR')` et `GardeDuMoteurEnEssai` (identité, organisation du chemin, espace d'essai avant
  le corps), hors du gate d'accès au dossier (l'exception nommée par l'invariant de STORY-363). Le service tient de
  chaque organisation : `dossiers`, `dossiers_journal` (**append-only tenu par le schéma** : tout `deleteMany` Mongoose
  lève), `exercices`, `decisions_axes`, `liens_participation`, `perimetres_arretes`, `verrous_participations`,
  `activite_lectures`, les copies des voisins (`etats_balance_dossier`, `etats_liasse_dossier`, `org_members`,
  `org_droits`, `etats_publies_cabinet`, `orgkycstatuses`), ses messages sortants (`outbox_events`, clef de partition =
  l'organisation **ou** le dossier, `payload.orgId` toujours), et les noms des personnes (`identity_users`, par `userId`).
  Aucune copie des contrats C13 ; pas d'Ajv.
- **Balance** (C) sert déjà `POST …/instance/balance/{org}/effacement` : plan d'effacement + invariant sur tous les
  schémas, registre `instance_c13_effacements`, `DEJA_EFFACE` au rejeu, 422 `SCHEMA_NON_CONFORME` / `MOTIF_NON_SERVI`, 400
  `ORGANISATION_INCOHERENTE`. Patron repris.
- **Paquet fiscal embarqué** de `dossier-service` (`src/modules/portefeuille/echeance/assets/paquet-fiscal-togo-2026.json`) :
  `e8e94c84…`, gardé par sa sha256 (lecture paresseuse) ; le service n'en lit que `_meta.consommateurs` et
  `acomptesProvisionnels.echeances` ; aucune règle `.gitattributes` (le piège des 9 suites rouges en CRLF).

## Ce qui doit être vrai à la fin

| # | Exigence | Preuve |
|---|---|---|
| AC-1 | `POST /api/v1/instance/dossier/{organisationId}/effacement` (`effacement-c13-demande@1` → `effacement-c13-accuse@1`, module `dossier`) : moteur seul, organisation du chemin, espace d'essai seulement (403 avant le corps) ; `FIN_ESSAI` seulement (422 `MOTIF_NON_SERVI`) ; 422 `SCHEMA_NON_CONFORME`, 400 `ORGANISATION_INCOHERENTE` ; rien d'effacé sur un refus | unitaires ; e2e ; pile |
| AC-2 | Le service efface **tout** ce qu'il tient de l'organisation (plan d'effacement couvert par un invariant sur tous ses schémas, collections sans organisation nommées), journal append-only compris (par le pilote), messages sortants par `payload.orgId`, la personne dont c'était la dernière appartenance ; les autres organisations intactes | unitaires ; pile |
| AC-3 | Rejouée : `DEJA_EFFACE` avec la date et le décompte du premier effacement (registre `effacements_c13`) ; des données revenues : `EFFACE` | unitaires ; pile |
| AC-4 | Le catalogue compte `dossier` parmi les propriétaires de **chaque** essai, **en tête**, à la route C13 qu'il fixe (aucun manifeste), à l'adresse de `SOCLE_SERVICES` (jamais `INSTALLATION_SERVICES`) ; sans adresse ou injoignable : plan `EN_COURS`, aucun certificat ; un plan ouvert avant la livraison gagne le socle | unitaires ; e2e ; pile |
| AC-5 | Le certificat nomme `dossier` (contrat `certificat-effacement@1` inchangé), signé ; l'ordre rejoué rend le même | unitaires ; pile |
| AC-6 | Le paquet fiscal Togo 2026 recopié à l'octet de balance-service (← C), en LF, gardé par `.gitattributes` ; ce que le service lit est inchangé | unitaires (Node 25 et Node 24, archive LF) |
| AC-7 | Tests relancés par chemin, lint des fichiers touchés, build, mutations rouges sur une assertion ; Node 24 (étage `verification`) ; `docker compose up` sain | « Preuves » |

## Décisions (recommandations appliquées, contestables)

- **D-1130-1 — `dossier-service` est un propriétaire DU SOCLE du plan d'effacement**, pas un module : il n'a ni manifeste, ni
  installation, ni droit. Le catalogue le nomme dans `PROPRIETAIRES_DU_SOCLE` (`appels-c13.ts`) avec **sa route C13, fixée
  par le moteur** (`POST /api/v1/instance/dossier/{organisationId}/effacement`), et lit son adresse dans une variable neuve,
  **`SOCLE_SERVICES`** (même forme qu'`INSTALLATION_SERVICES` : `dossier=http://dossier-service:3009`). Pas dans
  `INSTALLATION_SERVICES` : depuis STORY-1129 cette liste dit aussi quels modules « le moteur sait vérifier », et le socle
  n'est ni installé ni vérifié. Un module n'est jamais cherché dans `SOCLE_SERVICES`, ni le socle dans
  `INSTALLATION_SERVICES`.
- **D-1130-2 — Le socle est propriétaire de chaque essai, en tête du plan.** Toute organisation de l'espace a des données
  dans `dossier-service` (« Mon cabinet », ses membres, ses copies des voisins), qu'elle ait un jeu ou non. En tête : son
  outbox part la première, et plus aucun fait sur ses dossiers ne part vers un module qui s'efface ensuite. Un module qui
  porterait le même nom ne le dédouble pas.
- **D-1130-3 — Sans adresse, ou injoignable : le plan attend.** `SERVICE_NON_CONFIGURE` (détail : `SOCLE_SERVICES`) ou
  `SERVICE_INJOIGNABLE` ⇒ `NON_EFFACE`, plan `EN_COURS`, aucun certificat, la part de la partie A n'est pas jouée (D-953-4)
  ; la file, le démarrage ou l'ordre suivant rejouent. Pas de refus au démarrage du catalogue : une pile sans essai, ou la
  recette, n'a pas à le régler ; le plan le dit.
- **D-1130-4 — Un plan ouvert avant la livraison gagne le socle**, en tête (`avecLeSocle`), tant que la part de la partie A
  n'est pas jouée (`effaceLe` absent), sous le bail de l'exécuteur. Un plan dont la partie A a effacé sa part est figé : rien
  n'y est ajouté (son certificat est signé, ou attend seulement sa clé). Les essais déjà effacés avant cette story gardent
  leurs dossiers dans `dossier-service` : aucun rattrapage automatique (le plan fini ne se rouvre pas, son certificat est
  signé) ; un appel de l'effacement C13 de `dossier-service` par l'exploitation, sous le jeton du moteur, les effacerait.
- **D-1130-5 — `dossier-service` efface TOUT ce qu'il tient de l'organisation**, pas seulement le dossier de démonstration :
  le contrat C13 dit « TOUT » (données, copies des voisins), et un prospect peut avoir créé ses propres dossiers pendant
  l'essai. Le **plan d'effacement** (`plan-d-effacement.ts`) est gardé par un invariant qui lit tous les `*.schema.ts`
  (patron de balance, D-928-7), **plus strict** : une collection sans champ d'organisation doit être nommée dans
  `SANS_ORGANISATION` avec ce que l'effacement en fait (les tables de déduplication `processed_*` n'ont rien de
  l'organisation).
- **D-1130-6 — Le journal du dossier s'efface par le pilote**, et c'est la seule exception à son append-only, visible dans
  `EffaceurMongo` (comme la marche arrière de migration) ; il n'est pas pseudonymisé : l'organisation d'un essai disparaît
  en entier (patron de D-928-8). La pseudonymisation des journaux d'instance (AD-12, `instance.journal`) reste à STORY-1131.
- **D-1130-7 — Les personnes** (`identity_users`, sans organisation) : effacées quand l'organisation effacée était leur
  dernière appartenance (lue avant l'effacement des appartenances) ; une personne encore membre ailleurs reste.
- **D-1130-8 — Les messages sortants s'effacent par `payload.orgId`** : leur clef de partition est l'organisation
  (`dossier.*`, périmètre) ou le dossier (exercices, axes), mais chaque fait porte l'organisation.
- **D-1130-9 — Espace d'essai et fin d'essai seulement ; codes et statuts de balance.** La garde des routes du moteur
  (STORY-1082) juge identité, organisation et espace **avant le corps** ; le service le redit. `FIN_CONTRAT` : 422
  `MOTIF_NON_SERVI` (la fin d'un contrat du réel n'est pas servie). 422 `SCHEMA_NON_CONFORME` (les écarts nommés dans
  `details.erreurs`), 400 `ORGANISATION_INCOHERENTE` : le moteur reçoit les mêmes codes de tous les services. La fabrique de
  refus du service gagne `nonTraitable` (422, `error: 'Unprocessable Entity'`) ; les trois codes entrent à l'inventaire du
  module `demonstration` (exhaustivité de STORY-375).
- **D-1130-10 — La demande est jugée par le schéma copié lui-même.** `effacement-c13-demande@1` et `-accuse@1` sont copiés à
  l'octet de `prospera-plateforme@contrats-instance-v1.1` dans `src/vendor/contrats-instance/` (`-text`, `ORIGINE.json`,
  empreintes testées) ; le service n'a pas d'Ajv : un petit juge (`contrat-effacement.ts`) applique les mots-clés de ces
  schémas plats et fermés, et un test rougit si un schéma recopié demain en emploie un autre. L'accusé est jugé par son
  schéma dans les tests.
- **D-1130-11 — Le registre `effacements_c13`** (organisation, clef d'idempotence, date, décompte ; exclu du plan) : rejouée,
  la demande rend `DEJA_EFFACE` avec la date et le décompte du premier ; des données revenues entre deux ordres sont
  effacées et dites `EFFACE` ; un premier ordre sur une organisation vide rend `EFFACE`, 0.
- **D-1130-12 — Aucun fait publié par l'effacement** (ni `dossier.deleted`) : chaque propriétaire efface ses propres copies
  (balance ses projections du dossier, D-928-7). Ce qui arrive **après** l'accusé — l'état publié `DESINSTALLE` que la
  partie A recalcule à la fin du plan, projeté dans `etats_publies_cabinet` et `org_droits` — est un fait du moteur, sans
  donnée du prospect ; il reste. Nommé, comme pour balance.
- **D-1130-13 — Le paquet fiscal de STORY-564 recopié ici** (← C, servie) : `balance-service` `origin/dev` **`61997fd`**
  (#173, STORY-339), sha256 **`62563b3c…5e94415`** (relu juste avant la copie : aucune version plus récente), par `git -c
  core.autocrlf=false show`, en LF ; `.gitattributes` gagne `src/modules/portefeuille/echeance/assets/** -text` (fin du
  piège des 9 suites rouges) ; l'empreinte reportée dans `paquet-fiscal.util.ts`. Rubriques ajoutées seulement (IRPP, CNSS,
  `coherence`, `rapprochementAnnuel`, `continuite`, `basesLegales`) ; `_meta.consommateurs` nomme toujours
  `dossier-service` et `acomptesProvisionnels.echeances` est identique : aucun comportement ne change.
- **D-1130-14 — Aucun contrat publié ne change de forme.** `certificat-effacement@1` et `essai-prospect.openapi.json`
  (`proprietaires[].module`, chaîne libre) gardent leurs octets ; la valeur `dossier` y apparaît. Le contrat d'état publié
  (figé, STORY-1128) n'est pas touché. Le BFF relaie le plan champ par champ (`module` libre) : inchangé.
- **D-1130-15 — La recette n'est pas touchée** : aucune recette ne joue l'effacement d'un essai jusqu'au certificat ; celle
  qui le jouera (le certificat d'essai, ou STORY-1131) pose `SOCLE_SERVICES` sur le catalogue de l'essai. Le gabarit de
  déploiement de l'essai, `.env.essai.example`, le pose (et `espace-essai.spec.ts` le garde).

## Contrats touchés (annoncés dans « ⚠ Contrats » avant la fusion)

- **`dossier-service`** : route neuve `POST /api/v1/instance/dossier/{organisationId}/effacement` (moteur seul, essai seul),
  corps `effacement-c13-demande@1` → `effacement-c13-accuse@1` (module `dossier`) ; refus 403 `IDENTITE_DE_SERVICE_REQUISE`,
  `ORGANISATION_HORS_JETON`, `ESPACE_REEL_REFUSE`, `IDENTITE_DE_SERVICE_REFUSEE`, 401, 422 `SCHEMA_NON_CONFORME`,
  `MOTIF_NON_SERVI`, 400 `ORGANISATION_INCOHERENTE`. Aucun événement neuf ni changé. Paquet fiscal embarqué recopié.
- **`platform-catalog-service`** : variable neuve **`SOCLE_SERVICES`** (facultative) ; le plan d'effacement compte
  `dossier` en tête de chaque essai (valeur neuve de `proprietaires[].module` et du certificat, forme inchangée).

## Hors de cette story

- La recette de l'effacement d'un essai jusqu'au certificat (D-1130-15) ; l'export pendant `ESSAI_TERMINE` et les journaux
  pseudonymisés (STORY-1131) ; la fin d'un contrat du réel (`FIN_CONTRAT`) chez `dossier-service`.
- Les autres services du socle qui tiendraient des données d'un essai (auth : ses comptes ; kyc ; notification, document) :
  `PROPRIETAIRES_DU_SOCLE` les recevra quand chacun servira sa route C13 (à nommer par STORY-1131).
