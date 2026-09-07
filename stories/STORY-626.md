# STORY-626 : La réponse est routée vers le module qui avait parlé

Status: done

**Épic :** EPIC-064 — La conversation dans les deux sens
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S37
**Prérequis :** **STORY-625** (réception du message entrant)
**Origine :** rail B, bloc B4 · AD-10, AD-19, FR-N44, FR-N45.

---

## Le récit

En tant que **module Relance**, je veux recevoir les réponses aux messages que j'ai fait envoyer,
afin de savoir qu'un client a répondu sans avoir à surveiller une boîte que je ne possède pas.

## Le fait

⚡ **Le contexte vient de l'envoi d'origine, jamais du contenu du message.** Lire l'intention dans
le texte serait une devinette sur le chemin de l'argent : *« oui »* répond à une promesse de
paiement comme à une campagne.

⚠️ **L'inbox du Studio social est un CONSOMMATEUR de ce flux, pas son propriétaire** (FR-N44).

## Critères d'acceptation

- [x] AC-1 — Le module destinataire est celui qui a demandé l'envoi d'origine.
- [x] AC-2 — La réponse fait passer l'envoi d'origine au statut **répondu** (FR-N45).
- [x] AC-3 — Aucun module ne lit la collection des messages entrants : il consomme.

---

## Ce que la livraison a appris (2026-09-07)

**Branche :** `MNV-626`, empilée sur `MNV-625`.

### ⚡⚡ Le routage et l'avancement du statut sont DEUX décisions, et les confondre fait taire la bonne

C'est le cœur de la story, et l'erreur naturelle est d'écrire *« si le statut avance, on publie »*.

Une réponse qui arrive sur un envoi marqué `echoue` est **précisément celle que le module doit
voir** : elle prouve que le message est arrivé alors que notre trace disait le contraire. Lier la
publication à l'avancement aurait fait taire la seule information qui corrige l'erreur — et l'aurait
fait taire silencieusement, puisque le message serait quand même rangé en base.

⛔ **Et le statut, lui, ne recule pas pour autant.** `echoue` et `ecarte` sont **absorbants**
(STORY-579) : un fait constaté ne se perd pas parce qu'un état refuse de bouger. C'est l'`Envoi` qui
garde sa mémoire, pas la réponse qui perd la sienne.

### ⚡ `repondu` existait depuis STORY-579 et n'avait jamais été atteint

Le sommet de la chaîne de progression était écrit, documenté, testé dans la projection — et aucun
chemin de code ne l'écrivait. Cette story est le premier. ⚠️ **La transition passe par le FILTRE de
la requête, jamais par un `if`** : deux réponses concurrentes sur le même envoi ne peuvent pas
franchir toutes les deux la transition, et c'est Mongo qui arbitre (STORY-258).

### ⚡ Le topic était déclaré depuis STORY-570 et n'avait jamais porté un seul message

`notification.reponse.recue` attendait depuis le scaffold. En le branchant, **son contrat s'est
révélé faux sur deux points**, et aucun test ne pouvait le dire tant que rien ne publiait :

1. **Il ne portait aucun `moduleDestinataire`** — c'est-à-dire aucun moyen pour un consommateur de
   savoir si l'événement le concerne. Le champ est ajouté, et **requis** : ⚡ *un événement de
   routage qui ne sait pas où il va n'est pas publié du tout*. Le message entrant, lui, reste
   conservé dans tous les cas (STORY-625, AC-4) — ce qui est conditionnel est le routage, jamais la
   conservation.
2. **Son énumération de certitude disait `confirme` / `probable` / `declare`**, là où STORY-625 a
   arrêté `certain` / `aucun`. ⚡ **Rétrécir une énumération est normalement interdit sous
   `BACKWARD` — sauf qu'ici il n'y avait rien à protéger** : la compatibilité protège des données
   qui existent, et ce topic n'en avait aucune. L'élargir plus tard reste compatible.

⛔ **Le texte du client ne monte PAS sur le bus.** Un topic est durable, rejouable et lisible par
tout consumer group : la phrase qu'un client a écrite y resterait pour toujours. Le module reçoit
une **désignation** et vient chercher ce qu'il lui faut — c'est la même règle que le `contactId` de
`desabonnement.enregistre`.

### ⚡ La garde d'AC-3 porte sur le MODÈLE, pas sur le nom de collection

« L'inbox est un consommateur, pas un propriétaire » n'est pas une intention : c'est une propriété
qui se vérifie. Elle ne tient pas parce qu'on a décidé de ne pas y toucher, elle tient parce
qu'aucun autre fichier n'a le moyen de le faire.

⚠️ **Mais le nom `messages_entrants` doit rester lisible ailleurs** : l'inventaire de suppression
efface **par nom de collection** (STORY-587), et l'en exclure aurait fait sortir les messages
entrants de la promesse « aucune donnée d'un client résilié ne survit ». Ce qui trahit une lecture
est l'import du schéma ou l'injection du modèle — deux formes **exécutables**, jamais un mot.

### ⛔ Point ouvert MAJEUR : AD-10 décrit TROIS niveaux, le rail n'en implémente que deux

AD-10 énonce une cascade en trois temps :

1. le canal transporte une référence ⇒ rattachement **`CONFIRME`** vers le `moduleAppelant` — *c'est
   cette story* ;
2. une conversation ouverte existe pour `(contact, canal)` ⇒ rattachement **`PRESUME`** vers le
   module du dernier `Envoi` — **aucune story du rail ne le couvre** ;
3. sinon ⇒ **`ABSENT`** et destination par défaut de l'organisation — *c'est STORY-627*.

⚠️ **Le niveau 2 n'a pas été supprimé par décision : il est tombé dans un trou entre deux fiches.**
STORY-625 a écrit deux niveaux en refusant `presume`, avec un argument réel — *une présomption
affichée finit toujours par être lue comme un fait*. Mais **AD-10 avait déjà répondu à cette
objection** par sa règle miroir : *aucun module ne déclenche d'automatisme sur un rattachement
`PRESUME` ; il peut l'afficher à un humain, il ne peut pas en déduire un fait métier* — exactement
le patron du « lu » d'AD-5.

⛔ **Ce qui est en jeu est le SMS**, c'est-à-dire le canal qui reçoit des réponses et ne dit jamais à
quoi elles répondent. Sans le niveau 2, la réponse d'un client par SMS n'est jamais montrée à côté
de la relance qu'elle prolonge — même pas à un humain qui saurait la lire. C'est une perte de valeur
produit, pas une simplification technique.

**Rien n'a été inventé ici** : implémenter la règle 2 sans fiche aurait été exactement la
ressemblance que STORY-625 a refusée. La question revient au PO — soit une story pour le niveau
`presume`, soit un amendement écrit d'AD-10 qui l'assume. L'énumération du contrat a été rétrécie à
ce qui est **réellement produit**, et l'élargir reste compatible `BACKWARD`.

### ⛔ Points ouverts légués

1. **Une réponse non rattachée ne part vers personne** : elle est conservée, elle n'est pas routée.
   C'est STORY-627, et c'est pourquoi `moduleDestinataire` est optionnel dans le retour du service
   mais **requis** dans le contrat du topic.
2. **Le « STOP » n'est pas encore intercepté** : AD-10 le veut traité **avant** la cascade de
   rattachement. Aujourd'hui un « STOP » part chez le module comme une réponse ordinaire. C'est
   STORY-628, et c'est un trou **ouvert** d'ici là.
