# STORY-610 : Les sept e-mails de compte passent par `notification-service`

Status: todo

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

- [ ] AC-1 — Les **sept** messages partent par appel direct à `notification-service`. Aucun n'est
      oublié : la liste est **énumérée** dans un test, et ajouter un huitième message sans le router
      fait rougir ce test.
- [ ] AC-2 — ⛔ **L'inscription réussit alors que `notification-service` est injoignable.** Le
      message est mis en attente et réessayé. Test avec le service coupé.
- [ ] AC-3 — Le relais local reste en place derrière un **interrupteur nommé**, comme repli explicite
      pour une version. Il est retiré dans une story ultérieure, jamais dans celle-ci.
- [ ] AC-4 — ⛔ Aucun code de vérification ni lien de réinitialisation n'est journalisé, ni dans
      `auth-service`, ni dans la charge de l'appel, ni dans une trace d'erreur.
- [ ] AC-5 — L'appel porte l'**organisation** quand elle existe, ce qui rend la passerelle de
      `STORY-604` applicable ; à défaut, l'organisation de plateforme.
- [ ] AC-6 — Le journal des envois de `notification-service` restitue ces sept messages **comme tous
      les autres** : même statut, même accusé, même mesure de coût.
- [ ] AC-7 — La **nature transactionnelle** naît du point d'entrée (AD-1) : aucun corps d'appel ne
      porte le mot, et un désabonnement ne peut pas éteindre un code de vérification.
- [ ] AC-8 — Les gabarits Handlebars quittent `auth-service` : leur contenu est **repris** dans les
      modèles système de `STORY-611`, pas réécrit de mémoire.

## Notes

⚠️ **Story à 8 points, et c'est justifié par le nombre de chemins, pas par la difficulté.** Sept
messages, deux modes de repli, une file, et un service dont toute panne est visible immédiatement par
tous les utilisateurs.

⚠️ **Ordre de livraison :** `STORY-611` **avant** celle-ci. Router vers des modèles qui n'existent
pas produirait sept envois refusés en production.
