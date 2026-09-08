# STORY-634 : La passerelle en échec passe en quarantaine, et quelqu'un décide

Status: done

**Épic :** EPIC-054 — Permissions au catalogue et cloisonnement des passerelles
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S38
**Prérequis :** **STORY-633** (liste de suppression), rail B (**STORY-605** repli nommé, **STORY-614** vérification, **STORY-616** santé des canaux)
**Origine :** rail D, bloc D1 · AD-6, FR-N55.

---

## Le récit

En tant qu'**exploitant**, je veux qu'une passerelle en panne cesse d'être appelée, afin qu'une file
ne se vide pas contre un mur.

## Le fait

⚡ **STORY-616 publie la santé et ne décide de rien — c'est écrit, et c'est juste.** La décision est
un autre objet, et ce découplage est ce qui empêche une sonde de couper un canal sain. La
quarantaine se déclenche sur des **remises réellement échouées**, jamais sur une sonde.

## Critères d'acceptation

- [x] AC-1 — N échecs techniques consécutifs sur la passerelle **d'une organisation** la mettent en
      quarantaine ; le compteur est par organisation × canal, jamais global.
- [x] AC-2 — En quarantaine, la remise emprunte le **repli de plateforme nommé** de STORY-605 quand
      l'organisation l'autorise, et **échoue en le disant** quand elle ne l'autorise pas.
- [x] AC-3 — ⛔ Un refus **métier** n'incrémente **rien**.
- [x] AC-4 — La sortie de quarantaine passe par la **vérification** de STORY-614, pas par un délai.
- [x] AC-5 — L'entrée et la sortie sont des faits tracés, visibles dans la santé par organisation.

---

## Journal de livraison (2026-09-08) — branche `MNV-634`

**Livré :** `domain/passerelle/quarantaine.ts`, `QuarantainePasserelle`, `QuarantaineService`,
`PortQuarantaine`, un sixième état de canal `EN_QUARANTAINE`, et le branchement dans le chemin réel
de remise. Lint, build et suite unitaire au vert.

### ⛔⛔ Le seuil est fixé par une CONTRAINTE, pas par un goût

`SEUIL_QUARANTAINE` vaut dix, et la raison n'est pas esthétique : la file transactionnelle rejoue
une remise jusqu'à **cinq** fois. Un seuil de cinq ou moins ferait qu'un **unique message
malchanceux** — une coupure réseau de dix secondes pendant ses cinq tentatives — mettrait en
quarantaine le canal de toute une organisation. Le défaut serait spectaculaire et quasiment
indiagnosticable : le canal se ferme, le client appelle, et rien dans les journaux ne dit qu'un seul
message en est responsable. Dix veut donc dire *« au moins deux messages distincts ont épuisé leurs
essais »* — ce qui n'est plus un incident.

⚡ Le test le vérifie **contre la configuration réelle** (`files.essaisTransactionnel`), pas contre
une constante recopiée : le jour où quelqu'un porte les essais à quinze, c'est ce test qui le dira.

### ⛔ AC-3 tient au POINT D'APPEL, pas à une condition

Le comptage a lieu dans `executerRemise`, sur le **refus typé**. Une ligne plus bas,
`classerErreurDeRemise` a transformé le refus en `UnrecoverableError` et la nature a disparu — il ne
resterait qu'un code en chaîne. Or c'est la nature qui décide : compter sur un texte aurait fermé un
canal parfaitement sain le jour où un client importe un fichier d'adresses fautif, c'est-à-dire au
moment précis où il a le plus besoin d'envoyer. Un test envoie **cinq cents** refus métier d'affilée
et vérifie qu'aucun document n'est même créé.

⚠️ **Et un refus métier ne remet pas non plus à zéro.** Le faire aurait donné à ce même client le
pouvoir d'effacer, sans le savoir, la trace d'une panne en cours.

### ⛔⛔ Un SUCCÈS rompt la série, mais ne fait PAS sortir de quarantaine

C'est la dissymétrie qui organise le service, et elle n'est pas intuitive. Pendant une quarantaine,
un envoi qui passe ne peut venir que du **repli de plateforme** (AC-2) : il ne dit donc rien de la
passerelle du client. Sortir sur ce succès rouvrirait le canal en panne à chaque message servi par
le repli — c'est-à-dire en permanence, et la quarantaine n'existerait plus.

### ⛔ La sortie par un DÉLAI aurait rouvert le canal sur une panne qui dure

« Après dix minutes, réessayons » n'apprend rien : si le relais est toujours mort, la file se revide
contre le même mur, et le cycle recommence indéfiniment. La vérification de STORY-614 **pose une
question** et reçoit une réponse — c'est la seule chose qui distingue *« le temps a passé »* de
*« ça remarche »*. Et seul le verdict `VERIFIEE` lève : `NON_VERIFIEE` veut dire qu'on n'a pas pu
demander, c'est-à-dire exactement l'état qui a produit la quarantaine. Une garde vérifie qu'aucune
méthode du service ne porte de durée, de délai ni de TTL — la sortie automatique est
**inexprimable**.

### ⚡ La quarantaine GAGNE sur un verdict de vérification favorable

Une passerelle dont la dernière vérification a réussi mais dont dix remises ont échoué d'affilée
n'est pas « saine » : le verdict date **d'avant** la panne. Afficher `SAIN` sur un canal qui
n'envoie plus rien est exactement le mensonge que STORY-616 existait pour éviter. En revanche un
canal **désactivé** reste désactivé : le geste attendu est « réactiver », pas « réparer le relais ».

⚠️ **L'invariant d'AC-2 de STORY-616 tient toujours** : ce qu'il interdisait était un appel
**sortant** déclenché par l'affichage d'une page. Lire une collection de plus n'en est pas un — la
quarantaine, elle aussi, publie ce qui a été constaté ailleurs.

### ⛔⛔ Le test a trouvé un vrai défaut dans le code de production

Le port promet de ne jamais lever ; `executerRemise` faisait confiance à la promesse. Le test
« une quarantaine en panne ne change pas la nature de l'échec » a montré que `mongo down` remontait
**à la place du refus d'origine** : l'`Envoi` aurait été journalisé sous un motif qui ne dit rien du
message, et un refus **définitif** serait devenu **rejouable** — cinq tentatives de plus pour une
adresse invalide. Le remède est le patron de la radiation de STORY-622 : l'effet de bord ne peut
faire échouer que lui-même.

⚡ **Et le chemin du SUCCÈS était pire.** Une panne de compteur y aurait transformé une remise
**déjà acceptée par la passerelle** en travail en échec : BullMQ l'aurait rejouée, et le
destinataire aurait reçu le message deux fois, facturé deux fois.

### ⚠️ Trois gardes existantes ont rougi ; deux avaient raison

- `purete-du-domaine` : le test du seuil importait la configuration depuis `src/domain`. **La garde
  a raison** — c'est le test qui déménage vers la couche module, pas la règle qui s'assouplit.
- `suppression-complete` (STORY-587), **septième rattrapage** : `quarantaines_passerelle` porte un
  `organizationId` et devait être déclarée. Elle part avec l'organisation, comme la configuration
  qu'elle décrit ; l'état initial vivant dans l'absence de document, une organisation recréée
  retrouve un canal ouvert — ce qui est exact, puisqu'elle aura reconfiguré sa passerelle.
- La troisième était une erreur de typage de ma part, corrigée.

### ⚠️ Points ouverts

- La quarantaine n'a **aucune surface d'écriture manuelle** : on n'en sort que par la vérification.
  Ouvrir une levée d'exploitation serait une décision PO, et elle rejouerait le débat du délai.
- Aucune conformité Docker : l'idempotence de l'entrée est prouvée par test, jamais contre un vrai
  Mongo.
- Le repli de quarantaine consomme la politique d'identité de STORY-605 **telle quelle**. Une
  organisation qui refuse le repli en temps normal le refuse aussi en panne ; distinguer les deux
  cas serait un second réglage, et il n'a pas été demandé.
