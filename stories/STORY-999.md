# STORY-999 : les relances et les dossiers muets à 8, 15 et 30 jours (module `sinistres`)

Status: done

**Complexité :** moyenne (une commande de relance avec ses refus, un champ dérivé indexé, quatre vues de lecture, une
version neuve du référentiel des échéances)

**Épic :** EPIC-205 (le dossier sinistre et son circuit)
**Dépôts :** `prospera-sinistres-service`
**Plage :** groupe C, n° 10 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §4) ; dépend de 989 et de 998.

---

## Pourquoi

Un dossier qui attend un tiers ne doit pas s'endormir : on relance l'assuré, le cabinet, le tiers, avec un rythme
(5 jours entre deux relances du même interlocuteur sur le même sujet) et une limite (3 relances sans effet, puis un
arbitrage du responsable, pas une quatrième relance). Et un dossier sans aucune action d'écriture se voit : « à
surveiller » à 8 jours, « à relancer » à 15, « muet » à 30. La simple consultation ne compte pas, pour ne pas masquer
l'inactivité.

**Source** : PRD FR-143, FR-144, FR-47 (sans l'IA : modèles de messages), FR-140 → FR-142 ; spine AD-18, AD-27 ;
plan (« échéances légales et internes séparées ; relances posées et levées par les transitions »).

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **Relancer** : `POST /api/v1/sinistres/dossiers/{id}/relances` (canal, destinataire, sujet, texte, date) ; sans canal, destinataire ou date ⇒ `RELANCE_INCOMPLETE` ; avant 5 jours au même interlocuteur sur le même sujet ⇒ `RELANCE_TROP_PROCHE`, sauf dérogation motivée de `RESP` ; chaque relance journalisée (piste d'audit chaînée) | tests ; pile |
| AC-2 | **Trois sans effet, puis l'arbitrage** : une relance est « sans effet » tant qu'aucun résultat ne la lève ; à la 3e sans effet, le dossier affiche « arbitrage proposé » (classement sans suite, appel du responsable, recommandé, autre cabinet, mise en demeure) et refuse une 4e relance (`RELANCES_EPUISEES`) ; le constat `RELANCES_EPUISEES` est **posé par la commande** (fin des constats posés en base pour lui) | tests ; pile |
| AC-3 | **Relances posées et levées par les transitions** : l'entrée en `PIECES_ATTENDUES` (ou `OFFRE_ENVOYEE`) pose l'**attente du tiers** (sujet, destinataire, depuis) et la **relance due** à 5 jours (puis 5 jours après la dernière relance) ; la sortie lève l'attente et marque les relances ouvertes de ce sujet comme ayant eu leur effet ; les échéances `REGLEMENTAIRE` et `INTERNE`/`SUIVI` restent séparées (référentiel inchangé, D-999-6) | tests |
| AC-4 | **La dernière action d'écriture** : champ dérivé `derniereActionLe` (transition, relance, commande d'un agent ; jamais une lecture ni une copie dérivée comme le numéro officiel) et index `{organisationId, statut, derniereActionLe}` | tests ; vrai MongoDB |
| AC-5 | **Les vues** (lecture seule, au manifeste) : `a-surveiller` (GEST : ses dossiers sans action depuis 8 jours), `a-relancer` (RESP : 15 jours), `muets` (RESP, DT, AUD : 30 jours) ; jamais un dossier `CLOTURE`, `REJETE`, `SANS_SUITE` ; chaque ligne : gestionnaire, statut, dernière action, tiers attendu ; seuils en paramètre (un test les change) | tests ; pile |
| AC-6 | **Les agents inactifs** : `GET …/files/agents-inactifs` (AUD) : un agent sans écriture depuis 10 jours ouvrés, avec son nombre de dossiers en charge | tests |

## Décisions retenues par défaut (contestables)

- **D-999-1 — L'envoi réel n'est pas ici** : la relance est enregistrée, marquée `A_CONFIRMER` (aucun accusé du module
  `notification`) ; l'envoi par `notification` et l'envoi automatique à l'échéance (H-114, à confirmer) viendront avec
  EPIC-220. Aucun texte rédigé par l'IA : des modèles à variables (FR-47 « sans modèle »).
- **D-999-2 — L'effet d'une relance** se lève par `POST …/relances/{n}/resultat` (`EFFET`), ou par une transition qui
  répond au sujet (pièces ⇒ sortie de `PIECES_ATTENDUES` ; accord ⇒ réponse de l'assuré). La pièce reçue par `ged`
  (fait `ged.piece.controlee`) lèvera l'effet quand `sinistres` le consommera (STORY-1001).
- **D-999-3 — Le silence se mesure sur `derniereActionLe`**, pas sur `modifieLe` (que touchent aussi les copies
  dérivées) ; une relance est une action : un dossier en attente d'un tiers relancé dans les 5 jours n'est donc pas
  muet (FR-144).
- **D-999-4 — La notification à `RESP`, `DT`, `AUD` d'un dossier muet** est la vue `muets` ; la cloche et l'e-mail
  passeront par `notification` (EPIC-220).
- **D-999-5 — Les seuils** (8, 15, 30 jours ; 10 jours ouvrés ; 5 jours ; 3 sans effet) sont un paramètre versionné
  du module (`silence-2026.1`).

- **D-999-6 — L'attente d'un tiers, pas une échéance de plus** : l'échéancier (989) ouvre une ligne UNE fois par
  dossier (clé par code) ; une échéance `RELANCE_PIECES` ne se rouvrirait pas au second passage en `PIECES_ATTENDUES`.
  L'attente est donc un état du dossier, posé et levé par les transitions (`PIECES_ATTENDUES` ⇒ pièces/assuré ;
  `OFFRE_ENVOYEE` ⇒ accord/assuré), et la relance due se calcule depuis elle ; le référentiel des échéances ne change
  pas. Routes : `POST /api/v1/sinistres/dossiers/{id}/relances`, `POST …/relances/{n}/effet`, files `a-surveiller`,
  `a-relancer`, `muets`, `GET /api/v1/sinistres/activite/agents-inactifs` (manifeste amendé, prospera-stories #573).

## Ce qui a été livré

**2026-11-17** — `prospera-sinistres-service` **#9** (`dev` `a358048`) ; manifeste amendé
prospera-stories **#573** :

- `src/modules/sinistres/relances/` (pur) et commandes `relancer`, `constaterEffet` (même discipline que la
  suspension : idempotence, version lue, refus tracé, audit chaîné, fait du dossier) ; l'attente d'un tiers posée et
  levée par les transitions ; `derniereActionLe` (actions d'écriture des agents) et son index ; files `a-surveiller`,
  `a-relancer`, `muets` ; `GET /api/v1/sinistres/activite/agents-inactifs` ; paramètres `silence-2026.1`.
- **Node 24 sur un vrai MongoDB** : 823 unitaires (dont 6 de 999 sur chacun des deux bancs, et 4 sur les paramètres), 19 e2e.
- **Pile `grp-c-999`** : relance sans canal 400 ; à 3 jours de la précédente 409 (« possible le … ») ; 3 sans effet →
  constat posé, arbitrage proposé, une 4e 409 ; effet constaté → 3 levées, constat retombé ; dérogation du RESP 201,
  GEST sans 409 ; B en attente de pièces, relance due à 5 jours ; sortie → attente levée (et absente de la base),
  relance levée par la transition ; à surveiller (GEST) → C 31 j, B 9 j ; à relancer (RESP) → C ; muets (AUD, DT) → C ;
  GEST 403 ; une lecture ne réveille rien, une relance oui ; la vue des muets passe par l'index
  `organisationId_1_statut_1_derniereActionLe_1` ; 0 erreur aux journaux.
- **Ce que la preuve a montré** : sur vrai MongoDB, `$set` ignorait l'attente devenue `undefined` (elle restait en
  base) ; corrigé par `$unset` (le banc mémoire ne le voyait pas).
- **Rejouée sur l'image reconstruite depuis `dev`** (`a358048`, pile `grp-c-999d`) : même scénario, même issue — attente levée et absente de la base ; à surveiller C 31 j, B 9 j ; muets → C, puis aucun après une relance ; 0 erreur aux journaux.

**Reste** : l'envoi par `notification` et l'envoi automatique (EPIC-220) ; la levée par la pièce reçue
(`ged.piece.controlee`, STORY-1001) ; la notification des muets à RESP, DT et AUD ; l'IA de rédaction (FR-47).
