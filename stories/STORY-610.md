# STORY-610 : Les sept e-mails de compte passent par `notification-service`

Status: done

**Épic :** EPIC-054 — Permissions au catalogue et cloisonnement des passerelles
**Service :** `auth-service` *(⚠️ hors `notification-service`)*
**Points :** 8 · **Sprint :** S36
**Prérequis :** **STORY-604** (passerelle par organisation), **STORY-611** (modèles système)
**Origine :** revue d'architecture du 2026-09-06 · AD-2 (`notification`), FR-N54.

---

## Le récit

En tant qu'**organisation cliente**, je veux que le **premier** message reçu par mon utilisateur
porte **ma** marque, afin que l'expérience ne commence pas par un e-mail de Prospera.

## Le fait

⛔ **Le tout premier message qu'un utilisateur reçoit échappe entièrement à la notification.**
`auth-service` possède son propre relais, sa propre file et ses propres gabarits Handlebars, et il
envoie **sept** messages : vérification d'adresse, invitation, confirmation de changement d'adresse,
alerte de changement, alerte d'adresse déjà prise, réinitialisation de mot de passe, confirmation de
réinitialisation. Aucun ne peut porter la marque d'une organisation, et aucun n'apparaît dans le
journal des envois.

⚡ **L'appel est DIRECT, et c'est AD-2 qui le décide, pas une préférence de style.** Ces messages
portent des **codes et des liens à usage unique** : ils sont exactement ce que le bus n'a pas le
droit de transporter. `STORY-607` a figé cette règle.

⛔ **Le sens des dépendances est le risque de cette story, et il faut le nommer.**
`auth-service` est la **racine** du graphe : `notification-service` en est une feuille, qui vérifie
les jetons avec sa clé publique. Faire appeler la feuille par la racine est acceptable **à une seule
condition** : que cet appel ne puisse **jamais** empêcher la création d'un compte. Une inscription
qui échoue parce que le service de notification est en panne serait une régression franche par
rapport à aujourd'hui.

⚠️ **Une inscription peut précéder toute organisation.** Un utilisateur qui crée son compte n'a pas
encore d'organisation, donc pas de passerelle. L'identité d'envoi est alors celle de **Money Vibes**,
qui est une organisation comme une autre depuis `STORY-289`.

## Critères d'acceptation

- [x] AC-1 — Les **sept** messages partent par appel direct à `notification-service`. Aucun n'est
      oublié : la liste est **énumérée** dans un test, et ajouter un huitième message sans le router
      fait rougir ce test.
- [x] AC-2 — ⛔ **L'inscription réussit alors que `notification-service` est injoignable.** Le
      message est mis en attente et réessayé. Test avec le service coupé.
- [x] AC-3 — Le relais local reste en place derrière un **interrupteur nommé**, comme repli explicite
      pour une version. Il est retiré dans une story ultérieure, jamais dans celle-ci.
- [x] AC-4 — ⛔ Aucun code de vérification ni lien de réinitialisation n'est journalisé, ni dans
      `auth-service`, ni dans la charge de l'appel, ni dans une trace d'erreur.
- [x] AC-5 — L'appel porte l'**organisation** quand elle existe, ce qui rend la passerelle de
      `STORY-604` applicable ; à défaut, l'organisation de plateforme.
- [x] AC-6 — Le journal des envois de `notification-service` restitue ces sept messages **comme tous
      les autres** : même statut, même accusé, même mesure de coût.
- [x] AC-7 — La **nature transactionnelle** naît du point d'entrée (AD-1) : aucun corps d'appel ne
      porte le mot, et un désabonnement ne peut pas éteindre un code de vérification.
- [x] AC-8 — Les gabarits Handlebars quittent `auth-service` : leur contenu est **repris** dans les
      modèles système de `STORY-611`, pas réécrit de mémoire.

## Notes

⚠️ **Story à 8 points, et c'est justifié par le nombre de chemins, pas par la difficulté.** Sept
messages, deux modes de repli, une file, et un service dont toute panne est visible immédiatement par
tous les utilisateurs.

⚠️ **Ordre de livraison :** `STORY-611` **avant** celle-ci. Router vers des modèles qui n'existent
pas produirait sept envois refusés en production.

---

## Livré le 2026-10-28 — deux branches `MNV-610`

| Dépôt | Branche | Commits | Vérifications |
|---|---|---|---|
| `prospera-notification-service` | `MNV-610` | `774b81b` | 3 521 unitaires · 258 e2e · lint 0 · build |
| `auth-service` | `MNV-610` | `4b79639`, `0a41634` | 925/926 unitaires (¹) · 222 e2e · lint 0 · build |

(¹) Le seul rouge est `PasswordService` (hachage bcrypt) : délai dépassé sous charge parallèle, vert seul
(3/3), sans lien avec cette story. ⚠️ `auth-service` n'avait aucun `node_modules` sur ce poste (`npm ci`).

### ⚡⚡ Arbitrage PO — AD-2 amendé (spine, 2026-10-27)

Trois des sept messages — **alerte de changement d'adresse, alerte d'adresse déjà prise, confirmation de
réinitialisation** — ne portent aucun secret. La route directe de STORY-589 les refusait (AC-1 binaire),
et le bus ne pouvait pas les porter : **aucun événement du programme ne porte l'adresse du
destinataire** (STORY-588) et `notification-service` refuse de détenir celle des membres (AD-12). Ils
n'avaient donc **aucun chemin**. Décision : la route directe n'est plus *réservée* aux secrets, elle leur
est *obligatoire* ; elle sert les **messages de service**, chaque appelant borné à son périmètre de clés
(`CLES_MESSAGES_DE_COMPTE` pour `auth-service`). L'invariant qui protège — un secret ne touche jamais le
bus — est intact : la route d'un utilisateur et les règles du bus refusent toujours ces propos.

### Critères

- **AC-1** — Le `MailProcessor` remet les **sept** travaux de la file `mail` à
  `POST /api/v1/service/envois`. Table **énumérée** (`messages-de-compte.ts`) : un huitième travail sans
  sa ligne fait rougir `messages-de-compte.spec.ts`. Les variables envoyées sont confrontées au contrat
  du socle (`VARIABLES_ATTENDUES`, STORY-611) ; les durées annoncées sont lues de la **même**
  configuration que les jetons (24 h ⇒ `expirationMinutes: 1440`).
- **AC-2** — L'inscription ne dépend pas de notification : la file `mail` répond avant ; un échec fait
  échouer le **travail**, que BullMQ rejoue (5 essais, backoff). La clé d'idempotence est l'identifiant
  du travail (`auth:<travail>:<id>`) : un réessai après une réponse perdue ne double pas le courriel. Un
  `4xx` est **définitif** (`UnrecoverableError` : inutile de rejouer cinq fois un refus), un `5xx` ou une
  panne se rejoue. ⚠️ Prouvé par test du processeur et du client ; **pas** contre un service réellement
  coupé (gate Docker, tenue par la session de STORY-590).
- **AC-3** — Le relais local reste derrière l'interrupteur nommé `MAIL_TRANSPORT=smtp` ; il n'est **pas**
  choisi par défaut ni en cas de configuration absente (un notification non configuré fait échouer le
  travail, il ne bascule pas en silence).
- **AC-4** — Le client ne journalise rien ; ses erreurs ne portent ni lien, ni adresse, ni jeton
  (testé sur 500, 422 et panne réseau dont le message recopie le lien).
- **AC-5** — L'invitation porte l'organisation qui invite (`orgId` ajouté au travail) ; les autres
  partent sous l'organisation de plateforme (`ORGANISATION_PLATEFORME_ID` côté notification).
- **AC-6** — Ce sont des `Envoi` ordinaires côté notification : même journal, même accusé, même coût.
- **AC-7** — Aucun corps ne porte `nature` ni `moduleAppelant` (testé) : la nature naît du point d'entrée,
  le module du jeton.
- **AC-8** — Aucun texte dans `auth-service` : les gabarits `.hbs` restent **intacts** pour le repli, leur
  contenu vit au socle (STORY-611).

### Configuration

`auth-service` : `NOTIFICATION_BASE_URL`, `NOTIFICATION_JETON_SERVICE` (= l'entrée `auth-service:` de
`JETONS_DE_SERVICE` côté notification), `NOTIFICATION_DELAI_MS`, `MAIL_TRANSPORT`. Le `docker-compose`
racine (hors git) est posé par la session de STORY-590, pour les deux stories.

### ⛔ Ouvert

- Le client de `paiement-service` (STORY-608) lit `envoiId` dans la réponse de notification, qui rend
  `id` : ses remises seraient toutes « illisibles ». Hors périmètre, signalé.
- Le retrait du relais local, de `nodemailer` et des `.hbs` relève de STORY-590.
