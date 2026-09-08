# STORY-640 : La console de l'organisation — son journal, sans route d'écriture

Status: done

**Épic :** EPIC-060 — Mesure de consommation, multi-devise et console d'exploitation
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S40
**Prérequis :** **STORY-638** (attestation), **STORY-639** (arrêté de période)
**Origine :** rail D, bloc D3 · FR-N55, AD-18.

---

## Le récit

En tant qu'**organisation cliente**, je veux un écran qui me dise où en sont mes envois, ce qu'ils
ont coûté et l'état de mes canaux, afin de ne pas avoir à appeler le support.

## Le fait

⚡ **La borne d'une console n'est pas une liste d'actions autorisées, c'est un module SANS route
d'écriture.** La leçon de STORY-598, appliquée cette fois au public **client** et non à l'opérateur
plateforme.

## Critères d'acceptation

- [x] AC-1 — Une organisation voit ses envois, ses statuts, ses coûts arrêtés, ses suppressions et
      l'état de ses passerelles.
- [x] AC-2 — ⛔ Le module ne déclare **aucun** verbe d'écriture. Une garde cherche des **formes
      exécutables**, pas des mots.
- [x] AC-3 — Le gate d'organisation passe **avant** le contrôleur, et le critère n'est jamais un nom
      de rôle.
- [x] AC-4 — « Rien à afficher » et « pas encore mesuré » ne se lisent pas pareil.

---

## Journal de livraison (2026-09-08) — branche `MNV-640`

**Livré :** module `modules/console-client/`, `domain/passerelle/etat-canal.ts` (extrait),
`etat-de-mesure.ts`, une garde de borne. Lint, build, unitaires et e2e au vert.

### ⛔⛔ AC-2 tient par une ABSENCE D'INJECTION, et le module n'importe AUCUN service

Le module déclare cinq modèles Mongoose et les lit — rien d'autre. Importer `EnvoisModule` ou
`SuppressionsModule` aurait mis à portée de main un `rejouer`, un `lever`, un `annuler` ; la question
*« et si on l'appelait depuis la console ? »* n'aurait plus eu de réponse **structurelle**, seulement
une réponse de revue. La garde vérifie que dix services capables d'agir sont **absents du code**, que
le contrôleur ne déclare que des `@Get`, et qu'aucun fichier ne porte de forme d'écriture.

⚡ **Elle porte sa contre-preuve dans les deux sens** : elle reconnaît quatre écritures fabriquées,
**et** elle laisse passer une lecture. Sans cette seconde moitié, la console ne pourrait rien
afficher et la garde serait retirée le lendemain.

### ⛔⛔ La garde de STORY-616 a bloqué le chemin évident — et elle avait raison

`SanteCanauxService` est protégé par une garde de présence : **aucun fichier hors du module
`passerelles` ne peut le nommer**. C'est ce qui rend vraie la phrase *« la santé ne décide de
rien »*. La console devait pourtant afficher le même état.

Deux mauvaises réponses se présentaient :

- **élargir la liste blanche** de la garde — affaiblir un invariant pour un besoin d'affichage ;
- **recopier la règle** dans la console — elle aurait divergé au premier état ajouté, et deux écrans
  du même service auraient dit deux choses de la même passerelle.

La bonne réponse est la troisième : la règle (`etatDe`, `ETATS_CANAL`) **déménage dans le domaine**,
comme fonction pure. Elle ne lit rien, elle ne décide de rien, et les deux surfaces la partagent. La
garde reste verte sans être touchée. Un test le vérifie sur le cas le plus subtil : la quarantaine
gagne sur un verdict de vérification favorable, **des deux côtés**.

### ⛔⛔ AC-4 — une liste vide est une AFFIRMATION

Elle dit *il ne s'est rien passé*, et c'est ce qu'une organisation en conclut. Si la vraie réponse
est *on ne sait pas encore*, l'affirmation est fausse — et elle est fausse au moment où elle coûte le
plus : le premier mois, quand le client vérifie que le service marche.

| État | Ce que ça veut dire | Le geste |
| --- | --- | --- |
| `MESURE` | on a regardé, voici ce qu'il y a | lire |
| `RIEN_A_AFFICHER` | on a regardé, il n'y a rien | rien |
| `PAS_ENCORE_MESURE` | personne n'a encore regardé | attendre, ou déclencher |

Deux cas concrets décident :

- **aucune période close** ⇒ afficher un coût de zéro dirait qu'un mois n'a rien coûté, alors que
  personne ne l'a arrêté. Le motif **nomme la période en cours**.
- **aucune passerelle configurée** ⇒ ce n'est pas « tout va bien », c'est « les messages partent par
  le relais de la plateforme ».

⚡ Et un **arrêté vide** reste `MESURE` : la période a bien été close, elle n'a rien coûté. C'est
exactement la nuance que la story existe pour tenir.

⚠️ **Les lignes existent dans les trois états**, vides dans deux d'entre eux. Les rendre absentes
dans un cas aurait obligé la première console à écrire `lignes ?? []` — c'est-à-dire à effacer la
distinction qu'on venait de poser.

### ⛔ AC-3 — deux publics, deux gardes, jamais superposées

`@RequiresEnvoiAccess()` exige une organisation. Un opérateur plateforme n'en a aucune : il est
arrêté **avant** d'atteindre la moindre ligne de ce contrôleur (mesuré en STORY-596). La vue
plateforme de STORY-597 a sa **propre porte**, dont le critère est `tenantId === null` — jamais un
nom de rôle, parce que les rôles sont des données. Une garde balaie le module et refuse
`TENANT_ADMIN`, `PLATFORM_ADMIN` et `roles.includes`.

⚡ **6e droit existant qui couvre exactement ce qu'on ajoute** : `notification:journal:consulter`.
La console est une lecture du journal sous un autre angle.

### ⚡ Les coûts viennent de l'ARRÊTÉ, jamais d'un total recomposé

Recalculer depuis les compteurs aurait affiché un chiffre qui bouge encore (STORY-639) — donc
différent de celui qu'on vient d'arrêter, sur le même écran. La console lit le dernier arrêté et
recopie ses lignes.

⚠️ **Le destinataire est MASQUÉ ici, à l'inverse de l'attestation de STORY-638.** Une console est un
écran ouvert dans un bureau ; une attestation est un document **demandé, tracé** et destiné à être
opposé. Les deux règles cohabitent parce que les deux surfaces n'ont pas le même usage.

### ⚠️ Points ouverts

- La console rend un **aperçu** de vingt envois, sans pagination : le journal complet reste sur
  `GET /envois`, qui pagine déjà. Fusionner les deux aurait fait de la console un second chemin de
  lecture à tenir d'accord avec le premier.
- Elle ne montre **aucun envoi programmé à venir** (STORY-637). C'est une lecture de plus, et elle
  n'était pas demandée.
- Aucune conformité Docker : les cinq lectures et leur filtre sont prouvés par test.
