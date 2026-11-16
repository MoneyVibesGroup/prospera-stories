# STORY-952 : l'essai prospect et ses avis

Status: done

**Complexité :** moyenne (un fait neuf, trois ordres, une file d'avis ; deux dépôts)

**Épic :** EPIC-147 (le prospect essaie avant de signer)
**Dépôts :** `MoneyVibesGroup/prospera-platform-catalog-service` (#57, `45c3b33` sur `dev`),
`MoneyVibesGroup/prospera-notification-service` (#88, `9d6f3ae` sur `dev`) ; contrats annoncés avant la fusion (stories #548)
**Plage :** groupe B, n° 12 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §3).

---

## Pourquoi

AD-38 : « L'essai d'un prospect est un fait de nature `ESSAI_PROSPECT`, propriété de la partie A de la plateforme, sur
l'horloge de Money Vibes : J0 à J+30, une prolongation avant la fin, 60 jours au plus ; `ESSAI_TERMINE`, puis 30 jours
pour exporter ou signer ; signer pendant `ESSAI_TERMINE` rouvre l'essai sans perte. L'avis part 7 jours avant chaque fin,
à l'administrateur du prospect et à son commercial, par `notification-service`. »

Le calcul de l'état publié savait déjà lire un droit d'essai (`droit.essai`, cas `essai-prospect` et `essai-termine` de
la matrice figée) ; rien ne l'alimentait.

## Ce qui doit être vrai à la fin (plan du lot 2, §3, n° 12)

| Exigence | Fait |
|---|---|
| J+30 | oui : `ouvrirLEssai`, fin à J+30, effacement 30 jours après la fin |
| Une prolongation, 60 jours au plus | oui : la seconde est refusée (`ESSAI_DEJA_PROLONGE`), au-delà de 60 jours aussi (`PROLONGATION_AU_DELA_DE_60_JOURS`), après la fin aussi (`ESSAI_TERMINE`) |
| `ESSAI_TERMINE` | oui : l'état publié de chaque module passe en `ESSAI_TERMINE` à `finLe`, par l'horloge de référence (aucun `Date.now()`) |
| Signer rouvre sans perte | oui : le module repasse `EN_SERVICE` dans l'espace d'essai ; rien n'est copié ni effacé |
| Avis J-7 | oui : 7 jours avant la fin et 7 jours avant l'effacement, à l'administrateur et au commercial, par la route directe de notification |

## Ce qui a été livré

**Catalogue** (`src/essai/`) :

1. `regles-de-l-essai.ts` : les règles pures (ouvrir, prolonger, signer, avis à planifier) et `faitsAvecEssai`, qui
   verse le fait d'essai aux faits du droit (AD-24). Un essai signé n'en verse aucun.
2. `essais_prospect`, une ligne par organisation (`_id` = `organisationId`) : dates en heure de référence, statut
   `OUVERT` ou `SIGNE`, destinataires des avis, avis partis.
3. Les routes `/api/instance/v1/essais` (contrat nouveau `contrat/essai-prospect.openapi.json`) :
   - `POST /essais` ouvre, idempotent ;
   - `GET /essais/{organisationId}` lit ;
   - `POST …/prolongation` prolonge ;
   - `POST …/signature` signe.

   Elles ne sont servies que par la partie A de l'espace d'essai (409 `ESSAI_HORS_ESPACE_D_ESSAI` dans le réel). Il faut
   une organisation née dans l'espace d'essai (STORY-948).
4. L'émetteur et la lecture de l'état publié lisent le fait d'essai. Chaque fait nouveau recalcule l'état de tous les
   modules de l'organisation (`etat-publie.changed.essai`) et repose les tâches `FIN_ESSAI` et `EFFACEMENT`.
5. Les avis :
   - une file BullMQ à part, `avis-d-essai` (celle des échéances n'émet que l'état publié, AD-6) ;
   - à l'heure dite, le travailleur relit l'heure de référence, puis l'essai. Rien ne part si l'essai est signé, si la
     fin a bougé ou si elle est passée ;
   - l'avis part une fois par destinataire, par `POST /api/v1/service/envois` de notification.
6. L'horloge de recette `RECETTE_HORLOGE_AVANCE_JOURS` (même nom que dans notification) :
   - elle avance l'heure de référence de la plateforme d'un nombre entier de jours ;
   - elle est refusée en production au démarrage ;
   - au redémarrage, l'émetteur recalcule tout et repose les tâches : c'est la « correction de l'heure » d'AD-6.

**Notification** :
- les modèles système `essai-fin-proche` et `essai-effacement-proche`, en e-mail, en `fr` et en `en`, sans lien ;
- l'appelant `platform-catalog-service`, dont le périmètre se limite à ces deux avis.

## Preuves

- **Node 24** (étage `verification`, export `git archive` de chaque branche) :
  - catalogue : `tsc`, lint de `src`, **92/92 suites, 1360/1360** ;
  - notification : `tsc`, lint des dossiers touchés, **276/276 suites, 3834 passés, 1 sauté**.
- **Mutations** :
  - catalogue, 5 mutations, toutes rouges sur une assertion : une seconde prolongation permise, un essai signé qui garde
    ses dates, un avis envoyé après la signature, une signature acceptée après l'effacement, un avis posé à la fin au
    lieu de J-7. Un premier essai de la quatrième rendait un paramètre inutilisé, donc une erreur de compilation ; il a
    été réécrit pour rougir sur l'assertion ;
  - notification : élargir le périmètre du catalogue à `abonnement-echeance-proche` fait rougir la garde.
- **Gardes de notification** : trois rougissaient à juste titre, et le texte et les tests ont été corrigés :
  - l'inventaire écrit en toutes lettres ;
  - les positions dans l'inventaire ;
  - aucun texte ne signe « Prospera » en dur (la signature est la variable de marque).
- **Pile `grp-b-952`** : catalogue de l'espace d'**essai** et notification, images `runtime` des branches, MongoDB 8,
  Kafka, Redis, mailhog, un JWKS de test. L'horloge est avancée par redémarrage (`RECETTE_HORLOGE_AVANCE_JOURS`).
  - **J0** :
    - `POST /essais` rend 201 ; le rejeu, 200 ; un autre commercial, 409 `ESSAI_DIVERGENT` ; une organisation
      inconnue, 404 ;
    - `stock` passe `ESSAI_PROSPECT` (`finLe` à J+30), événement n° 1 ;
    - deux avis sont en file (fin J+30, effacement J+60).
  - **J+23** :
    - **2 courriels** reçus, un pour l'administrateur et un pour le commercial : « Votre essai se termine dans 7
      jours » ; le corps porte « L'essai de Distrib SA se termine le 16 décembre 2026, dans 7 jours » ;
    - `avisEnvoyes` porte les deux ;
    - la prolongation rend 200 : fin à J+60, effacement à J+90 ; la seconde rend 409 `ESSAI_DEJA_PROLONGE` ;
    - événement n° 2 ; les avis sont reposés sur les nouvelles fins.
  - **J+61** :
    - `stock` passe `ESSAI_TERMINE` (`effacementLe`), les droits effectifs sont vides, événement n° 3 ;
    - l'avis de la fin J+60, devenu périmé, ne part pas (toujours 2 courriels) ;
    - une prolongation rend 409 `ESSAI_TERMINE` ;
    - la **signature** rend 200, et 200 de nouveau au rejeu. `stock` repasse `EN_SERVICE`, événement n° 4, les avis
      en attente sont retirés ;
    - le droit, l'installation et une donnée saisie pendant l'essai sont intacts.
  - **Production** : `NODE_ENV=production` avec une avance fait échouer le démarrage, et le message nomme
    `RECETTE_HORLOGE_AVANCE_JOURS`.
  - Pile descendue avec ses volumes, verrou Docker rendu.
- **Ce qui n'est pas prouvé sur la pile** : la naissance et l'installation y sont amorcées en base (prouvées par 948 et
  944) ; la pile n'a pas MinIO, comme pour 942 et 950.

## Décisions

- **D-952-1 — Un essai par organisation, porté par la partie A de l'espace d'essai, et versé au droit de chaque module.**
  AD-24 range `essai` dans les faits du droit ; AD-38 fait de l'essai un fait de l'organisation. Le fait vit donc une
  fois, et le calcul le lit pour chaque module installé.
- **D-952-2 — L'essai n'installe aucun module.** Les modules de l'essai s'installent par le plan d'installation (944),
  sous le même point de décision. L'ouverture ne double pas ce chemin.
- **D-952-3 — Signer, c'est SIGNE, pas une copie.**
  - Le droit se relit sans dates d'essai : le module se rouvre `EN_SERVICE` dans l'espace d'essai, avec ses données.
  - Les avis et les échéances d'essai tombent.
  - La mise en service au réel reste l'ordre d'EPIC-146 (951).
- **D-952-4 — La fenêtre de signature se ferme à `effacementLe`** (`DELAI_DE_SIGNATURE_ECOULE`), comme le dit AD-38 :
  « 30 jours pour exporter ou signer ».
- **D-952-5 — Une prolongation de 1 à 30 jours (30 par défaut), avant la fin.** L'effacement suit la nouvelle fin.
- **D-952-6 — Les avis passent par la route directe, sous l'organisation de plateforme.**
  - Le destinataire n'est connu que du catalogue ; le bus ne porte aucune adresse (AD-2 amendé par STORY-610).
  - C'est Money Vibes qui parle au prospect.
  - Le canal est l'e-mail seul : le commercial n'est pas membre de l'organisation.
- **D-952-7 — Une file d'avis distincte de celle des échéances.** AD-6 réserve celle-ci à l'émission de l'état publié.
- **D-952-8 — L'horloge de recette avance au démarrage, pas par une route.** Une route qui déplace l'heure de référence
  serait une porte ouverte en production. Une variable refusée en production au démarrage ne l'est pas : c'est le même
  choix que celui de notification-service.

## Pour STORY-953

- L'effacement s'accroche à l'échéance `EFFACEMENT` (déjà posée par l'émetteur à `effacementLe`), et au statut de
  l'essai : un statut `EFFACE` s'ajoutera à `OUVERT` et `SIGNE`.
- Le jeu de démonstration est une option de l'ouverture : un champ facultatif de `OrdreDOuverture`, à ajouter au contrat
  (ajout facultatif).
- Cinq essais simultanés : `POST /essais` est idempotent et ne tient aucun verrou global.
