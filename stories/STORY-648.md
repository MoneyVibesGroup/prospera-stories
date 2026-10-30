# STORY-648 : Un encaissement fait partir un reçu

Status: review

**Bloc :** Convergence E3 — le pont entre les deux rails (`CONVERGENCE-RAILS-C-D-2026-09-08.md`)
**Services :** `prospera-paiement-service` → `prospera-notification-service` (route directe)
**Points :** 3 (réalisé : plutôt 5, voir « Ce que la story a trouvé ») · **Prérequis :** STORY-644 (route directe câblée), STORY-611/617 (modèles et marque), STORY-263 (validation), STORY-274/275 (contre-passation), STORY-271 (affectation)
**Branches :** `MNV-648` sur les deux dépôts, depuis `origin/dev`

---

## Le récit

En tant que **payeur**, je veux recevoir un reçu quand mon paiement est confirmé, et être prévenu
s'il est annulé, afin de savoir où en est ce que j'ai versé.

## Ce que la story a trouvé — la conception de la fiche ne pouvait pas marcher

La fiche du 2026-09-08 plaçait un **consommateur côté notification**, abonné à
`paiement.encaissement.confirme`, avec un destinataire « résolu par le carnet, à la remise ».
Le code, relu le 2026-10-30, dit trois choses :

| La fiche supposait | Le code |
|---|---|
| un topic `paiement.encaissement.confirme` | il n'existe pas : `constate` (fournisseur), `declare`, `valide`, `affecte`, `annule` |
| le carnet résout le payeur | le carnet ne relie **aucun** contact à une créance ; le payeur n'a pas de compte |
| l'événement ne porte « ni jeton ni adresse de paiement » | pour joindre le payeur, il aurait fallu y mettre son **courriel ou son téléphone** : une donnée personnelle sur un topic durable et rejouable, ce qu'AD-5 refuse |

⚡ **Arbitrage PO du 2026-10-30 : la route directe.** `paiement-service` envoie le reçu et l'avis
par la **même route** que le lien de paiement (`POST /api/v1/service/envois`, STORY-644), avec le même
jeton de service. Les coordonnées du payeur restent figées sur la demande ou la créance et ne passent
jamais sur le bus. Le chemin était déjà prouvé de bout en bout au gate du 2026-10-30.

## Critères d'acceptation — verdicts

- **AC-1 ✅ (reformulé)** — un versement **devenu certain** enfile un reçu **dans la transaction qui
  l'écrit**, puis le relais le remet sous l'organisation **créancière** (`organisationId` du corps =
  celle de l'encaissement ; la notification signe avec sa marque). Quatre chemins :
  notification signée du fournisseur (`recevoir-la-notification`), **validation** d'une déclaration,
  **affectation** d'un orphelin (STORY-271), et — pour l'avis — l'**annulation**. Une déclaration
  d'espèces non validée n'a **pas** de reçu : l'argent n'est pas certain.
- **AC-2 ✅** — la contre-passation enfile un **avis d'annulation** qui cite la **référence du reçu**
  (`REC-XXXXXXXX`, dérivée de l'encaissement, la même dans les deux messages). ⚡ L'avis ne part que
  si un reçu avait été enfilé : on n'annule auprès du payeur que ce qu'on lui a annoncé.
- **AC-3 ✅** — ni jeton, ni lien, ni adresse de paiement : les deux modèles ne déclarent aucune
  variable `lien` et ne sont **pas** porteurs de secret ; le relais n'envoie que le nom et les moyens
  de **joindre** le payeur. Vérifié côté paiement (adaptateur, relais) et côté notification (socle,
  e2e : les variables d'un reçu restent au journal, rejouables).
- **AC-4 ✅** — un payeur sans courriel ni téléphone **ne fait pas échouer l'encaissement** : le
  versement est écrit, l'avis passe `ECARTE` avec son motif (`SANS_DESTINATAIRE`). Deux autres écarts
  nommés : `SANS_BENEFICIAIRE` (aucun nom projeté pour l'organisation, un reçu muet sur qui a reçu
  l'argent ne vaut rien) et `ENCAISSEMENT_INTROUVABLE` (dont un encaissement d'une **autre**
  organisation — `lireParCle` ne filtre pas, le relais compare).
- **AC-5 ✅ (par construction)** — la route directe est **transactionnelle** : ni consentement, ni
  fenêtre d'envoi, ni « STOP » ne la retiennent ; la suppression pour rebond dur (633), si. L'e2e
  notification vérifie que l'envoi est `TRANSACTIONNEL`.
- **AC-6 ✅** — la clé d'idempotence envoyée à la notification est `<modèle>-<empreinte de
  l'encaissement>` : un identifiant d'encaissement est une clef **composée** (`PSP|FEDAPAY|451236`,
  `DEC|<org>|<clé>`), de longueur variable et porteuse de `|` ; l'empreinte (SHA-256, 24 hex) est
  bornée et stable. Côté file, la clef primaire `<NATURE>:<encaissement>` rend un second reçu
  inexprimable. Un rejeu de l'appel rend le même envoi (e2e).

## Ce qui a été construit

**notification-service**
- Deux modèles système au socle, FR/EN, e-mail et SMS (alphabet GSM 03.38 : « confirme » plutôt que
  « reçu », le `ç` minuscule n'en fait pas partie) : `recu-d-encaissement`
  (`nom, beneficiaire, montant, motif, reference, date`) et `avis-d-annulation`
  (`nom, beneficiaire, montant, reference, date`). Jamais en cloche : le payeur n'a pas de compte.
- `paiement-service` voit son périmètre de la route directe passer à trois propos.
- e2e : les corps exacts de l'adaptateur du paiement passent la vraie validation.

**paiement-service**
- `domain/envoi/avis-au-payeur.ts` : natures, statuts (`ECARTE` ≠ `ECHEC_DEFINITIF`), clef, empreinte,
  référence, issue d'un échec (les échecs de câblage ne consomment aucune tentative, comme le lien).
- Une **file à part**, `avis_sortants` (`_id` texte `<NATURE>:<encaissement>`) : la file du lien a pour
  clef l'identifiant de la demande en `ObjectId`, et la contre-passation a pour clef l'encaissement
  — un reçu et son annulation s'y seraient heurtés. Aucune donnée du payeur n'y est stockée.
- `FileDesAvis` (module sans import, pour ne pas créer de cycle) et `RelaisDesAvis` (même minuterie et
  mêmes réglages que le relais du lien ; message **reconstruit à chaque tour**).
- `PortDeNotification.remettreUnAvis` ; l'adaptateur partage avec le lien la configuration, l'appel et
  la lecture de l'accusé.

## Gardes qui ont rougi, et pourquoi elles avaient raison

- Les inventaires figés du socle (`modeles-systeme.spec.ts`, `porteur-de-secret-contrat.spec.ts`,
  `porteur-de-secret.spec.ts`) : quinze → dix-sept modèles, trois propos pour le paiement.
- `affecter-l-encaissement.usecase.spec.ts` compte les dépendances du cas d'usage : cinq → six, avec
  la raison écrite (la file des avis n'écrit aucun montant).

## Preuves

| Contrôle | Résultat |
|---|---|
| `paiement-service` — `npx jest` | 315 suites / **4 268 tests** (1 rouge au passage complet, corrigé : voir ci-dessous) |
| `paiement-service` — `npm run test:e2e -- --runInBand` | 27 suites / **335 tests** |
| `notification-service` — `npx jest` | 263 suites / **3 614 tests** |
| `notification-service` — `npm run test:e2e -- --runInBand` | 18 suites / **270 tests** (dont 6 STORY-648) |
| lint (deux dépôts) | 0 |

Au passage complet, deux gardes du paiement ont rougi, à raison :
- `ecriture-argent.invariant.spec.ts` (AD-12) tient la liste fermée des minuteries `setInterval`.
  `RelaisDesAvis` y entre avec la justification exigée : comme le relais du lien, il relit une ligne
  enfilée dans la transaction du fait et ne date rien (23/23 après correction).
- `notifications-webhook.e2e-spec.ts` construit le cas d'usage par injection : il reçoit un double
  de `FileDesAvis`, et vérifie que le reçu est enfilé dans la transaction du versement (28/28).

## Ce qui reste ouvert

- **Gate Docker** : la remise réelle d'un reçu dans Mailhog n'a pas été rejouée (Docker à la demande).
  Le test `STORY-644` de `prospera-recette` est le patron à étendre ; il couvre déjà la même route.
- La **langue** reste `fr` (`LANGUE_DU_LIEN`) : la demande ne porte pas la langue du payeur.
- Les versements confirmés **avant** le déploiement n'ont pas de ligne de reçu, donc leur annulation
  ne produira pas d'avis : c'est la règle « on n'annule que ce qu'on a annoncé », appliquée.
