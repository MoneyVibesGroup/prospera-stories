# STORY-1132 : La licence signée — premier incrément : un paiement l'ouvre, le suivant la prolonge

Status: in-progress — fiche écrite le 2026-11-27 par une sous-session du groupe B juste avant de coder (lot 7, n° 14 de B,
`coordination/PLAN-LOT-7-GROUPE-B-2026-11-25.md` §1, deuxième partie, ligne 14 ; identifiant réservé D-L7B-1).
**Date du plan : 08/01** (« la mise en service vend une licence »).

**Épic :** EPIC-150 (la licence signée ouvre, prolonge ou sanctionne) · FR-14, FR-32 · NFR-1, NFR-8 · AD-7, AD-8, AD-19,
AD-25, AD-28
**Dépôts :** `centrale-service` (seul dépôt modifié) · **`prospera-paiement-service` et `auth-service` : lus, inchangés**
(D-1132-11) · `agent-instance` : utilisé tel quel pour la preuve (il vérifie et applique les licences neuves sans changer)
**Points :** 3 · **Dépend de :** STORY-955 (centrale et agent : état voulu signé, licence vérifiée hors ligne), STORY-943
(`point-de-decision-v1`), STORY-278 (`paiement.abonnement.echeance.encaissee`), STORY-1130 (le certificat d'effacement :
même famille de clé) · **Suite :** STORY-1133 (EPIC-148 : l'agent de la plateforme relaie le bus), STORY-1134 (EPIC-149)
**Sources :** plan du lot 7 de B §1 (n° 14) ; `epics-moteur-installation-2026-11-11.md` (EPIC-150, voisins EPIC-148, 149,
151 ; « EPIC-149 précède EPIC-150 ») ; `PLAN-FEVRIER-2027-TOUT-CHARGE-2026-11-14.md` (S7, 08/01 : « licence signée ») ; spine
du moteur `architecture/architecture-moteur-installation-2026-11-11/ARCHITECTURE-SPINE.md` (AD-1, AD-7, AD-8, AD-17, AD-19,
AD-22, AD-25, AD-28) ; fiches STORY-955, 1113, 1128 (inventaire : EPIC-150 n'y figure pas, il commence ici), 1130, 1131 ;
journal de B (passations de paiement du 24/11, de 1073 et de 1141, pièges). Code relu sur `origin/dev` : centrale `5671fab`,
agent `db1dd58`, paiement `64b5838` (`traces-d-abonnement.ts`, `OutboxService.enfiler`, `echeanceSuivante`), catalogue
`4d01a70` (`evenements-abonnement.ts`, `terme.ts`, `certificat-d-effacement.ts`), `prospera-plateforme@point-de-decision-v1`
(`licence.schema.json`, `lireLicence`).

---

## Pourquoi

La mise en service d'une instance sur site vend une licence. AD-25 fixe le chemin : les faits de paiement vont à la
centrale **par l'agent de la plateforme**, la centrale dérive la licence et la signe de sa clé d'exécution, l'agent de
l'instance la tire au contact suivant et la vérifie hors ligne. STORY-955 a livré la seconde moitié (l'état voulu signé,
la licence vérifiée par l'agent, numéros croissants par clé), mais **la licence n'y vient que d'un semis à la main** :
aucun paiement ne l'ouvre, aucun ne la prolonge.

## Ce qui existait déjà (relu avant la fiche)

| Déjà là | Où |
|---|---|
| La licence est un JWS EdDSA (Ed25519), charge JCS, `typ` `prospera-licence+jws`, signée par la clé **`centrale`** certifiée par la racine ; numéro tiré d'un compteur par clé ; réémise seulement si modules, mise à jour ou sanctions changent | centrale `src/emetteur.ts`, `src/registre.ts` (955) |
| La centrale refuse de démarrer avec une clé non certifiée `centrale`, expirée, d'un autre environnement, ou une racine de test en production | centrale `src/cle.ts` (955) |
| L'agent vérifie l'état voulu puis la licence **hors ligne**, à l'heure scellée : chaîne racine → certificat → artefact, `LICENCE_AUTRE_INSTANCE`, `LICENCE_ANTERIEURE`, `LICENCE_INVALIDE` ; tout ou rien | agent `src/executeur/appliquer.ts`, `lireLicence` du point de décision (943, 955) |
| Le certificat d'effacement de l'essai : même famille (`usage` `centrale`, même format JWS, `@prospera/signature`) | catalogue `certificat-d-effacement.ts` (953, 1130) |
| `paiement.abonnement.echeance.encaissee` : publié quand une échéance est **intégralement** soldée (argent confirmé), porte l'organisation abonnée, ses modules, packages, périodicité, l'échéance ; enveloppe à plat (`schemaVersion` 1, `eventId` UUID, `orgId` de Money Vibes, `occurredAt`) | paiement `traces-d-abonnement.ts`, `OutboxService.enfiler` (278, 727) |
| La règle de la période payée (`echeanceSuivante`, quantième rabattu, UTC) et le préavis de 30 jours | paiement `abonnement.ts`, catalogue `terme.ts`, `etat-publie/calcul.ts` |

**Ce qui manque** : le parc ne sait pas quelle organisation une instance sur site sert ; le contact n'accepte aucun fait de
paiement ; aucune dérivation ; aucun registre des licences émises.

## Contrat annoncé avant le code (2026-11-27)

Lu par **B** seul (l'agent de la plateforme le parlera, STORY-1133) ; information à **D** (vendeur des abonnements) et **A**
(la console montrera les licences émises, plus tard). Aucun contrat de C ou D ne change.

1. **`POST /api/centrale/v1/contacts`** (profil de simulation, comme depuis 955 ; mTLS avec le montage) : le corps fermé gagne
   une section **facultative** `faitsDePaiement` (au plus 50) : `{ eventId, topic, valeur }`, où `topic` est dans une liste
   fermée — **`paiement.abonnement.echeance.encaissee` seul** dans cet incrément — et `valeur` le message du bus **tel que
   paiement l'a publié** (objet JSON). Corps borné à 128 Kio (16 Kio avant).
   - Seule l'instance du parc de rôle **`PLATEFORME`** peut la porter : sinon `403 FAITS_DE_PAIEMENT_HORS_PLATEFORME`, rien
     d'appliqué, aucun état voulu. Les autres refus sont inchangés (`400 CONTACT_INVALIDE`, `404 INSTANCE_INCONNUE`, `413
     CONTACT_TROP_GRAND`, `503 CONTACT_MTLS_NON_LIVRE`).
   - La réponse gagne, quand la section est présente, **`faitsDePaiement`** : un acquittement par fait reçu,
     `{ eventId, issue, dejaVu, motif?, instanceId?, modules?, ecarts? }`, `issue` ∈ `APPLIQUE` | `SANS_EFFET` |
     `SANS_INSTANCE_SUR_SITE` | `ILLISIBLE` ; `modules[]` : `{ code, issue }`, `issue` ∈ `OUVERT` | `PROLONGE` | `INCHANGE` |
     `PERPETUEL` | `HORS_INCREMENT` ; `ecarts` : `PACKS_NON_RESOLUS`. Un fait acquitté n'est plus à renvoyer ; un fait
     rejoué rend son premier acquittement, `dejaVu: true`.
   - Sans la section, la réponse est celle de 955, à l'octet (`{ etatVoulu }`) : l'agent d'instance ne change pas.
2. **Le semis du parc** (`CENTRALE_SEMIS`) : chaque entrée gagne `organisationId` (l'organisation qu'une instance sur site
   sert, 24 hexadécimaux, unique dans le parc) et `role` (`SITE` par défaut, ou `PLATEFORME`), facultatifs.
3. **La licence** (`licence@1`, `prospera-plateforme`) : **inchangée**. Un module ouvert par un paiement y entre en
   `ABONNEMENT`, `droits: []`, `preavisJusquau` posé ; `miseAJour` peut avancer.
4. **Inchangés** : le contrat d'état publié (gel 1.1.0), les faits de paiement (aucun neuf, aucun champ neuf), auth, le
   manifeste de paiement, les vecteurs de la plateforme, le jeu croisé r1 → r3 (à l'octet).

## Ce qui doit être vrai à la fin

| # | Exigence | Preuve |
|:--:|---|---|
| AC-1 | « Signée » : la licence dérivée d'un paiement est signée par la clé `centrale` (aucune clé neuve, aucune clé privée réelle versionnée), et l'agent la vérifie hors ligne avec la racine | unitaires (chaîne vérifiée par `@prospera/signature`) ; pile (l'agent l'applique) |
| AC-2 | **Ouvrir** : la première échéance soldée d'une organisation servie par une instance sur site y ouvre ses modules (`ABONNEMENT`, `preavisJusquau` = fin de la période payée + 30 jours) ; au contact suivant de l'instance, une licence de numéro supérieur | unitaires ; pile (`GET /decision` de l'agent : le module passe de `MODULE_HORS_LICENCE` à ouvert) |
| AC-3 | **Prolonger** : l'échéance suivante recule `preavisJusquau` ; une échéance plus ancienne rediffusée ne la raccourcit jamais ; un module perpétuel n'a jamais de validité | unitaires (31 janvier, rediffusion, perpétuel) ; pile |
| AC-4 | Un fait rejoué (même `eventId`) ne change rien et rend son premier acquittement ; un fait illisible est acquitté `ILLISIBLE` et gardé, jamais levé ; une organisation absente du parc (hébergée, AD-19) ne reçoit aucune licence | unitaires ; mutations |
| AC-5 | Seule l'instance `PLATEFORME` porte des faits de paiement (403 sinon, rien d'appliqué) ; contact sans faits inchangé à l'octet ; jeu croisé r1 → r3 reproduit à l'octet | unitaires HTTP ; `croise.test.ts` |
| AC-6 | Chaque licence émise est inscrite (instance, clé, numéro, empreinte, émise le, modules) ; chaque fait reçu est gardé entier | unitaires |
| AC-7 | Le fait lu est celui que paiement publie : fixture produite par le code de paiement (`faitsDEcheanceEncaissee` + l'enveloppe d'`OutboxService.enfiler`, `origin/dev` `64b5838`) | `test/faits-de-paiement.test.ts` |
| AC-8 | Node 24 (`docker build --target verification`) ; pile `grp-b` courte : centrale construite depuis la branche, agent de `origin/dev` | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1132-1 — « Signée » : la mécanique de 955, sans rien de neuf.** Qui signe : la **centrale**, de sa **clé d'exécution**
  (`usage` `centrale`, AD-28), certifiée par la racine hors ligne ; JWS compact EdDSA (Ed25519), charge JCS, `typ`
  `prospera-licence+jws`, numéro du compteur de la clé (D-955-6). Où vit la clé : sur l'hôte de la centrale
  (`CENTRALE_CLE`, `CENTRALE_CERTIFICAT`, scellée, renouvelée chaque trimestre en production) ; dans les tests et le profil de
  simulation, la clé **de test** des vecteurs de la plateforme (`centrale-test-2026`, sous `racine-test-2026`), jamais une
  vraie clé versionnée ; aucune licence de production avant la cérémonie de la racine (la centrale refuse déjà une racine de
  test en production). Comment l'instance vérifie hors ligne : l'exécuteur de l'agent, à l'heure scellée, chaîne racine →
  certificat → état voulu → licence (`lireLicence` : plus haut numéro par clé, heure de référence, autre instance) — ce qui
  est dans l'état de confiance aujourd'hui ; le miroir, le témoin et la suite d'attaques d'EPIC-149 sont à STORY-1134. C'est
  la même famille que le certificat d'effacement de 1130 (même `usage`, même format) : la règle est une seule clé
  d'exécution pour tout ce que Money Vibes signe hors CI.
- **D-1132-2 — Ouvrir et prolonger sont déclenchés par le paiement seul**, par le fait
  `paiement.abonnement.echeance.encaissee` (une échéance **intégralement** soldée sur l'argent confirmé, STORY-278) : jamais
  par la signature (`paiement.abonnement.engage` « annonce les modules, n'ouvre rien »), jamais par un geste de l'opérateur
  (AD-8 : la licence est dérivée du contrat). **Ouvrir** = un module du fait absent de la licence de l'instance y entre ;
  **prolonger** = un module déjà en `ABONNEMENT` voit `preavisJusquau` reculer. Les deux en une même règle : la validité
  d'un module est le **maximum** de ce qui a été payé.
- **D-1132-3 — Le transport : la section « faits de paiement » du contact de l'agent de la plateforme** (AD-25, AD-17 :
  « relais de paiement : section faits de paiement du contact, avec `eventId` »). La centrale n'a ni Kafka ni appel de
  paiement ; seule l'instance de rôle `PLATEFORME` du parc la porte ; acquittement par `eventId` dans la réponse ; liste
  fermée de topics, élargie par ajout quand un incrément suivant en traite un autre (un topic non traité n'est pas acquitté
  pour rien). Tant que le contact mTLS n'existe pas, la section ne vit qu'en profil de simulation, comme le contact. **Le
  relais lui-même** (l'agent de la plateforme qui consomme `paiement.abonnement.*` sur le bus du réel et les place dans son
  contact) est du code de l'agent : STORY-1133 (EPIC-148). La preuve de cet incrément tient le rôle de cet agent.
- **D-1132-4 — Le parc dit quelle organisation une instance sur site sert** : `organisationId` (unique : une instance sur
  site sert un client, une organisation a au plus une instance sur site en v1) et `role`. Une organisation **absente** du
  parc est hébergée sur la plateforme ou pas encore montée : **aucune licence** (AD-19), le fait est gardé
  (`SANS_INSTANCE_SUR_SITE`) pour le jour où elle passe sur site (AD-19 : `origineContrat`, à un incrément suivant). Le parc
  s'écrit par le semis tant que le montage et l'enrôlement (EPIC-148) n'existent pas.
- **D-1132-5 — La validité : `preavisJusquau` = fin de la période payée + 30 jours.** Fin de la période payée =
  `echeanceSuivante(echeanceLe, periodicite)`, **recopiée à l'identique** de paiement et du catalogue (UTC, quantième rabattu
  sur le dernier jour du mois d'arrivée) ; 30 jours = le préavis de l'addendum §A-2 (`DUREE_DU_PREAVIS_MS` du catalogue). Un
  module **perpétuel** n'a jamais de validité (AD-8) : `PERPETUEL`, inchangé. Un module **échelonné** (« échéance jusqu'au
  solde ») : `HORS_INCREMENT`, inchangé.
- **D-1132-6 — `miseAJour` = le maximum de la date existante et de la fin de la période payée** (jamais en recul) : un
  abonnement couvre les mises à jour du temps payé, pas du préavis. Contestable (le préavis pourrait les couvrir aussi).
- **D-1132-7 — `droits: []` pour un module ouvert par un paiement.** Le fait ne porte pas de droits ; la partie A de
  l'instance tient les droits d'un module de son manifeste (AD-24 : `droitsEffectifs` = jeton ∩ état des modules). Le champ
  `droits` de la licence reste celui du contrat semé.
- **D-1132-8 — Les packages ne sont pas résolus par la centrale dans cet incrément** : elle n'a pas les manifestes. Les
  modules à la carte du fait s'appliquent ; un fait qui porte des packages est acquitté avec l'écart
  **`PACKS_NON_RESOLUS`** et **gardé entier**, pour qu'un incrément qui lira `catalogue.manifeste.publie` le rejoue. Même
  raison : les dépendances ne sont pas encore jugées par le point de décision à la centrale (AD-25 l'exige à terme).
- **D-1132-9 — Chaque fait reçu est gardé entier, dédoublonné par `eventId`** ; un fait illisible est **acquitté et gardé**
  (`ILLISIBLE`, motif nommé), jamais levé : le « poison pill » qui bloquerait le relais (leçon du catalogue). La lecture
  reprend les règles du consommateur du catalogue (`lireEcheanceEncaissee` : version 1, `eventId`, organisation abonnée en
  24 hexadécimaux, modules au motif de paiement, packages, périodicité, échéance) et traduit les codes (`PI_SPI` → `pi-spi`).
- **D-1132-10 — Le registre des licences émises** (AD-2 : la centrale possède « licences émises ») : instance, clé, numéro,
  empreinte, émise le, modules et validités. La console le lira (« licences émises », EPIC-150) quand la centrale aura des
  routes authentifiées.
- **D-1132-11 — `prospera-paiement-service` et `auth-service` ne changent pas.** Paiement publie déjà le fait qu'il faut,
  et un fait déjà codé reste sans registre (amendement C5, `scripts/schemas/registre.mjs`) : aucun fait neuf, donc ni schéma
  au registre, ni manifeste, ni recopie au catalogue. La forme lue est prouvée par une fixture **produite par le code de
  paiement** (AC-7). Auth : aucune route authentifiée neuve (le contact est en simulation ; la route « licences émises » de la
  console et son droit viendront avec la centrale sur NestJS, D-955-2).
- **D-1132-12 — Le registre sérialise lui-même ses transactions** (la file de l'émetteur y passe) : la réception des faits
  et l'émission d'un état voulu partagent la même connexion SQLite, et deux `BEGIN IMMEDIATE` ne s'ouvrent pas à la fois.
- **D-1132-13 — La licence est réémise au contact suivant de l'instance, pas au paiement** (AD-1 : la centrale ne pousse
  rien) ; c'est la règle de 955 (« réémise si son contenu change »). « Dans la minute » ne vaut que pour une sanction
  (AD-25), hors de cet incrément.

## Nommé pour plus tard

- Le **relais** par l'agent de la plateforme (consommer `paiement.abonnement.*` sur le bus du réel, placer les faits dans
  le contact, les retirer à l'acquittement) → **STORY-1133** (EPIC-148) ; le contact mTLS → montage (EPIC-148).
- Les **packages** et les **dépendances** jugés à la centrale par le point de décision, sur les manifestes de
  `catalogue.manifeste.publie` ; rejeu des faits gardés `PACKS_NON_RESOLUS` → suite d'EPIC-150.
- **Sanctionner** (FR-41 : sanction décidée, nouvelle licence dans la minute, jamais contre un acheteur payé), l'impayé et la
  régularisation sur site → suite d'EPIC-150. Vendre un module **perpétuel** ou **échelonné** (geste de vente, contrat de
  paiement d'une autre nature) → suite d'EPIC-150.
- L'**envoi au DSI à chaque paiement** par `notification-service` (lien signé à durée limitée) et l'**alerte 7 jours avant**
  l'échéance d'une licence payée non reçue (le contact porte déjà `numeroLicence`) → suite d'EPIC-150.
- La **remise aux espaces** (`instance.licence.acceptee`, `.projetee`), la projection en entitlements de source `licence` et
  l'état publié sur site (PREAVIS demande l'échéance : un champ facultatif de `licence@1`, à la plateforme) → EPIC-148/150.
- L'organisation hébergée qui passe sur site (`origineContrat`, AD-19) ; l'écran « licences émises » de la console (A, sur une
  route authentifiée de la centrale) ; l'état voulu de la plateforme sans licence (le schéma l'exige aujourd'hui : la
  plateforme reçoit une licence du seul module `instance`, ignorée par sa partie A).
- ⚠ **La clé de test `centrale-test-2026` expire le 2027-01-01** (README de la centrale) : après, la centrale de simulation
  refuse de démarrer. La plateforme doit publier de nouveaux vecteurs **avant le 08/01** (B, part « moteur » de
  `prospera-plateforme`) → à placer par la session de groupe avant STORY-1133.
