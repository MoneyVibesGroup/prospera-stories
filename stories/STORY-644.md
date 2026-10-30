# STORY-644 : Le rail paiement → notification, câblé et authentifié

Status: done

**Bloc :** Convergence E0 — le substrat de recette (`CONVERGENCE-RAILS-C-D-2026-09-08.md`)
**Services :** `prospera-paiement-service` + `prospera-notification-service` + `docker-compose.yml` racine
**Points :** 3 · **Prérequis :** STORY-643 (garde de câblage — présente dans les deux dépôts)
**Branches :** `MNV-644` sur les deux dépôts, depuis `origin/dev` (paiement `86c2931`, notification `3da1a51`)

---

## Le récit

En tant qu'**équipe**, je veux qu'un lien de paiement puisse réellement partir dans la pile locale,
afin qu'une recette croisée ait quelque chose à observer.

## Ce que la story a trouvé — pire que « deux variables manquent »

La fiche du 2026-09-08 ne voyait qu'un câblage absent du compose. Le code, relu le 2026-10-29,
montre que **l'adaptateur de STORY-608 n'aurait rien envoyé même câblé** :

| | Ce que faisait `paiement-service` | Ce qu'attend `notification-service` |
|---|---|---|
| Route | `POST /api/v1/envois` — la route d'un **utilisateur** (jeton de l'IdP, gate d'organisation) | `POST /api/v1/service/envois` — la route **directe** (STORY-589) |
| Corps | `MessageDeLien` brut (`payeur`, `montantMineur`, `url`…) | `DemanderEnvoiDirectDto` : `cle`, `canal`, `langue`, `destinataire`, `variables[]`, `cleIdempotence` |
| Accusé | lisait `envoiId` | rend `EnvoiDto.id` |
| Appelant | — | `paiement-service` **absent du périmètre** : le démarrage refuse son jeton |
| Modèle | — | **aucun** modèle « lien de paiement » au socle |

⛔ **Vert des deux côtés pendant sept semaines** : chaque dépôt testait contre un double de l'autre.
C'est le patron de STORY-603 (« un chemin dont tous les tests simulent les deux extrémités n'est
testé nulle part »), et c'est pourquoi la story ajoute un e2e qui envoie **le corps exact** de
l'adaptateur à la vraie route.

## Critères d'acceptation — verdicts

- **AC-1 ✅** — `NOTIFICATION_BASE_URL` et `NOTIFICATION_JETON_SERVICE` posés au compose racine
  (`PAIEMENT_NOTIFICATION_BASE_URL`, `PAIEMENT_NOTIFICATION_JETON_SERVICE`, défauts de développement)
  et documentés au `.env.example` de `paiement-service` ; `JETONS_DE_SERVICE` de la notification
  reçoit l'entrée `paiement-service:`. Le code garde son repli **vide** : jamais d'adresse plausible.
- **AC-2 ✅ (reformulé)** — la fiche parlait d'« audience » JWT ; le mécanisme ratifié par STORY-589
  est un **jeton opaque par appelant**, dont la notification ne garde que l'empreinte. L'équivalent
  exact : `paiement-service` est inscrit au périmètre **codé** (`appelants-de-service.ts`) avec le
  seul propos `lien-de-paiement`, disjoint de ceux d'`auth-service` et d'`expert-comptable`.
- **AC-3 ✅** — le jeton de service n'entre ni au journal, ni dans la file (qui ne porte que la
  désignation du fait), ni dans une erreur : `EchecDeRemise` ne reçoit plus qu'un **code d'une union
  fermée** et ne reprend plus rien de l'erreur réseau (ni message, ni nom). Côté notification, le lien
  est porteur de secret : il ne reste pas au journal des variables (vérifié en e2e).
- **AC-4 ✅** — un code par remède : `NON_CONFIGURE`, `INJOIGNABLE`, `JETON_REFUSE` (401),
  `HORS_PERIMETRE` (403), `REFUSEE`, `ACCUSE_ILLISIBLE`, `SANS_DESTINATAIRE`. Motif consigné :
  `CODE (HTTP nnn)`, la forme déjà lue par l'initiation.
- **AC-5 ✅** — ⚡ **les échecs du tuyau ne consomment aucune tentative.** Avant : sans variable,
  chaque tour comptait une tentative et la ligne passait `ECHEC_DEFINITIF` au cinquième — 15 s après
  le démarrage —, abandon audité et définitif. Désormais `NON_CONFIGURE`, `INJOIGNABLE`,
  `JETON_REFUSE`, `HORS_PERIMETRE` laissent la ligne `EN_ATTENTE` (motif écrit, compteur intact), et
  elle part au premier tour qui suit le câblage. Le message est **reconstruit** de la demande relue à
  chaque tour : le rejeu recopie la désignation, il ne conserve aucun message assemblé.

## Décisions prises en cours de route

1. **Le modèle `lien-de-paiement`** (socle, fr/en) : variables `nom`, `beneficiaire`, `montant`,
   `motif`, `lien`, `dateLimite` ; **e-mail et SMS, jamais in-app** (le payeur n'a pas de compte, et
   un lien dans une cloche serait un jeton partagé — AC-3 de STORY-612).
2. **Le canal** : le courriel du payeur d'abord (gratuit, lien non coupé), sinon le téléphone en SMS,
   **sans repli** de l'un sur l'autre (ce serait une décision de coût). Ni l'un ni l'autre ⇒
   `SANS_DESTINATAIRE`, abandon dès la première tentative (le payeur est figé à l'émission).
3. **L'alphabet GSM 03.38** : le montant porte une espace **ordinaire** (l'espace insécable étroite
   de la page publique bascule un SMS en UCS-2 : 70 caractères par segment au lieu de 160, facture
   doublée, sans erreur) ; les textes SMS n'ont ni tiret cadratin ni apostrophe typographique — une
   garde du catalogue le vérifie avec `premierCaractereHorsGsm7`.
4. **La langue** est fixée à `fr` (`LANGUE_DU_LIEN`) : la demande ne porte pas la langue du payeur.
   Limite assumée, à lever le jour où la saisie la portera.
5. **La date limite** : `JJ/MM/AAAA HH:MM UTC`, construite à la main (pas de formateur de locale —
   même raison que les montants, STORY-250) ; le fuseau est nommé parce que l'instant est l'émission
   plus N jours, pas une fin de journée.
6. **L'adresse de paiement** du payeur (schéma interopérable) ne sort plus du service : seuls les
   moyens de le **joindre** partent vers la notification.

## Preuves

| Contrôle | Résultat |
|---|---|
| `paiement-service` — `npx jest --runInBand` | 311 suites / **4 207 tests** |
| `paiement-service` — `npm run test:e2e -- --runInBand` | 27 suites / **335 tests** |
| `paiement-service` — lint | 0 (après `--fix` prettier sur 2 fichiers) |
| `notification-service` — `npx jest --runInBand` | 263 suites / **3 574 tests** |
| `notification-service` — `test:e2e --runInBand` | 18 suites / **264 tests** (dont 6 nouveaux STORY-644) |
| `notification-service` — lint | 0 |
| `docker compose -f docker-compose.yml config` | les trois variables rendues |

⚠️ **Ordre de fusion imposé** : `MNV-644` de **notification avant** le compose effectif. L'entrée
`paiement-service:` de `JETONS_DE_SERVICE` fait **échouer le démarrage** d'une image construite
depuis un `dev` qui ne l'a pas fusionnée (refus voulu : un appelant s'ajoute par revue de code). Le
compose racine, non versionné, porte déjà l'entrée.

✅ **Gate Docker du 2026-10-30** (recette de STORY-646, pile réelle, `dev` fusionné) : depuis le
conteneur de `paiement-service`, avec **son** jeton lu dans son environnement, `POST
/api/v1/service/envois` (modèle `lien-de-paiement`, canal e-mail) rend `200` et
`moduleAppelant: paiement-service` ; le courriel « … vous adresse une demande de paiement de
150000 XOF » arrive dans Mailhog avec le lien. La notification démarre avec l'entrée
`paiement-service:` de `JETONS_DE_SERVICE`. C'est le test `STORY-644` de
`prospera-recette/paquets/recette-croisee/recette/pile.recette.ts`.

## Ce qui reste ouvert

- Le SMS ne peut pas arriver dans la pile locale : aucune passerelle SMS n'y est configurée
  (`CANAUX_DEGRADES` à la recette du 2026-09-08). Seul le courriel est observable, dans Mailhog.
- La signature du message est la marque de l'organisation **émettrice** ; une organisation sans
  marque déclarée signe avec son nom seul.
