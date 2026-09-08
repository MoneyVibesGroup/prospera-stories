# STORY-641 : Les faits d'envoi remis chez l'organisation, signés et rejouables

Status: done

**Épic :** EPIC-056 — Le premier message part : port de canal, e-mail, journal et accusés
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S40
**Prérequis :** **STORY-634** (quarantaine), **STORY-614** (vérification), **STORY-635** (rotation), **STORY-597** (le rejeu recopie)
**Origine :** rail D, bloc D3 · FR-N38, AD-17.

---

## Le récit

En tant que **distributeur**, je veux recevoir dans **mon** système ce que Prospera a envoyé pour
moi, afin de ne pas avoir à venir le lire chez vous.

## Le fait

⚠️ **C'est un appel sortant vers une adresse que le client déclare — donc une surface de
falsification et une surface de fuite.** Les deux se ferment dans la même story ou dans aucune.

## Critères d'acceptation

- [x] AC-1 — L'organisation déclare une adresse de remise ; elle est **vérifiée** avant d'être
      active, par le même mécanisme que STORY-614.
- [x] AC-2 — Chaque remise est **signée** ; le secret suit la rotation de STORY-635.
- [x] AC-3 — ⛔ Le fait remis ne porte **ni contenu rendu, ni variable, ni jeton**.
- [x] AC-4 — Une adresse injoignable entre en **quarantaine** par la règle de STORY-634 ; elle
      n'immobilise aucune file d'envoi.
- [x] AC-5 — Le rejeu **recopie** le fait, il ne le résout pas.

---

## Journal de livraison (2026-09-08) — branche `MNV-641`

**Livré :** `domain/sortie/fait-sortant.ts`, module `modules/sorties/`, l'adaptateur HTTP sortant, un
drain planifié sur sa propre file, et les deux hooks de consignation. Lint, build, unitaires et e2e
au vert.

### ⛔⛔ AC-3 tient à une PROJECTION EXPLICITE, jamais à un étalement

`corpsDuFait` recopie quatre champs nommés. Un `...source` aurait recopié ce que la source porte
aujourd'hui **et ce qu'on y ajoutera demain** : le jour où quelqu'un met une variable sur l'objet
d'entrée, elle part chez le client sans qu'aucune ligne de cette story ne change, et **sans qu'aucun
test existant ne rougisse**. Le test le prouve en contaminant l'entrée avec un corps rendu, des
variables et un jeton de désabonnement, et en vérifiant qu'aucun des trois ne sort.

⚡ Le client sait de quel message il s'agit **par l'identifiant**. Le contenu se lit sur la console
(STORY-640), authentifié — et l'y laisser est ce qui distingue une notification d'une exfiltration.

### ⛔⛔ L'adresse déclarée est une surface de FALSIFICATION DE REQUÊTE CÔTÉ SERVEUR

C'est **nous** qui appelons, avec nos accès réseau, depuis l'intérieur du programme. Un client qui
déclare `https://169.254.169.254/latest/meta-data/` ou un service voisin du programme nous ferait
faire la requête à sa place. Le contrôle est fait **à l'écriture**, avant tout appel, et il refuse
`http` en clair — même sans contenu, la seule **fréquence** des messages d'une microfinance est une
information commerciale.

⚠️ Le motif ne refuse **pas** `172.32`, qui est publique : un motif trop large aurait rejeté des
adresses parfaitement valides sans que le client puisse comprendre pourquoi.

⛔ **Et l'adaptateur ne suit AUCUNE redirection.** Un `redirect: 'follow'` aurait transformé une
adresse vérifiée en n'importe quelle autre : le client déclare une URL publique, la fait vérifier,
puis y répond `302` vers une adresse interne — et le contrôle d'adresse ne vaudrait plus rien.

### ⛔ AC-1 — une question posée, et le DÉFI doit être renvoyé

Se contenter d'un `2xx` accepterait n'importe quel serveur qui répond : un site vitrine, un proxy,
une page d'erreur bien élevée — et « vérifiée » ne voudrait plus rien dire. On poste un défi signé et
on exige qu'il revienne. Trois issues, le vocabulaire exact de STORY-614 : `VERIFIEE`, `REFUSEE`, et
`NON_VERIFIEE` **sans date** quand l'adresse est injoignable — une adresse qui ne répond pas ne dit
rien de sa validité.

⚡ **Le verdict décide de l'activation, pas l'appelant.** Une adresse non vérifiée s'enregistre — la
saisie n'est pas perdue — mais elle ne reçoit rien : sans cela, une faute de frappe se découvrirait
sur le premier fait réel, c'est-à-dire **jamais**, puisque personne ne le lirait.

### ⛔⛔ AC-4 tient au CHOIX DE LA FILE, pas à une temporisation

Les faits attendent dans une **collection**, et le drain vit sur une **file à part**. Poser ces
travaux dans l'une des trois files d'AD-13 aurait fait qu'un client dont le point de terminaison
répond en trente secondes occupe les exécutants qui doivent partir chez ses destinataires — et le
défaut se serait vu **chez les autres clients**, jamais chez lui.

⚡ **Et une organisation qui échoue est sautée pour le reste du passage.** Réessayer ses cinquante
faits contre le même mur aurait vidé le lot sans en remettre un seul. La quarantaine reprend le
seuil et l'idempotence par filtre de STORY-634.

⚠️ **La quarantaine vit sur la destination, pas dans `quarantaines_passerelle`.** Une adresse de
client n'est pas un canal : elle n'a ni tarif, ni expéditeur, ni repli de plateforme, et sa panne
n'empêche **aucun** message de partir. Les mêler aurait fait apparaître un sixième « canal » dans la
santé et dans les compteurs.

### ⛔ AC-5 — le rejeu RECOPIE, et c'est la règle de STORY-597 sur un autre objet

Un rejeu qui relirait l'`Envoi` pour reconstruire le fait remettrait le statut **d'aujourd'hui** en
le datant d'hier : le client verrait un fait qui n'a jamais eu lieu à ce moment-là. La ligne
d'origine est recopiée telle quelle, avec sa date, et elle n'est pas touchée.

⚠️ `rejeuDe` fait partie de la clé d'unicité, sinon un rejeu serait impossible : il porte exactement
les mêmes envoi, canal et statut que la ligne qu'il recopie. C'est le patron du champ `tentative` de
l'`Envoi` (STORY-579).

### ⚡ La signature porte sur la CHAÎNE transmise

Leçon symétrique de STORY-579 : `JSON.parse` puis `JSON.stringify` ne rend pas la même chaîne, et un
client qui vérifie sur ce qu'il reçoit ne retrouverait pas une empreinte calculée sur autre chose. Le
port reçoit donc le corps **déjà sérialisé** et sa signature — lui passer un objet l'aurait laissé le
sérialiser lui-même.

⚠️ Le nom du secret est **distinct** de celui des webhooks entrants : le même dans les deux sens
ferait qu'une fuite côté client donne le droit de nous **mentir** sur une remise, en plus de lire nos
faits.

### ⚡ Une seule consignation par statut, et seulement quand il AVANCE

L'unicité `(organisation, envoi, statut, rejeu)` fait qu'un accusé rejoué par une passerelle — le cas
**normal** — ne remet pas deux fois le même fait. Et la boîte d'accusés ne consigne que si le statut
a **avancé** : une rafale inversée sur WhatsApp aurait sinon envoyé trois « délivré » pour un seul
message.

⚠️ **Coût assumé et nommé** : une lecture indexée par transition de statut, sur une collection d'un
document par organisation. L'éviter aurait demandé un cache, donc une fenêtre pendant laquelle une
destination retirée continue de recevoir.

### ⚠️ Dixième rattrapage de la garde de suppression complète

`destinations_sortantes` et `faits_a_remettre` partent avec l'organisation. Leur effacement est
**sans perte** : ce qui prouve durablement qu'un message est parti vit dans `audit_envois` (AD-14),
qui n'est pas touchée. Ce qu'on efface ici est une commodité de transport.

### ⚠️ Points ouverts

- Le contrôle d'adresse porte sur **l'hôte écrit**, avant toute résolution DNS. Un nom public qui
  résout vers une adresse privée n'est pas fermé — cela demande une résolution au moment de l'appel,
  et un contrôle de l'adresse résolue. C'est nommé, pas fait.
- Le **rattrapage de rotation** du secret de signature n'est pas branché sur la remise : la fenêtre
  est stockée, la remise signe avec le secret courant. Un client qui tourne son secret doit accepter
  les deux de son côté pendant la fenêtre.
- Aucune conformité Docker : la file du drain et sa planification sont prouvées par test sur les
  options, jamais contre un vrai Redis.
