# STORY-928 : Les routes d'import et d'effacement de la démonstration (C13), dans balance et bilan

Status: in-progress

**Complexité :** moyenne à grande (deux services, une identité de service à brancher dans chacun, un plan d'effacement complet, une preuve Docker)

**Épic :** EPIC-147 (l'essai prospect), EPIC-160 (le contenu des jeux de démonstration)
**Dépôts :** `MoneyVibesGroup/prospera-balance-service` (branche `MNV-928`), `MoneyVibesGroup/prospera-bilan-service` (branche `MNV-928`)
**Plage :** groupe A, n° 9 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §2). Sources : STORY-953 (B, contrats
`import-c13-*@1`, `effacement-c13-*@1`, étiquette `contrats-instance-v1`), STORY-927 (le jeu `cabinet-demo-togo`, section
« Pour STORY-928 »), dette D-918-4 (balance et bilan servent leurs routes C13), modèle : STORY-1046 (D, les mêmes routes dans le LC
fictif de l'assurance).
**Suite :** STORY-929 (clôture : `cabinet-moteur` installe par `POST /installations`, recette croisée complète).

---

## Ce que le plan demande

« Les routes déclarées dans `routesInstance` répondent au corps de `contrats/instance/` ; effacement idempotent. » Les manifestes de
`balance` et de `bilan` déclarent déjà `routesInstance.import` et `routesInstance.effacement` (chemins sous `/api/v1/instance/<code>/{organisationId}/…`).
Rien n'était servi : c'est la dette D-918-4.

## Décisions (recommandations appliquées, contestables)

- **D-928-1 — Une identité de service dans balance et bilan, patron du catalogue (STORY-948) et de D (1046).** `JwtStrategy` lit les claims
  `identite` et `organisationId` d'un jeton de service ; `EmailVerifiedGuard` n'ouvre un jeton de service que sur une route marquée
  `@AdmetIdentitesDeService('MOTEUR')`, partout ailleurs 403 `IDENTITE_DE_SERVICE_REFUSEE` ; la route exige en plus l'identité `MOTEUR`
  (403 `IDENTITE_DE_SERVICE_REQUISE` pour un jeton d'utilisateur, même `TENANT_ADMIN` à e-mail vérifié) et `organisationId` du jeton = celui du chemin
  (403 `ORGANISATION_HORS_JETON`). Une identité inconnue, ou sans organisation : 401 `JETON_DE_SERVICE_INVALIDE`. Les routes sont hors des gardes métier
  (`BalanceAccessGuard`, `DossierScopeGuard`) : l'effacement doit passer quel que soit l'état publié, et il n'y a pas de dossier dans le chemin.
- **D-928-2 — La garde « jamais une organisation réelle ».** Les deux routes (import comme effacement) ne répondent **que dans un espace d'essai** :
  `INSTANCE_ESPACE=ESSAI` (la même variable que lit déjà le consommateur de l'état publié, STORY-912 : absente ou autre valeur ⇒ `REEL`). Dans un
  espace `REEL`, 403 `ESPACE_REEL_REFUSE`, avant toute lecture du corps et sans rien écrire. En plus : l'import ne sert que `source = JEU_DEMONSTRATION`
  (`DOSSIER_INSTALLATION` : 422 `SOURCE_NON_SERVIE`, c'est le dossier d'installation de la Reprise, hors de cette story) et l'effacement ne sert que
  le motif `FIN_ESSAI` (`FIN_CONTRAT` : 422 `MOTIF_NON_SERVI`, D-953-9 : l'effacement d'un contrat n'est pas servi). Trois verrous indépendants
  contre l'effacement d'une organisation réelle par erreur : l'espace, le motif, l'identité du moteur limitée à l'organisation du chemin.
- **D-928-3 — Le dossier de démonstration est matérialisé dans balance seul, faute de création appelable dans `dossier-service`.** Le jeu ne porte
  aucun identifiant de dossier (`dossierRef`, la clef du dossier dans le jeu). `dossier-service` n'a aucune création appelable par une identité
  de service (ses routes sont celles d'un membre du cabinet) et la story ne code pas dans `dossier-service`. Résolution retenue, la plus sûre :
  `dossierId` = les 12 premiers octets de `sha256("jeu-demonstration|<organisationId>|<dossierRef>")` (déterministe : même organisation et même
  `dossierRef` ⇒ même dossier ; aucun état à retenir, un rejeu retrouve le même), et l'import de `profil-societe` pose, pour ce dossier, **les trois
  projections que balance tient déjà d'un dossier** (`dossiers_dossier`, `axes_dossier` avec `SN`/`REEL`, plus le profil société). Le dossier n'existe
  donc que **dans balance** : ni dossier-service ni bilan ne le connaissent. Conséquence nommée au ticket
  `TICKET-BACKEND-dossier-de-demonstration-sans-creation-par-le-moteur` : tant que `dossier-service` ne crée pas le dossier de démonstration (et ne
  publie pas `dossier.created`), la console ne le liste pas et bilan ne peut pas bâtir ses états depuis lui (la validation de la balance livrera
  `balance.created` à un bilan qui ne connaît pas le dossier). C'est la dette à solder avant que la démonstration montre un bilan.
- **D-928-4 — Import de `balance`.** Chaque enregistrement est **une balance entière** (D-927-3) : `dossierRef` résolu comme ci-dessus (le profil doit
  avoir été importé avant : sinon 422 `DOSSIER_DE_DEMONSTRATION_INCONNU`), `orgId` posé par la route, puis la balance passe par
  `BalanceService.submitInSession` (**le seul chemin de soumission du hub** : mêmes contrôles que l'ingestion, que l'import Sage et que les cahiers :
  équilibre, comptes au plan du référentiel du dossier, checksum, devise cohérente), à l'état `BROUILLON`, avec l'`auteur` `SERVICE`/`moteur`. Elle
  n'emprunte pas l'autorisation de l'ingestion Kafka (KYC approuvé, entitlement actif) : c'est une route du moteur, pas un émetteur tiers. Un refus
  du validateur (checksum, déséquilibre, compte inconnu, référentiel non résolu) refuse le lot **en entier**, rien n'est écrit : 422 `BALANCE_REFUSEE`
  avec le code du validateur.
- **D-928-5 — Bilan n'a rien à importer (D-927-1).** La route `import` de bilan est servie (le manifeste la déclare, le moteur la nomme) mais n'a **aucun
  objet** : tout `objet` reçoit 422 `OBJET_INCONNU` (le contrat l'admet, il est écrit dans la réponse 422 de `instance-c13.openapi.json`), un lot
  vide aussi, puisque l'objet est inconnu. Pas de `IMPORTE` sur zéro enregistrement : le contrat de réponse n'y gagne rien et un « importé » qui n'a rien
  fait est un faux. Le jeu ne passe jamais par cette route (il n'a pas de part `bilan`).
- **D-928-6 — Idempotence.** Un registre propre au service (`instance_c13_imports`, clef unique `(organisationId, idempotence)`) : un lot déjà joué rend
  `DEJA_IMPORTE` avec le même décompte, **sans rien réécrire**. Le lot et l'enregistrement du registre partagent une transaction (un rejeu concurrent
  perd sur l'index unique et rend `DEJA_IMPORTE`). Effacement : `effacements_c13` (une ligne par organisation : date, décompte, rien de personnel) ;
  `EFFACE` s'il y avait quelque chose à effacer ou si c'est le premier ordre, `DEJA_EFFACE` quand il n'y avait plus rien et qu'un effacement
  est déjà inscrit. Si des données sont revenues entre deux ordres (réimport), le nouvel ordre les efface (`EFFACE`) : on ne ment jamais par un
  `DEJA_EFFACE` sur des données présentes. `effaceLe` est l'heure de référence de la demande (`demandeLe`, AD-6), reportée telle quelle au rejeu.
- **D-928-7 — L'effacement efface TOUT, par un plan nommé et gardé par un test d'inventaire.** `plan-d-effacement.ts` liste chaque collection qui garde une
  donnée de l'organisation et son champ d'organisation (`orgId`, `organizationId`, `tenantId`, `partitionKey` pour l'outbox). Les identifiants sont
  cherchés sous leurs **deux formes** (ObjectId et chaîne : `@Prop({ type: Types.ObjectId })` range parfois en `Mixed`, piège 1.9). Un test lit tous les
  `*.schema.ts` du service et rougit si une collection à champ d'organisation n'est ni dans le plan ni dans la liste des exclusions justifiées : une
  collection ajoutée demain ne s'oublie pas. Inventaires ci-dessous.
- **D-928-8 — Les journaux ne sont pas pseudonymisés, ils sont effacés.** Le contrat dit « pseudonymise ses journaux (AD-12) » ; `instance.journal@1` n'existe
  pas encore, et `audit_events` de bilan est un journal propre à l'organisation d'essai : dans un espace d'essai effacé, le garder pseudonymisé n'a aucune
  valeur. On l'efface avec le reste, et le registre des effacements ne garde que l'organisation, la date et le décompte.
- **D-928-9 — Les pièces ne sont pas à balance.** `lots_pieces_ocr` et `lignes_pre_proposees` référencent des pièces de `document-service` (C) ; les
  fichiers y restent. Aucune route d'effacement n'existe dans `document-service` : dette nommée au journal (D-928-9), à demander à C quand le jeu portera
  des pièces (celui-ci n'en porte aucune).

## Inventaires effacés

(Remplis à la fin de la story, depuis le plan livré.)

## Preuves

(Remplies à la fin de la story.)

## Pour STORY-929

(Rempli à la fin de la story.)
