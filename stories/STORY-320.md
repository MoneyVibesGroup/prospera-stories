# STORY-320 : Les bases fiscales viennent de la balance — rien ne se ressaisit, et ce qui manque se nomme

Status: in-progress — **Fiche écrite le 2026-11-24** par la session du groupe A (lot 6, n° 6 de la ligne de A : plan
amendé le 24/11, #769). Il n'existait pas de fiche : les critères viennent de `epics-fiscalite-2026-08-03.md`
(EPIC-031), la règle « rien ne se ressaisit pour la déclaration du mois » de la salle des cabinets (V3,
`salle-cabinets-validations-2026-11-19.md`).

**Service :** `prospera-fiscal-service` (tenu par A jusqu'à la fusion de 328, puis rendu à C) ; `balance-service` est LU
seulement (tenu par C) · **Points :** 5 · **Epic :** EPIC-031 · **Après :** STORY-323 (le cycle de vie, #54) ·
**Suite :** STORY-322 (le triplet), 328 (anomalies) ; STORY-321 (le calcul délégué au moteur de `balance-service`)

---

## Le fait

Une obligation fiscale naît `A_PREPARER` et le cabinet la « prend en charge » (STORY-323). Mais rien ne dit **d'où
viendront ses chiffres** : le service ne lit nulle part la balance du dossier. Le cabinet qui prépare la déclaration du
mois devrait ressaisir ce que la comptabilité a déjà produit — et, pis, **ne saurait pas** qu'il prépare sur une
balance absente, rejetée ou encore en brouillon.

## Ce que le code porte déjà (lu sur `origin/dev`, cb672c5 ; `balance-service` 0ff2402)

| Pièce | Ce qu'elle porte | Où |
|---|---|---|
| La prise en charge | `A_PREPARER → EN_PREPARATION` (droit `preparer`), comparaison-échange, audit dans la même transaction | `cycle-obligations.service.ts`, `registre.transitionner` |
| Le blocage du redevable | `blocage` lu à la lecture (mandat absent d'un redevable personne physique, 563), jamais pour l'entreprise | `application/obligations/blocages.ts` |
| La lecture amont | un port + un adaptateur HTTP qui transmet le jeton de l'appelant, `404/403 → introuvable`, `429/5xx → 503`, corps borné | `adapters/http/lecture-amont.ts` |
| `montantAttendu` | toujours `null` : aucun moteur ne l'alimente (c'est 321) | `obligation.schema.ts` |
| La balance | `GET /api/v1/dossiers/{dossierId}/balances?etat=&limit=` : `id`, `version`, `etat` (`BROUILLON` \| `VALIDÉE` \| `REJETÉE`), `statutPreuve`, `exercice {debut, fin}`, `checksum`, `devise`, `origine?`, `sommaire.estEquilibre`, `horodatageValidation?` | `balance-service`, `BalanceResponseDto` |

**Ce que `balance-service` ne sert pas** : un résumé léger par exercice (la liste renvoie les lignes de chaque balance).
Ce n'est pas bloquant (D-320-5) ; recommandation à C notée au journal, sans urgence.

## Critères d'acceptation

Ceux de l'épic, tels quels :

1. **Étant donné** une balance validée pour l'exercice **quand** je prépare une déclaration **alors** ses bases sont
   alimentées sans ressaisie.
2. **Étant donné** une période sans balance exploitable **quand** je prépare la déclaration **alors** l'obligation est
   marquée bloquée **et** le message nomme précisément ce qui manque.
3. **Étant donné** une balance en brouillon plutôt que validée **quand** elle alimente une déclaration **alors** la
   déclaration porte la mention du statut de preuve de sa source.

## Décisions (D-320-n) — prises le 2026-11-24, contestables

- **D-320-1 — 320 seule ; 321 n'est PAS nécessaire.** « Alimenter les bases » veut dire : **lier l'obligation à la
  balance qui la fonde** (identifiant, version, état, statut de preuve, empreinte, exercice, devise), jamais en copier
  les lignes ni en tirer un montant. Le calcul reste au seul endroit qui en a la charge (`balance-service`, AD-1) et se
  fera par un port en 321, qui lira la balance **par cette référence**. `montantAttendu` ne bouge pas. Aucun second
  moteur fiscal : le domaine de 320 n'implémente aucune règle d'imposition.
- **D-320-2 — Le point d'ancrage est la prise en charge.** À `A_PREPARER → EN_PREPARATION`, le service résout les bases.
  Alimentées ou provisoires : elles sont posées dans **la même transaction** que la transition et son audit.
  Bloquées : la transition est refusée (`409 BASES_FISCALES_BLOQUEES`, avec le manque nommé) **et le constat du blocage
  est écrit** (transaction + audit) pour que le calendrier le montre. L'obligation reste `A_PREPARER`.
- **D-320-3 — Qui est concerné.** Les obligations de **l'entreprise** (la balance est celle de la société du dossier).
  Une obligation d'un redevable personne physique (563) n'a pas de balance d'entreprise : `basesFiscales` reste `null`
  et sa prise en charge est inchangée.
- **D-320-4 — La date de référence et l'exercice.** On cherche les balances du dossier dont l'exercice **contient la
  date de référence** de l'obligation : le dernier jour de la période pour `AAAA-MM` et `AAAA-Tn`, le 31/12 de l'année
  pour `AAAA`, `AAAA-Pn` et `AAAA-En` (dont on ne sait pas la fin sans le calendrier de l'exercice). Comparaison par le
  jour UTC. Une balance se rapproche **par ses bornes**, jamais par un identifiant d'exercice supposé (`exerciceId` est
  facultatif chez `balance-service`). Les exercices décalés (non calendaires) sont couverts pour `AAAA-MM` et `AAAA-Tn`,
  approximés pour les périodes annuelles : écart nommé, repris par la story qui ouvrira le calendrier d'exercice.
- **D-320-5 — Quelle balance.** Exclues : les socles d'ouverture (`origine: A_NOUVEAUX`, ce ne sont pas des mouvements)
  et les balances provisionnées (`PROVISIONS_FISCALES` : elles contiennent la charge d'impôt que l'on va justement
  calculer, une base ne peut pas contenir son propre résultat). Parmi le reste : **la plus haute version validée**
  équilibrée ; à défaut, **la plus haute version en brouillon** équilibrée ; à défaut, le blocage. Lecture en deux
  appels filtrés (`etat=VALIDÉE`, puis `etat=BROUILLON` seulement si la première n'a rien donné), plafond 50 chacun ;
  un troisième (`etat=REJETÉE`) ne sert qu'à dire pourquoi on bloque.
- **D-320-6 — Trois états des bases.** `ALIMENTEES` (balance validée), `PROVISOIRES` (balance en brouillon : AC-3 — la
  mention du statut de preuve de la source est dans `source.etat` et `source.statutPreuve`), `BLOQUEES`. **Un brouillon
  ne bloque pas** : le cabinet prépare, il est prévenu. Ne pas confondre `statutPreuve` (justifiée, partiellement
  estimée, majorité estimée — la solidité des lignes) et `etat` (validée ou non).
- **D-320-7 — Le manque se nomme.** Quatre codes, un message en clair qui dit quoi faire :
  `BALANCE_ABSENTE` (aucune balance ne couvre le 31/03/2026 : la déposer ou l'importer, puis la valider),
  `BALANCE_REJETEE` (la seule balance couvrant la date est rejetée : la corriger ou en déposer une nouvelle version),
  `BALANCE_DESEQUILIBREE` (la balance n'est pas équilibrée : aucun chiffre fiable à en tirer),
  `BALANCE_NON_LISIBLE` (le module Balance n'est pas ouvert à ce cabinet, ou le dossier n'y est pas connu : `403` et
  `404` de l'amont se confondent, comme partout dans ce service — anti-énumération).
- **D-320-8 — Ordre des vérifications** (celui de 323, la prise en charge s'y ajoute en dernier) : portée, droit de la
  cible, gardes d'état (écartée, redevable bloqué), cycle (`TRANSITION_NON_PREVUE` sans appeler l'amont), **puis** les
  bases. Un refus de droit ou de cycle ne déclenche donc aucune lecture de la balance.
- **D-320-9 — L'amont indisponible est explicite et retentable, sans rien écrire.** Délai, `429`, `5xx` :
  `503 SERVICE_AMONT_INDISPONIBLE` (le refus existant), ni transition ni constat. Une réponse illisible : `502`.
  (C'est l'AC-3 de 321, tenu dès maintenant puisque c'est le même appel.)
- **D-320-10 — Une route pour revérifier, sans bouger l'obligation.** `POST /api/v1/obligations/{id}/bases` : relit la
  balance et écrit le constat (« j'ai validé la balance, je revérifie »). Droit `preparer`. Permise aux seuls états
  `A_PREPARER` et `EN_PREPARATION` (au-delà, la base est celle du contrôle et du visa : `409 BASES_NON_ACTUALISABLES`).
  **Un blocage n'est pas une erreur ici** : la réponse est `200` avec `basesFiscales.statut = BLOQUEES` ; seule la
  prise en charge refuse. Même résolution, même constat, même audit que la transition.
- **D-320-11 — Un constat, pas un état du cycle.** `basesFiscales` ne touche jamais `statut` (AD-17) ; une
  re-dérivation ne l'efface pas (champ humain, absent à la création). Un blocage des bases n'a pas de nouvel état : le
  calendrier lit `basesFiscales.statut`. Le champ `blocage` de 563 (redevable) garde son sens et son nom.
- **D-320-12 — Audit.** Acte `OBLIGATION_BASES_CONSTATEES`, contenu `{ statut, balanceId, version, etat, manque }`
  (`manque` : le code seulement). Aucune donnée personnelle, aucun montant. Écrit dans la même transaction que le champ.
  À la prise en charge réussie, la transition garde son acte `OBLIGATION_TRANSITION` inchangé ; le constat a le sien.
- **D-320-13 — Aucun événement, ni consommé ni publié.** Le constat est celui **de la dernière tentative** (`constateLe`) :
  valider la balance ne débloque pas toute seule l'obligation, le cabinet revérifie (D-320-10) ou prend en charge. Un
  consommateur de `balance.validated` qui revérifierait seul est possible plus tard, sans rien casser (un topic sans
  lecteur est de la dette, D-323-11). **Conséquence dite** : la preuve de bout en bout porte sur l'HTTP, pas sur Kafka.
- **D-320-14 — Le jeton de l'appelant, aucune identité machine** (comme `bilan-service`, 537) ; adresse lue une fois au
  démarrage : `BALANCE_SERVICE_URL`, défaut `http://balance-service:3007`. Corps borné à 16 Mo.
- **D-320-15 — Ce que 320 ne fait pas, et à qui le laisse-t-on.** Une base provisoire n'empêche pas le visa de
  l'associé : **STORY-328** (anomalies : gravité, blocage, levée motivée) y mettra l'anomalie `BASE_PROVISOIRE`.
  Le rapprochement balance/liasse est STORY-1101 (C). Le calcul est 321. Le triplet calculé/déclaré/payé est 322 : il
  lira `source` pour dire **sur quelle balance** le calculé a été produit.

## Contrat annoncé avant le code (2026-11-24)

**Ajouts seuls** dans `prospera-fiscal-service` : aucun champ, route ni topic renommé ; **aucun droit neuf** (`preparer`
suffit : manifeste `declarations` et catalogue d'auth inchangés) ; aucun événement Kafka.

- **Champ neuf, facultatif, sur `ObligationResponseDto`** (calendrier, fiche, retours de `transition` et de `bases`) :
  `basesFiscales` — `null` tant que rien n'a été constaté, et pour une obligation d'un redevable personne physique ;
  sinon :
  ```
  { statut: 'ALIMENTEES' | 'PROVISOIRES' | 'BLOQUEES',
    constateLe: ISO,
    source: { balanceId, version, etat: 'VALIDEE' | 'BROUILLON', statutPreuve, checksum, devise,
              exercice: { debut, fin }, origine: string | null, valideeLe: ISO | null } | null,
    manque: { code: 'BALANCE_ABSENTE' | 'BALANCE_REJETEE' | 'BALANCE_DESEQUILIBREE' | 'BALANCE_NON_LISIBLE',
              message: string } | null }
  ```
  `source` est non nul sauf `BLOQUEES` ; `manque` est non nul seulement si `BLOQUEES`. **→ D (FE-081)** : types à
  régénérer ; afficher « Brouillon » et le statut de preuve quand `PROVISOIRES`, le `manque.message` tel quel quand
  `BLOQUEES`.
- **Route neuve** : `POST /api/v1/obligations/{id}/bases`, sans corps, réponse **200** : l'obligation (avec
  `basesFiscales`). Droit `fiscalite:declaration:preparer`. Refus : `403 DROIT_FISCAL_REFUSE`, `404
  OBLIGATION_INTROUVABLE`, `409` `OBLIGATION_DESACTIVEE`, `BASES_NON_ACTUALISABLES` ; `503 SERVICE_AMONT_INDISPONIBLE` ;
  `502 BALANCE_AMONT_INVALIDE`.
- **Route existante, comportement ajouté** : `POST /api/v1/obligations/{id}/transition` avec `vers: EN_PREPARATION` sur
  une obligation `A_PREPARER` de l'entreprise : alimente les bases ; **nouveau refus `409 BASES_FISCALES_BLOQUEES`**
  (détails `{ manque: { code, message } }`) ; 503 / 502 comme ci-dessus. Les autres transitions ne changent pas d'un
  octet.
- **Champ de base neuf** : `basesFiscales` sur la collection `obligations` (humain, absent ⇒ `null`, aucune reprise de
  données). **Journal chaîné** : acte neuf `OBLIGATION_BASES_CONSTATEES`.
- **Configuration neuve** : `BALANCE_SERVICE_URL` (facultative, défaut `http://balance-service:3007`) ; l'audience
  `balance-service` doit figurer dans le jeton de l'appelant (déjà celle de l'IdP racine).
- **Lu chez `balance-service`, rien d'écrit** : `GET /api/v1/dossiers/{dossierId}/balances?etat=…&limit=50`. Aucune
  demande à C pour la story. Recommandation non bloquante : une lecture résumée par exercice (sans lignes).
- **Rien d'autre ne change** : `depots`, le cycle de 323, le blocage de 563, `montantAttendu` restent à l'octet.

## Preuves attendues

Unitaires (`-w 2`) du domaine (date de référence, choix de la balance, trois états, quatre manques), du service
(ordre des vérifications, aucun appel amont sur un refus de droit ou de cycle, 503 sans écriture) et de l'adaptateur
(lecture stricte, 404/403 → `BALANCE_NON_LISIBLE`, 5xx → 503) ; `test:conformite` sur `mongo:7` en jeu de répliques
(constat + audit dans la même transaction, comparaison-échange, une re-dérivation n'efface pas `basesFiscales`, la
prise en charge pose bases et état ensemble) ; e2e ; mutations qui rougissent sur l'assertion ; `docker compose up` du
service, qui démarre, et les routes neuves rendent `401` sans jeton. **Pas de preuve Kafka** (aucun événement, D-320-13) ;
l'adaptateur est éprouvé contre un faux serveur HTTP au contrat lu dans `BalanceResponseDto`. Une pile avec
`balance-service` réel n'est levée que si le poste le permet : l'écart, s'il y en a un, s'écrit dans le journal.

## Hors périmètre

Le calcul des montants (321) ; le triplet (322) ; les anomalies et leur levée (328) ; le rapprochement avec la liasse
(1101) ; le calendrier d'exercice pour les exercices décalés ; tout événement ; l'écran (FE-081).

## Progress Tracking

| Date | Événement |
|---|---|
| 2026-11-24 | Fiche écrite, contrat annoncé (PR de docs) avant le code. |
