# STORY-328 : Les anomalies d'une obligation — une gravité, ce qui bloque, et la levée qui se motive

Status: done — **Livrée le 2026-11-24** : prospera-fiscal-service **#57** (`0596fc4` sur `dev`, premier commit `046be0f`), contrat annoncé avant le code (prospera-stories #830). **Fiche écrite le 2026-11-24** par la session du groupe A (lot 6, n° 8 de la ligne de A : plan
amendé le 24/11, #769). Il n'existait pas de fiche : les critères viennent de `epics-fiscalite-2026-08-03.md`
(EPIC-031, STORY-328), FR-F65 et FR-F66 du PRD fiscalité, et ce que lira STORY-1101 (C).

**Service :** `prospera-fiscal-service` (tenu par A jusqu'à la fusion de 328, **puis rendu à C**) · **Points :** 3 (le
tracker) · **Epic :** EPIC-031 · **Après :** STORY-322 (le triplet, #56, `990256a`) · **Suite :** STORY-326 (contrôles
intra-période, C), STORY-1101 (C), 327 ; l'écran du dossier de dépôt est FE-081.

---

## Le fait

Trois stories ont laissé des constats que **personne ne nomme ni ne pèse** : une base provisoire (320, D-320-15), un écart
sans motif et un déclaré absent après le dépôt (322). Tout est au même niveau, et rien n'empêche l'associé de viser une
obligation qui repose sur une balance en brouillon. Le cabinet ne distingue pas **ce qui empêche de valider** de **ce qui
mérite un regard** (FR-F65), et une exception acceptée ne laisse aucune trace de qui l'a acceptée ni pourquoi (FR-F66).
STORY-1101 (C) lèvera des anomalies de rapprochement : il lui faut un endroit où les poser, un refus qui les respecte, et
une levée motivée qui figure au dossier de contrôle.

## Ce que le code porte déjà (lu sur `origin/dev`, `990256a`)

| Pièce | Ce qu'elle porte | Où |
|---|---|---|
| Les signaux, sur l'obligation | `triplet.ecarts.motifRequis`, `triplet.declare === null` à partir de `DEPOSEE`, `triplet.calcule.indisponible`, `basesFiscales.statut === 'PROVISOIRES'` | `domain/obligations/triplet.ts`, `bases-fiscales.ts` |
| Le refus du motif au visa | `409 MOTIF_ECART_REQUIS` à `A_VALIDER → VALIDEE` : **déjà un refus**, 328 ne le double pas | `verifierMotifAuVisa` |
| Le cycle et ses gardes | onze états, droit de la cible, `OBLIGATION_DESACTIVEE`, `OBLIGATION_BLOQUEE` (le redevable, 563) | `cycle-obligations.service.ts` |
| Le patron d'écriture | comparaison-échange sur l'état + audit dans la **même** transaction | `mongo-registre-obligations.ts` |
| Les champs humains | `visa`, `montantDeclare`, `montantPaye`, `basesFiscales` : jamais touchés par une dérivation (AD-17) | `obligation.schema.ts` |

**Deux mots pour deux choses.** Le `blocage` d'une obligation (563) est celui de son **redevable** (mandat manquant) ; la
gravité `BLOQUANTE` d'une anomalie est celle d'un **constat sur l'obligation**. Les deux coexistent, aucun ne remplace
l'autre, et le refus de l'un porte un autre code que le refus de l'autre.

## Critères d'acceptation

Ceux de l'épic, tels quels :

1. **Étant donné** une anomalie **quand** elle est levée par le système **alors** elle porte une gravité, une explication
   en langage clair et l'action attendue.
2. **Étant donné** une anomalie bloquante non traitée **quand** la validation est tentée **alors** elle est refusée.
3. **Étant donné** une anomalie levée par un utilisateur **quand** aucun motif n'est fourni **alors** la levée est
   refusée ; **quand** un motif est fourni **alors** elle est journalisée et apparaît au dossier de contrôle.

## Décisions (D-328-n) — prises le 2026-11-24, contestables

- **D-328-1 — Une anomalie est un constat LU ; seule sa levée s'écrit.** Rien n'est écrit quand le système « constate » :
  l'anomalie se **calcule à la lecture** à partir des signaux de l'obligation, comme le triplet (322) et le blocage de
  redevable (563). Elle ne peut donc ni se périmer ni diverger de ce qu'elle décrit : une base qui devient validée fait
  disparaître `BASE_PROVISOIRE` sans qu'aucun code ne pense à la retirer. La **levée** est un champ HUMAIN
  (`leveesAnomalies`), posé par sa seule route, jamais par une dérivation (AD-17).
- **D-328-2 — Deux gravités.** `BLOQUANTE` (empêche une étape du cycle) et `AVERTISSEMENT` (mérite un regard, n'empêche
  rien). Pas de troisième niveau : « information » est déjà ce que dit le triplet.
- **D-328-3 — Le catalogue de départ : quatre constats, tous lus sur l'obligation.**

  | Code | Quand | Gravité | Étapes refusées | Levable | Explication → action |
  |---|---|---|---|---|---|
  | `BASE_PROVISOIRE` | `basesFiscales.statut = PROVISOIRES` | `BLOQUANTE` | `VALIDEE` | oui | « Les montants reposent sur une balance encore en brouillon (version v, preuve « p »). » → « Validez la balance de l'exercice puis revérifiez les bases, ou levez l'anomalie en motivant. » |
  | `ECART_SANS_MOTIF` | `triplet.ecarts.motifRequis` | `BLOQUANTE` | `VALIDEE`, `CLOTUREE` | **non** | « Un écart entre les montants n'est pas motivé. » → « Enregistrez le montant avec le motif de l'écart, ou corrigez-le. » |
  | `DECLARE_ABSENT_AU_DEPOT` | à partir de `DEPOSEE`, famille à montant, aucun déclaré | `BLOQUANTE` | `CLOTUREE` | oui | « L'obligation est déposée mais aucun montant déclaré n'est enregistré. » → « Enregistrez le montant de la déclaration déposée avant de clôturer. » |
  | `CALCULE_A_SAISIR` | à partir de `A_CONTROLER`, `calcule.indisponible = MONTANT_A_SAISIR` | `AVERTISSEMENT` | — | oui | « Le moteur ne calcule pas cette taxe et le montant calculé par le cabinet n'est pas saisi. » → « Saisissez le montant calculé. » |

  **Ce qui n'est PAS une anomalie, et pourquoi :** `CALCUL_DELEGUE_NON_DISPONIBLE` et `SANS_MONTANT` sont l'état
  ordinaire de presque toutes les obligations tant que 321 n'existe pas (D-322-1) ; en faire des anomalies noierait les
  vraies. Le triplet les dit déjà, nommés. Une obligation écartée (`active: false`) ne porte aucune anomalie.
- **D-328-4 — Ce qui bloque, et dans quel ordre.** Chaque code nomme **les états d'arrivée qu'il refuse**. Une anomalie
  `BLOQUANTE` **ouverte** dont la cible figure dans cette liste refuse la transition : `409 ANOMALIE_BLOQUANTE`, avec la
  liste (`code`, `explication`, `action`). **Ordre** (le plus précis d'abord) : le droit de la cible, les gardes d'état,
  le cycle et le visa, **le motif d'écart (322)**, puis les anomalies, puis la lecture des bases à la prise en charge.
  `ECART_SANS_MOTIF` ne double donc jamais `MOTIF_ECART_REQUIS` : à `VALIDEE`, c'est ce dernier qui répond ; l'anomalie
  rend la même vérité **lisible** (dossier de contrôle, écran) et garde `CLOTUREE`.
- **D-328-5 — La levée : un motif, un droit, un code.** `POST /api/v1/obligations/{id}/anomalies/{code}/levee`,
  corps `{ motif }` (3 à 500 caractères ; absent ou vide : `400 MOTIF_DE_LEVEE_REQUIS` — c'est le critère 3 ; trop court
  ou trop long : `400 MOTIF_INVALIDE`). **Aucun droit neuf** : lever une `BLOQUANTE` est un acte de l'associé
  (`fiscalite:declaration:valider`) ; l'accuser réception d'un `AVERTISSEMENT` revient à qui prépare
  (`…:preparer`). Un refus de droit est journalisé comme celui de la transition (`HABILITATION_REFUSEE`). Une anomalie non
  levable : `409 ANOMALIE_NON_LEVABLE` (`ECART_SANS_MOTIF` : on motive l'écart, on ne le contourne pas — sinon on
  rouvrirait ce que 322 ferme). Inconnue ou absente de l'obligation : `404 ANOMALIE_INTROUVABLE`. Déjà levée :
  `409 ANOMALIE_DEJA_LEVEE`. Obligation écartée ou à redevable bloqué : `409 OBLIGATION_DESACTIVEE` /
  `OBLIGATION_BLOQUEE`, comme toute écriture sur l'obligation.
- **D-328-6 — Une levée vaut pour le constat qu'elle a vu.** Chaque anomalie porte une **empreinte** du fait qui la fonde
  (pour `BASE_PROVISOIRE` : balance, version et statut de preuve ; pour `ECART_SANS_MOTIF` : les trois montants…). La
  levée garde l'empreinte lue. Si le fait change (une autre balance en brouillon, un autre déclaré), l'anomalie **se
  rouvre** : on n'a pas accepté ce qu'on n'a pas vu. La levée précédente reste au journal chaîné.
- **D-328-7 — Écriture : comparaison-échange et audit dans la même transaction.** La levée s'écrit
  `findOneAndUpdate` sur `{ _id, orgId, statut: lu, active }` **et** sur les faits que son empreinte résume (la garde
  `faits` du constat, ex. `basesFiscales.source.version`) : si l'un a bougé, `409 TRANSITION_CONCURRENTE`. L'acte
  `OBLIGATION_ANOMALIE_LEVEE` part avec elle ; le motif en clair reste sur l'obligation, le journal (ineffaçable dix ans)
  n'en garde que l'**empreinte**, comme `OBLIGATION_MONTANT_DECLARE`. La transition qui franchit la porte porte les mêmes
  faits dans sa condition : une anomalie qui apparaît entre la lecture et l'écriture fait échouer la transition
  (`TRANSITION_CONCURRENTE`), jamais passer.
- **D-328-8 — La lecture : sur toute obligation, et au dossier de contrôle.** `ObligationResponseDto.anomalies` (jamais
  `null`, `[]` sans anomalie) liste **les ouvertes et les levées** (avec leur motif, qui, quand), les bloquantes d'abord.
  `GET /api/v1/exercices/{exerciceId}/obligations/anomalies` (`?redevableId=`, `?etat=OUVERTE|LEVEE`) rend les obligations
  actives de l'exercice qui en portent : c'est ce que STORY-336 (le dossier de contrôle) lira ; sa symétrique des écarts
  (322). Les redevables ne se mélangent jamais (563).
- **D-328-9 — La couture pour 326 et 1101 : des anomalies SIGNALÉES.** Certaines anomalies ne se déduisent pas de
  l'obligation seule : le rapprochement d'une déclaration avec la liasse (1101), les contrôles intra-période (326). Leur
  auteur **ajoute son code au catalogue** (`domain/obligations/anomalies.ts` : gravité, étapes refusées, levable : on
  ajoute, jamais on ne renomme) et **signale** par `RegistreObligations.signalerAnomalie(orgId, id, { code, empreinte,
  explication, action, details })` (comparaison-échange, acte `OBLIGATION_ANOMALIE_SIGNALEE`) puis `retirerAnomalie` quand
  le constat disparaît (acte `OBLIGATION_ANOMALIE_RETIREE`). Le texte (« écart de 1 200 000 sur le chiffre d'affaires,
  mars non déclaré ») est celui de l'appelant, qui connaît les montants ; la gravité, le blocage et la levée sont ceux du
  catalogue. Re-signaler la **même empreinte** ne rouvre pas une levée ; une **autre** empreinte la rouvre. **Aucune route
  HTTP** : c'est le système qui signale, jamais l'utilisateur (la levée, elle, passe par la route de D-328-5). Le
  catalogue de départ ne contient aucun code signalable : **1101 et 326 posent les leurs** ; la couture est éprouvée par
  un code de test, et nommée ici pour que personne ne la prenne pour du code mort.
  *Pour 1101 :* la liasse ne passe pas « À déposer » (AC-4) en déclarant `bloque: ['A_DEPOSER']` pour son code, sur
  l'obligation de dépôt de la liasse ; le refus est alors `ANOMALIE_BLOQUANTE`, sans autre code.
- **D-328-10 — Une anomalie ne bouge pas le cycle.** `statut` ne change jamais par une anomalie, une levée ou un
  signalement (AD-17). L'obligation ne « tombe » pas en arrière : elle est refusée en avant, et dit pourquoi.
- **D-328-11 — Aucun droit neuf, aucun événement, manifeste `declarations` inchangé (1.0.0).** Les trois droits
  `fiscalite:declaration:*` suffisent, et chacun est déjà exercé par une route. Aucun topic : personne ne consomme une
  anomalie aujourd'hui ; le tableau de bord du cabinet (EPIC-030) la lira par l'API.
- **D-328-12 — Hors périmètre, nommé :** les codes de 326 (contrôles intra-période), 327 (continuité) et 1101
  (rapprochement), qui se posent par D-328-9 ; rouvrir à la main une anomalie levée (elle se rouvre si le fait change) ;
  une anomalie portée par l'**exercice** plutôt que par l'obligation ; la notification d'une anomalie nouvelle ; la
  liaison obligation ↔ dépôt (333, 334) ; l'écran (FE-081).

## Contrat annoncé avant le code (2026-11-24)

**Ajouts seuls** dans `prospera-fiscal-service` : aucun champ, route ni code renommé ; aucun droit neuf ; aucun
événement Kafka ; manifeste `declarations` et catalogue d'auth **inchangés**. Rien d'écrit ni de lu chez un autre service.

- **Champ neuf sur `ObligationResponseDto`** (calendrier, fiche, retours de `transition`, `bases`, montants, levée) :
  `anomalies` (jamais `null`) :
  ```
  anomalies: [{
    code: string,                          // BASE_PROVISOIRE | ECART_SANS_MOTIF | DECLARE_ABSENT_AU_DEPOT | CALCULE_A_SAISIR | …
    gravite: 'BLOQUANTE' | 'AVERTISSEMENT',
    etat: 'OUVERTE' | 'LEVEE',
    origine: 'CALCULEE' | 'SIGNALEE',
    explication: string,                   // en clair
    action: string,                        // ce qui est attendu
    bloque: EtatCycle[],                   // les états d'arrivée qu'elle refuse
    bloqueLaProchaine: boolean,            // ouverte, bloquante, et la prochaine étape en fait partie
    levable: boolean,
    droitLevee: string | null,             // le droit que la levée exige ; null si non levable
    details: object | null,
    levee: { motif: string, par: string, le: string } | null
  }]
  ```
  Les bloquantes d'abord, les ouvertes avant les levées, puis par code. **→ D (FE-081)** : types à régénérer ; griser le
  bouton de l'étape quand `bloqueLaProchaine`, montrer `explication` et `action` tels quels, `levee.motif` au dossier de
  contrôle.
- **Routes neuves** : `POST /api/v1/obligations/{id}/anomalies/{code}/levee`, corps `{ motif }`, 200 = l'obligation ; droit
  `valider` (bloquante) ou `preparer` (avertissement) ; `GET /api/v1/exercices/{exerciceId}/obligations/anomalies`
  (lecture, tout membre habilité ; `?redevableId=`, `?etat=`) : `ObligationResponseDto[]`.
- **Comportement ajouté** : toute transition vers un état qu'une anomalie `BLOQUANTE` ouverte refuse répond
  `409 ANOMALIE_BLOQUANTE` (`details.anomalies` : `code`, `explication`, `action`). Aujourd'hui : `VALIDEE`
  (`BASE_PROVISOIRE`) et `CLOTUREE` (`DECLARE_ABSENT_AU_DEPOT`, `ECART_SANS_MOTIF`). Les autres transitions, et
  `MOTIF_ECART_REQUIS`, ne changent pas d'un octet. **Une obligation à base provisoire ne peut donc plus être visée tant que
  l'anomalie n'est pas levée** (D-320-15 : c'était l'intention).
- **Refus nouveaux** : `400 MOTIF_DE_LEVEE_REQUIS`, `MOTIF_INVALIDE` ; `403 DROIT_FISCAL_REFUSE` (journalisé) ; `404
  OBLIGATION_INTROUVABLE`, `ANOMALIE_INTROUVABLE` ; `409 ANOMALIE_BLOQUANTE`, `ANOMALIE_NON_LEVABLE`,
  `ANOMALIE_DEJA_LEVEE`, `OBLIGATION_DESACTIVEE`, `OBLIGATION_BLOQUEE`, `TRANSITION_CONCURRENTE`.
- **Champs de base neufs** sur `obligations` : `leveesAnomalies` (humain : une entrée par code, `{ empreinte, motif, par,
  le }`) et `anomaliesSignalees` (une entrée par code signalé). Absents ⇒ `{}`, aucune reprise de données.
- **Journal chaîné** : actes neufs `OBLIGATION_ANOMALIE_LEVEE`, `OBLIGATION_ANOMALIE_SIGNALEE`,
  `OBLIGATION_ANOMALIE_RETIREE` (contenu : code, gravité, empreinte du fait, empreinte du motif — jamais le motif).
- **Pour STORY-1101 et 326 (C)** : pose ton code au catalogue (`domain/obligations/anomalies.ts`), signale par
  `RegistreObligations.signalerAnomalie` / `retirerAnomalie`, et déclare `bloque` pour refuser l'étape voulue ; ne fabrique
  ni refus ni levée à toi : ils sont ici. Le déclaré d'une période se lit toujours sur `Obligation.montantDeclare`.

## Preuves attendues

Unitaires (`-w 2`, Node 24, étage `verification`) du domaine (le catalogue, chaque détection, l'empreinte, la levée et sa
réouverture, le tri, la porte) et des services (ordre des vérifications, droit par gravité, motif exigé, aucun écrit sur un
refus, la transition qui refuse) ; `test:conformite` sur `mongo:7` en jeu de répliques (levée + audit dans la même
transaction, comparaison-échange, une re-dérivation n'efface pas une levée, une levée sur un fait qui a bougé échoue, le
signalement et son retrait) ; e2e ; mutations qui rougissent sur l'assertion ; `docker compose up` du service, qui démarre,
et les routes neuves rendent `401` sans jeton. Pas de preuve Kafka (aucun événement).

## Progress Tracking

| Date | Événement |
|---|---|
| 2026-11-24 | Fiche écrite, contrat annoncé (PR de docs, #830) avant le code. |
| 2026-11-24 | **DONE.** Code : fiscal #57 (`0596fc4` sur `dev`). Preuves : unitaires sur Node 24 dans l'étage `verification` (182 suites, 2 563 tests verts ; une suite rouge à l'origine, la garde `$setOnInsert` de `mongo-registre-obligations.spec.ts`, corrigée et rejouée verte seule) ; `test:conformite` 15 suites / 92 tests sur `mongo:7` en jeu de répliques (dont `anomalies.conformite-spec.ts` : 10 tests) ; e2e `obligations` (3 nouveaux) ; 16 mutations unitaires et 5 sur Mongo rouges sur l'assertion ; `docker compose up` du service (pile `grp-a`, image construite depuis l'archive du commit) : sain, les trois routes neuves rendent `401` sans jeton ; `down -v` fait, verrou rendu. |

## Livraison (2026-11-24)

- **Dépôt** : `prospera-fiscal-service`, `MNV-328` → `dev` (#57). Fichiers : `domain/obligations/anomalies.ts` (le catalogue, la lecture, la porte, la levée, le signalement, les actes audités), `application/obligations/anomalies-obligations.service.ts` (lever, lister, signaler, retirer), `application/obligations/cycle-obligations.service.ts` (la porte, après le motif d'écart), `application/obligations/droits-du-cycle.ts` (`droitDeLevee`), `adapters/mongo/mongo-registre-obligations.ts` (`leverAnomalie`, `signalerAnomalie`, `retirerAnomalie`, `garde` de la transition), deux champs Mixed sur `obligation.schema.ts`, deux routes, le champ `anomalies` de la réponse.
- **Tel que annoncé**, D-328-1 à 12 inchangées. Deux précisions de livraison : (1) `signalerAnomalie` est idempotent par empreinte et rend l'obligation sans écrire ; (2) `retirerAnomalie` rend `null` quand il n'y avait rien à retirer (pas une erreur).
- **Ce que 326 doit savoir** : son code se pose dans `CATALOGUE` (`domain/obligations/anomalies.ts`) avec `origine: 'SIGNALEE'`, sa gravité, `bloque` (les états d'arrivée qu'il refuse) et `levable` ; il signale par `AnomaliesObligationsService.signaler(orgId, obligationId, { code, empreinte, explication, action, details }, par)` — le module `ObligationsModule` exporte le service — et retire par `retirer(orgId, id, code, par)` quand le constat disparaît. L'empreinte est celle du FAIT (ex. les deux montants et la tolérance) : la même ne rouvre pas une levée, une autre la rouvre. Aucun refus ni levée à écrire : `ANOMALIE_BLOQUANTE` et la route de levée sont déjà là. Les tests de la couture utilisent un catalogue de test (`CATALOGUE_AVEC_SIGNALEE` dans `anomalies.spec.ts`) : le catalogue de départ n'a aucun code signalable.
- **Ce que 1101 doit savoir** : le rapprochement lève son code SIGNALEE sur l'obligation de dépôt de la liasse, avec `bloque: ['A_DEPOSER']` (AC-4) ; l'écart est dit en une phrase par `explication` et `action` (AC-2), nomme les périodes manquantes (jamais zéro, AC-3). Le motif de levée figure déjà au dossier de contrôle : `GET /exercices/{id}/obligations/anomalies`. Le déclaré se lit toujours sur `Obligation.montantDeclare.montant`. Un couple absent du paquet : ne signale rien (AC-5).
