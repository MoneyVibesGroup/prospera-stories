# STORY-665 : Le secret de notification après la déclaration, et deux secrets pendant la bascule

Status: done

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 5 · **Sprint :** ⚠️ **NON SLOTTÉE** — `PLAN-PI-SPI-CAS-D-USAGE-2026-09-15`, phase A
**Prérequis :** **STORY-660** (les notifications signées PI-SPI), **STORY-256** (la clef de
vérification et le second scellé)
**Origine :** défaut EXISTANT relevé à la clôture de STORY-660 — **aucune route ne pose la clef de
vérification d'un compte déjà déclaré**, alors qu'aucun fournisseur ne la rend avant.

---

## Le fait

La clef avec laquelle un fournisseur signe ses notifications n'entre dans le service qu'**à la
déclaration du compte** (`POST /v1/comptes-encaissement`, champ `secretNotification`). Or :

- **PI-SPI** ne rend le secret qu'à la **création du webhook**, et l'URL du webhook contient
  l'identifiant du compte — donc elle n'existe qu'**après** la déclaration ;
- **FedaPay** ne le rend qu'au tableau de bord, quand l'organisation y colle cette même URL.

⛔⛔ **LE CHEMIN NOMINAL ÉTAIT INFAISABLE, ET AUCUN TEST NE POUVAIT LE DIRE.** Un compte déclaré
sans clef encaisse — mais aucune notification ne le fera jamais progresser, et le refus qui le dit
(`COMPTE_SANS_CLEF_NOTIFICATION`) arrive chez le fournisseur, pas chez l'organisation. Le
contournement de STORY-660 (déclarer un webhook sur une URL provisoire pour obtenir le secret, puis
corriger l'URL) n'est pas un chemin : c'est une manœuvre qu'aucune organisation ne devinera.

⚡ **ET LE SECRET DU SCHÉMA A UNE ÉCHÉANCE.** La documentation PI-SPI donne au secret d'un webhook
une date d'expiration (`dateExpirationSecret` dans le guide, `dateExpiration` dans la spécification —
elle se contredit) et le renouvellement impose d'**accepter les deux** jusqu'au terme de l'ancien.
Un service qui n'accepte qu'une clef à la fois perd toutes les notifications émises pendant la
bascule — c'est-à-dire des encaissements réels, le jour même de la rotation.

⛔ **« Retirer l'ancienne clef au premier succès de la nouvelle » ne se termine jamais** (arbitrage
repris de `notification-service`) : tant que le fournisseur ne signe pas avec la nouvelle, aucun
succès n'arrive, et la bascule reste ouverte indéfiniment. Ce qui ferme une bascule est une
**durée**, jamais un événement qu'on attend.

## Critères d'acceptation

- [x] AC-1 — Une route dépose la clef de vérification d'un compte **déjà déclaré** (droit
      `paiement:compte:administrer`, gate d'AD-16, cloisonnement par l'organisation du jeton). La
      clef entre au coffre sous le lien de notification, n'est **restituée par aucun chemin**, et le
      dépôt est consigné dans la chaîne d'audit du compte — le **fait**, jamais la valeur.
- [x] AC-2 — Déposer une clef sur un compte qui en porte déjà une ouvre une **bascule** : l'ancienne
      reste acceptée jusqu'à `min(son échéance déclarée, instant de bascule + plafond)`, la nouvelle
      l'est immédiatement. Une notification signée de l'**une ou de l'autre** est vérifiée, rangée et
      constatée une seule fois. L'échéance déclarée ne peut que **retrancher**.
- [x] AC-3 — Passé ce terme, l'ancienne cesse d'être acceptée **par lecture** — comparaison à
      l'instant, aucune tâche planifiée, aucune écriture différée. Un **premier** dépôt (compte sans
      clef) n'ouvre aucune bascule.
- [x] AC-4 — L'organisation lit **l'adresse à déclarer chez son fournisseur** et l'état de sa clef
      (présence, échéance, bascule en cours) — jamais la clef. Sans cette adresse, AC-1 n'a pas
      d'objet : l'URL porte l'identifiant du compte, que seule cette API connaît.
- [x] AC-5 — Recette **réelle** : tunnel public, webhook créé chez le schéma sur l'adresse du compte,
      secret déposé par AC-1, paiement du bac à sable → notification signée **reçue**, vérifiée,
      encaissement constaté, demande soldée.
- [x] AC-6 — **Mesure consignée** : le webhook et la consultation (STORY-670) d'une **même** demande
      désignent-ils le même paiement ? La réponse est écrite ici. Elle conditionne la levée — dans
      une story ultérieure, jamais dans celle-ci — de la règle-donnée de STORY-670.

## Ce que cette story ne fait pas

- Elle **ne crée pas** le webhook chez le fournisseur. Le raccordement d'une organisation à PI-SPI
  (identifiants client, clé d'API, déclaration du webhook) est [[STORY-666]] ; ici, le webhook est
  créé à la main pendant la recette, comme le SHID l'a été en STORY-661.
- Elle **ne retire pas** une clef. Un compte dont la clef part cesse d'être notifiable, ce qui est le
  contraire du but.
- Elle **ne change pas** la règle de STORY-670 (un compte avec clef ne se constate que par webhook).
  AC-6 la mesure, il ne la tranche pas.


## Livraison (2026-09-16)

- [x] AC-1 à AC-6 — branche `MNV-665`, sur `origin/dev` (670 fusionnée).
- `PUT /v1/comptes-encaissement/:compteId/secret-de-notification` ;
  `domain/comptes/clef-de-notification.ts` (plafond de bascule 30 j,
  `termeDeLaBascule`, `clefPrecedenteAcceptee`, `lireEcheanceAnnoncee`) ;
  `SecretDuCompte.deposerLaClefDeNotification` et `comptesQuiVerifient` ;
  `urlDeNotification` ; bloc `notifications` de la vue d'un compte.
- Suites : 3 445 unitaires, 269 e2e, 27 conformité, lint 0.

### Trois défauts que l'écriture a trouvés

- ⛔⛔ **L'identifiant du compte doit être NORMALISÉ avant d'entrer dans le lien
  du scellé.** Le lien est reconstruit à l'ouverture depuis `_id.toString()` —
  hexadécimal minuscule. Sceller sous la graphie reçue dans l'URL (un client qui
  la met en majuscules est légitime) aurait produit un lien que la vérification
  ne reforme jamais : clef déposée, compte déclaré vérifiable, et **toutes** les
  notifications refusées pour une raison introuvable.
- ⚡ **Un troisième champ scellé doit rejoindre la garde de STORY-243 le jour où
  il naît.** STORY-256 l'avait écrit pour le second ; le troisième arrive deux
  stories plus tard et vérifie de vraies notifications pendant la rotation.
- ⚡ **Seul un refus de SIGNATURE autorise à essayer la seconde clef.** Rattraper
  « toute erreur » aurait rejoué un corps déjà authentifié mais mal formé contre
  l'ancienne clef, et rendu « signature invalide » là où la cause est une forme.

### La recette réelle (tunnel ngrok → bac à sable PI-SPI)

Tunnel sur le service, webhook créé chez le schéma **sur l'adresse que notre API
annonce**, secret déposé par AC-1, demande d'abonnement de 200 XOF payée par
l'utilisateur dans l'application du payeur.

- AC-5 : la notification signée est arrivée par le tunnel, l'encaissement est
  constaté et la demande **Soldée** — **sans qu'aucune consultation ne tourne**.
- AC-2 : rotation **réelle** du secret chez le schéma, puis rejeu des **octets
  authentiques signés par l'ancienne clef** → `204`, et aucun encaissement de
  plus.
- AC-3 : terme de bascule avancé dans le passé (fixture) → la même preuve rend
  `401 SIGNATURE_INVALIDE`, et la bascule disparaît de la vue **sans qu'aucune
  écriture ne l'efface**.

### Ce que le schéma nous a appris (mesuré, la doc ne le dit pas)

- Portées : `webhook.read`, `webhook.write`, `webhook.delete` (toute autre
  graphie → `invalid_scope`). Les webhooks vivent sous `/{participant}` : sous
  `/v1` la liste est **vide** (même piège que STORY-661).
- `POST /webhooks` n'accepte **que** `callbackUrl` (`events` en plus → 400) et
  rend `{ id, callbackUrl, events: [], dateCreation, secret }`. ⛔ **Aucune
  `dateExpirationSecret`** : la date que la doc promet n'existe pas dans la
  réponse — d'où l'échéance **facultative** de notre route.
- ⛔ `GET /webhooks/{id}` ne rend **pas** le secret : le guide le promettait, la
  spécification ne le listait pas, et c'est la spécification qui a raison. Le
  secret n'existe qu'à la création — c'est toute la raison de cette story.
- ⛔ Deux webhooks ne peuvent pas partager une URL (`409`, « l'url est déjà
  utilisée ») : une rotation passe par **suppression puis création**, ce qui est
  exactement la fenêtre où les deux clefs doivent valoir.

### AC-6 — la mesure, et elle tranche dans l'autre sens

Pour **un seul** paiement, les deux chemins produisent **deux clefs d'unicité** :

| Chemin | Clef | Pourquoi |
| --- | --- | --- |
| Webhook | `API_BUSINESS\|PAIEMENT_RECU:6aa9ebab0d0e21b43fa904be` | l'événement ne porte **pas** d'`end2endId` — champs mesurés : `evCode`, `montant`, `client`, `alias`, `txId` |
| Consultation | `API_BUSINESS\|PAIEMENT_RECU:ETGD99920260916010655CgfGvGiDJY0rLH` | `GET /demandes-paiements/{txId}` rend un `end2endId`, et la dérivation le préfère |

⛔⛔ **La prudence du PO était justifiée** : les deux ensemble auraient compté le
même versement **deux fois**, sans qu'aucune barrière d'idempotence ne s'en
aperçoive. La règle-donnée de [[STORY-670]] **RESTE**.

⚡ **Remède nommé, et reporté** : unifier la dérivation sur le seul identifiant
présent des deux côtés (`txId`). Ce n'est pas gratuit — sur un paiement
**spontané** (QR imprimé, [[STORY-667]]) le `txId` n'est pas nôtre, et STORY-660
avait choisi l'`end2endId` d'abord pour distinguer un paiement reçu de
l'annulation qui le visera. → **story à part, arbitrage PO**.

## Points ouverts

- L'événement réel ne porte **ni `evDate` ni `end2endId`** : l'attestation n'a donc
  pas d'horodatage du fournisseur, et `survenuLe` reste absent. À confirmer sur un
  participant de production.
- `events: []` à la création : rien dans l'API ne permet de choisir les
  événements, et la liste vide se comporte comme « tous ». Non documenté.
- Le webhook est **général** au raccordement (le 409 parle d'« un webhook
  général ») : avec un raccordement par organisation ([[STORY-666]]), une URL par
  compte suppose autant de webhooks — à vérifier avant de la construire.
- mTLS de la route de rappel : toujours ouvert (hérité de STORY-660).

## Notes

- Voir [[STORY-660]], [[STORY-670]], [[STORY-256]], [[STORY-243]], [[STORY-666]].
