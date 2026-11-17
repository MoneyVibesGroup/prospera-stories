# STORY-1051 : prévenir l'assuré (1) — les modèles de messages de l'assurance, sans interdit, et les relances de pièces espacées de 5 jours

Status: in-progress

**Épic :** EPIC-220 (prévenir : notification, relais Money Vibes et portail des cabinets) · **Dépôt :**
`prospera-notification-service` (tenu par D depuis la fusion de B-957, port 3008) · **Plage :** groupe D, n° 7 du lot 3
(`PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §4). **Dépend de :** B-957 (passation de `notification`, faite : dernier commit
de B sur `dev` `5e6c553`). **Suivante :** STORY-1052 (les séries hébergées, `ventes` et la plateforme).

**Sources :** PRD assurance FR-18 (l'assuré est prévenu à chaque étape qui le concerne), FR-146 (les notifications du
circuit ; « aucune notification à l'assuré ou au courtier ne contient le mot « fraude », une donnée médicale ni un
montant d'indemnité ; un test lit tous les modèles sortants » ; « une notification de relance suit l'intervalle de 5
jours » ; `CANAL_ABSENT`), FR-226 (relances espacées d'un intervalle paramétrable, 5 jours en démo, arbitrage après trois
sans effet ; modèles WhatsApp approuvés avant la mise en service), FR-227 (aucune donnée de santé ; « un document
médical » sans plus ; motifs codés seulement), FR-47 (intervalle minimal de 5 jours entre deux relances d'un même
interlocuteur ; trois relances au plus), annexe A (manifeste `notification`) ; spine assurance AD-16, AD-23 (aucun
message de `notification` ne transporte de contenu médical), AD-18 (le temps se lit par un port d'horloge), AD-27 (appel
synchrone de `notification`, clé `(dossierId, événement)`) ; contrat `sinistres.dossier.changed@1`
(`prospera-plateforme/contrats/assurance/sinistres/`, C-991) ; registre `classification-sante` (C-983) ; passation de B
(journal de B, « Passations », 2026-11-17 : AC-5 refuse toute minuterie, les relances passent par une file BullMQ).

## Pourquoi

L'assuré n'a pas d'application : il apprend où en est son sinistre par SMS ou par e-mail. Ces messages passent par un
opérateur tiers ; ils ne doivent donc jamais porter une donnée de santé, un montant d'indemnité ni le mot « fraude », et
une demande de pièces ne doit pas harceler l'assuré. `notification` ne connaît encore aucun fait de l'assurance : cette
story lui donne les modèles, le déclenchement par le fait d'état absolu du dossier, et les relances de pièces.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **Neuf modèles système de l'assurance** au socle de `notification` (clés `assurance-*`, SMS et e-mail, `fr` et `en`) : déclaration enregistrée, pièces attendues, relance de pièces, dossier ouvert, numéro officiel reçu, offre envoyée (« un courrier vous a été adressé »), chèque à retirer, règlement effectué, dossier clos | unitaires (cohérence du socle) |
| AC-2 | **Le test des interdits parcourt tous les modèles de l'assurance** (chaque clé, canal, langue ; objet et corps) et échoue sur une variable de santé (registre `classification-sante`), une variable hors de la liste permise, un montant d'indemnité (variable ou montant écrit) ou le mot « fraude », quelles que soient la casse et les accents | unitaires ; mutation |
| AC-3 | **Une organisation ne peut pas surcharger** un modèle de l'assurance par un texte interdit (refus nommé `CONTENU_INTERDIT_A_L_ASSURE` à la création et à la nouvelle version) ; une valeur de variable interdite n'est jamais envoyée | unitaires |
| AC-4 | **Le fait `sinistres.dossier.changed@1` déclenche le message de l'étape** (matrice fermée statut → modèle) ; `FRAUDE_SUSPECTEE`, `LITIGE`, `REJETE`, `SANS_SUITE` et les états internes ne produisent **aucun** message à l'assuré ; un fait ancien ou rejoué (`versionEtat` non croissante) ne produit rien ; idempotent par `(dossierId, modèle, versionEtat)` | unitaires ; e2e ; pile `grp-d` |
| AC-5 | **Le destinataire est celui que `sinistres` a enregistré pour le dossier** (route de service, appelant `sinistres-service`) ; sans lui, rien ne part (`CANAL_ABSENT`, journalisé) | unitaires ; e2e ; pile |
| AC-6 | **Relances de pièces espacées de 5 jours** : à l'entrée en `PIECES_ATTENDUES`, la 1re relance est planifiée à J+5 de la demande (horloge de référence), chaque suivante à J+5 de la précédente **envoyée**, trois au plus ; une relance ne part jamais avant l'intervalle, ni si le dossier a quitté l'état ; identifiants de tâche déterministes (sans `:`), aucun doublon après un rejeu ou un redémarrage | unitaires ; intégration (Redis, MongoDB réels) ; pile (J+5 puis J+10) |
| AC-7 | **Rien d'autre ne casse** : les gardes du dépôt (AC-5 des minuteries, surface BullMQ unique, AD-2) restent vertes ; `/health` répond 200 | Node 24 ; pile |

## Décisions retenues par défaut (contestables)

- **D-1051-1 — Les modèles vivent au socle de `notification`**, comme modèles système (famille « assurance », clés
  `assurance-*`, livrées avec le code) : ils existent dès l'installation, aucune organisation ne peut les effacer, et le
  test des interdits peut les parcourir tous. Une compagnie peut les **surcharger** (règle existante : elle déclare au
  moins les variables du modèle système) ; la surcharge passe le même contrôle des interdits (D-1051-4). Canaux : `sms`
  et `email`. **WhatsApp attend 1054** : un modèle WhatsApp doit être approuvé avant la mise en service (FR-N11,
  FR-226) ; sans lui, le SMS part (le repli et la cloche sont à 1054).
- **D-1051-2 — Les variables sont une liste fermée** : `reference` (`DEC-…`) et `numeroOfficiel`, plus les deux
  variables de marque remplies par le service. Pas de date, pas de lieu, pas de montant, pas de motif libre ; les
  pièces attendues ne sont pas énumérées (le message dit que des pièces sont attendues ; le détail est donné au guichet
  ou par courrier, FR-227, H-183). La compagnie n'est jamais nommée dans le code : la signature est la marque de
  l'organisation.
- **D-1051-3 — Le déclencheur est le fait existant `sinistres.dossier.changed@1`** (état absolu, `versionEtat`), groupe
  neuf `notification-assurance` (`KAFKA_ASSURANCE_GROUP_ID`). Aucun fait neuf n'est inventé. `notification` garde le
  dernier état vu par dossier (`assurance_dossiers_suivis`) et ne parle qu'au **changement** d'état (ou à l'arrivée du
  numéro officiel) ; un fait de `versionEtat` inférieure ou égale est ignoré. Matrice fermée, côté assuré seulement :
  `DECLARE` → déclaration enregistrée ; `PIECES_ATTENDUES` → pièces attendues (et relances) ; `OUVERT` → dossier
  ouvert ; `OFFRE_ENVOYEE` → offre envoyée ; `CHEQUE_A_REMETTRE` → chèque à retirer ; `REGLE` → règlement effectué ;
  `CLOTURE` → dossier clos ; tout autre état → rien (le refus, le sans-suite et le litige partent par courrier signé,
  FR-146 ; `FRAUDE_SUSPECTEE` jamais à l'assuré). FR-226 dit que la matrice « qui est prévenu de quoi » n'est pas dans
  `notification` : cette correspondance ne porte que les étapes de l'assuré dérivables du fait, faute d'un appel de
  `sinistres` ; le jour où `sinistres` appellera la route synchrone d'AD-27 (`POST /api/v1/service/envois`, ouverte ici
  à `sinistres-service` pour les neuf clés), la matrice pourra le suivre (→ C).
- **D-1051-4 — L'interdit est vérifié trois fois, par une même fonction pure** (`src/domain/assurance/interdits-a-l-assure.ts`) :
  (1) un test parcourt tous les modèles de l'assurance du socle ; (2) la création ou la nouvelle version d'une
  surcharge d'un modèle `assurance-*` est refusée `CONTENU_INTERDIT_A_L_ASSURE` ; (3) une valeur de variable interdite
  ne part pas. Textes et noms se comparent **normalisés** (NFKD, sans accents, minuscules) : « FRAUDÉ », « Fraude » et
  « fraudulent » sont pris. Refus : `VARIABLE_DE_SANTE` (champ santé du registre `classification-sante`, tous modules),
  `VARIABLE_NON_PERMISE` (hors D-1051-2), `MONTANT_D_INDEMNITE` (variable de montant, mot « indemnité », montant écrit en
  FCFA, F CFA, XOF ou francs), `MOT_FRAUDE`, `DONNEE_DE_SANTE` (lexique fermé : lésion, blessure, diagnostic,
  incapacité, invalidité, consolidation, hospitalisation, gravité, ordonnance, certificat médical et les pièces de santé
  du registre ; « un document médical » reste permis, FR-227).
- **D-1051-5 — `classification-sante` est copiée à l'octet** dans `src/vendor/classification-sante/` (`src/index.ts`
  et `classification-sante.json`) depuis le commit `dba6ce0` d'`origin/dev` de `prospera-plateforme` (aucune étiquette
  n'existe pour ce dossier de C), empreintes figées par un test, hors lint et formatage. On ne modifie rien chez C.
- **D-1051-6 — Le destinataire est enregistré par `sinistres`, par une route de service** :
  `PUT /api/v1/service/assurance/dossiers/{dossierId}/destinataire` (jeton de service, appelant `sinistres-service`
  seul ; corps `{ organisationId, canal: sms|email, destinataire, langue? }`), identifiant normalisé comme au carnet,
  jamais rendu. Aucun fait du bus ne porte d'adresse (AD-16) et `notification` ne détient celle d'aucun membre
  (AD-12) : c'est le chemin des autres messages à quelqu'un sans compte. Sans destinataire, rien ne part
  (`CANAL_ABSENT`, FR-146). **`sinistres` n'appelle pas encore cette route : demande → C.**
- **D-1051-7 — Les relances : une chaîne planifiée sur une file BullMQ** (`notification:relances-pieces`, dans
  `adapters/bullmq/`, seule surface de la bibliothèque) — aucune minuterie (AC-5 de la passation). À l'entrée en
  `PIECES_ATTENDUES` (version `v`), un cycle `(dossierId, v)` est écrit une fois (`demandeLe` = horloge de référence,
  premier écrivain gagnant) ; la relance 1 est planifiée à `demandeLe + 5 j`, la relance `n+1` à `envoyeLe(n) + 5 j`
  (écrit une fois avant l'envoi), trois au plus (FR-47 ; l'arbitrage reste à `sinistres`). Le délai de la file est
  `échéance − maintenant` sur **la même horloge** (`HorlogeDesPeriodes`, avance de recette `RECETTE_HORLOGE_AVANCE_JOURS`,
  refusée en production) ; à l'exécution, la relance est jugée sur cette horloge : trop tôt ⇒ replacée à son échéance ;
  dossier sorti de l'état ou autre version ⇒ rien. Identifiant de tâche `relance-pieces|<org>|<dossier>|<v>|<n>` ;
  clé d'idempotence de l'`Envoi` dérivée de lui. Au démarrage, les cycles ouverts sont **replanifiés** (même
  identifiant : sans effet si la tâche existe, recréée si Redis l'a perdue). La chaîne garantit l'intervalle **entre
  deux relances envoyées**, même après une panne (une relance en retard décale la suivante).
- **D-1051-8 — Ce qui part de la file passe par `EnvoisService.demander`**, module appelant `sinistres` : consentement,
  suppression, rendu et audit de la remise sont ceux de tout envoi transactionnel. Un refus métier (désabonné,
  `CANAL_ABSENT`) arrête la chaîne de ce cycle et se journalise.

## Ce qui n'est pas fait ici

L'accusé de réception, le repli « WhatsApp, sinon SMS » et la cloche, les consentements par finalité (1054) ; les
modèles WhatsApp ; les messages au courtier, aux coassureurs et au personnel ; l'état de distribution rendu au dossier ;
les réponses entrantes et le relais Money Vibes ; l'effacement des destinataires enregistrés par les droits des
personnes (dette nommée pour 1054) ; l'appel de la route par `sinistres` (C).

## Livré

(à compléter)

## Preuves

(à compléter)
