# STORY-596 : Consommation par période, canal et nature, et ventilation par utilisateur et par rôle

Status: done

**Épic :** EPIC-060 — Mesure de consommation, multi-devise et console d'exploitation
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S43
**Prérequis :** **STORY-595** (coût et devises)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-16.

---

## Le fait

⚡ **Aucun envoi n'est anonyme** : il porte l'utilisateur qui l'a déclenché, ou à défaut le module ou
la règle automatique à l'origine (FR-N57).

⚡ **Le rattachement organisationnel de l'auteur est figé au moment de l'envoi**, et c'est ce qui évite
qu'un changement d'équipe **réécrive l'historique** de consommation de l'ancienne.

## Critères d'acceptation

- [x] AC-1 — Restitution par **période, canal et nature** : volume envoyé, délivré, échoué, coût
      (FR-N59) — **par devise** (STORY-595 AC-4).
- [x] AC-2 — Ventilation interne **par utilisateur et par rôle** au v1, lus du read-model d'identité
      (FR-N60).
- [x] AC-3 — ⚡ Le rattachement est **figé à l'envoi**, jamais recalculé (FR-N58). Test : changer le
      rôle d'un utilisateur **ne modifie pas** la ventilation historique.
- [x] AC-4 — La ventilation par **équipe** au sens métier arrivera avec le module Équipe (#18) et
      n'exigera **aucune reprise de données** — précisément parce que le rattachement est déjà figé.
      Documenté comme tel.
- [x] AC-5 — ⚠️ **Aucune facturation ni blocage sur dépassement au v1** (FR-N63). Le modèle de coût
      est complet pour que la facturation s'y branche sans reprise, **pas pour qu'elle existe**. Un
      test refuse tout chemin de blocage.

## Notes

- La restitution est bornée à l'organisation du jeton. La vue toutes-organisations est STORY-597, et
  elle passe par un autre chemin de lecture.

---

## Ce que la livraison a appris

### ⛔ Le rôle se FIGE à l'écriture — une jointure à la lecture aurait été plus courte et fausse

AC-3 tient à un champ, `roleDeclencheur`, posé sur l'`Envoi` au moment où il est écrit. La version
naturelle — un `$lookup` sur le read-model d'identité au moment de restituer — compile, se teste
verte avec un seul rôle, et **réécrit l'histoire au premier changement d'affectation** : la
consommation d'un comptable devenu associé se déplace rétroactivement d'une ligne à l'autre, sur des
mois **déjà restitués**, et plus personne ne peut expliquer l'écart entre deux exports du même
trimestre.

⚡ **C'est aussi ce qui rend AC-4 gratuit.** Le jour où le module Équipe (#18) arrive, il ajoute un
champ figé de la même façon : aucune reprise de données, précisément parce que le rattachement l'était
déjà. La promesse d'AD-16 n'est pas une intention, c'est une conséquence du geste d'écriture.

### ⛔ Le REJEU recopie le rôle, il ne le résout pas

Le piège se serait refermé trois mois plus tard. Rejouer un envoi échoué **reconstruit** une
préparation ; y résoudre le rôle depuis le read-model attacherait le rôle **d'aujourd'hui** à un envoi
d'il y a trois mois. La ventilation historique aurait bougé **au moment même où l'on répare un
incident** — et l'écart aurait été attribué à la réparation, jamais au rejeu.

### ⚠️ Un read-model en retard ne refuse pas un envoi

Les deux topics d'identité sont partitionnés différemment (`orgId` d'un côté, `userId` de l'autre) :
une appartenance peut arriver **après** l'envoi qu'elle qualifie. Refuser d'envoyer parce que le rôle
est introuvable ferait dépendre le chemin critique d'un délai de projection. Un rôle absent ne coûte
qu'une ligne de ventilation moins précise ; un envoi refusé coûte un client.

⚡ Et un déclenchement automatique ne **cherche** aucun rôle : il n'y a pas d'humain à qualifier, et le
module, lui, est toujours là (AD-16 — aucun envoi n'est anonyme).

### ⛔ Deux définitions du mois auraient fini par diverger

`periodeMensuelle` existait déjà, dans la purge à treize mois (STORY-586). En écrire une seconde pour
la restitution était le geste évident : quatre lignes, aucun couplage. Elles auraient été identiques
le jour de leur écriture — et le jour où l'une aurait bougé, la consommation d'**avant** treize mois
aurait cessé d'être comparable à celle d'**après**, sur les mêmes écrans, sans qu'aucune ligne de code
ne change ce jour-là.

La définition a donc **déménagé** dans `domain/consommation/periode.ts`, et la purge la ré-exporte. Un
test vérifie que les deux importations rendent **la même référence de fonction** — pas deux fonctions
qui se ressemblent.

### ⚡ Les bornes sont des PÉRIODES, et la borne haute est EXCLUSIVE

Accepter des instants ISO 8601 aurait laissé demander « du 12 au 18 » pour recevoir **deux mois
entiers**, sans qu'aucun message ne dise pourquoi. Le format d'entrée dit ce que la sortie sait faire.

⛔ **La borne haute vaut le premier instant du mois suivant.** Écrite « fin de mois inclusive », elle
aurait exigé de connaître la longueur des mois — donc les années bissextiles — et un envoi du
31 décembre à 23 h 59 min 59,999 s serait tombé **hors de son propre exercice**. La borne exclusive ne
connaît aucun calendrier.

⚡ **`AAAA-MM` se compare comme une chaîne**, et c'est pourquoi ce format a été retenu plutôt que
`MM/AAAA` : l'ordre lexicographique y est l'ordre chronologique, donc l'intervalle inversé se détecte
sans convertir quoi que ce soit.

### ⚡ « Envoyés » compte tout ce qui a QUITTÉ le service, pas l'état `envoye`

Un message délivré a forcément été envoyé. Un compteur qui n'aurait compté que l'état courant
`envoye` aurait fait **décroître** la colonne « envoyés » à mesure que les accusés arrivent — un
chiffre qui baisse tout seul, sans que rien ne se soit passé, sur le seul écran où l'on vient
chercher une explication.

### ⛔⛔ Le GATE arrête l'opérateur plateforme AVANT le contrôleur — découvert ici, il engage STORY-597

Mesuré par l'e2e : un porteur sans organisation reçoit `403 NOTIFICATION_NOT_ENTITLED` du gate d'AD-18,
qui exige un droit d'usage `ACTIVE` sur une **organisation**. Il n'atteint jamais le contrôleur.

⚡ **Conséquence directe pour la vue toutes-organisations** : elle ne peut pas être une route de plus
sous `@RequiresEnvoiAccess()`. Elle aura sa propre porte — et c'est tant mieux : deux publics, deux
gardes, aucun `if` à l'intérieur d'un dépôt.

### ⚠️ Une garde qui cherche des MOTS rougit sur les phrases qui la justifient

Première écriture d'AC-5 : chercher le vocabulaire de la facturation. Elle a refusé **quatre fichiers
parfaitement innocents** — des descriptions Swagger qui promettent « aucun quota n'est consommé » et
« segments réellement émis, donc facturés ». Le mot « quota » y apparaît justement pour dire son
absence.

⛔ **Retirer les commentaires ne suffit pas : une description d'API est une CHAÎNE, donc du code.** La
garde cherche donc des **formes exécutables** — un appel, une affectation, une comparaison, une
lecture de propriété. Facturer est un geste, pas un sujet de conversation.

⚠️ Et la deuxième écriture a raté le geste le plus important : un quota qui bloque ne s'**affecte**
pas, il se **compare** (`if (quotaRestant <= 0)`). Un motif limité à `[:=]` attrapait tout sauf le
refus.

⚠️ **`plafond` reste hors de la garde, et l'omission est raisonnée** : les garde-fous de STORY-594
bornent un **volume**, réglé par l'organisation elle-même pour se protéger d'elle-même. Un motif qui
les aurait attrapés aurait forcé à exempter le module qui les porte — c'est-à-dire à rendre la garde
négociable dès son écriture.

### ⛔⛔ Deux gardes existantes ont rougi — l'une avait raison, l'autre lisait ses propres commentaires

Elles n'appellent pas le même remède, et c'est le partage qui compte.

**`nature-jamais-en-entree` (STORY-578) avait raison, et le code s'est rangé.** Le filtre `?nature=`
de la restitution n'aurait rien *choisi* — il aurait seulement restreint une lecture — mais la garde
ne peut pas distinguer un corps d'une requête, et une exception « sauf les DTO de requête » aurait
laissé passer le premier corps nommé `...Query`. ⚡ **Une garde qui rougit sur l'usage prévu ne se
dilue pas.** Le filtre a disparu : la restitution est **déjà groupée par nature** (AC-1), donc
l'appelant filtre ses lignes, et le coût est nul.

⚡ **Elle a fait remonter mieux que ça.** Une fois le filtre retiré, elle rougissait encore — sur la
propriété `nature` d'un DTO de **réponse**, que personne ne peut envoyer. La cause n'était pas la
garde : **requête et réponses partageaient un fichier**, et un fichier qui importe `class-validator`
est classé « entrée » en entier. Mêler dans un même fichier ce qui entre et ce qui sort rend la
distinction **inobservable**, pour la garde comme pour le lecteur. Les deux sont maintenant séparés.

**`cloisonnement-par-le-jeton` (STORY-572) avait tort, et la garde s'est corrigée.** Elle lisait le
fichier **brut**, commentaires compris : le paragraphe qui explique *pourquoi ce contrôleur n'accepte
aucun `orgId`* l'a fait passer pour un contrôleur qui en manipule un. ⚠️ **Une garde qui refuse les
textes qui la justifient pousse à ne plus documenter la règle qu'elle protège.** Elle retire
désormais les commentaires — et n'y perd rien, puisque ce qu'elle cherche est du code. Une
contre-preuve compare le même `orgId` en commentaire et en code.

### ⚡ Un droit EXISTANT couvre exactement ce qu'on ajoute — troisième fois

`notification:journal:consulter` garde les deux routes. La consommation est **le journal sous un autre
angle** : elle ne dit rien que le journal ne dise déjà. Un sixième droit aurait laissé attribuer la
lecture agrégée à qui n'a pas la lecture détaillée — une séparation que personne n'a demandée, et qui
ne protège rien puisque l'agrégat se recalcule depuis le détail. Après `modele:rediger` (STORY-588) et
`envoi-de-masse:valider` (STORY-594).

### ⚠️ Un `$08` invisible s'est glissé dans un fichier de test

Écrire une expression régulière depuis un script Python passé en *heredoc* : `\b` non échappé devient
le caractère **backspace** (0x08), qui s'écrit dans le fichier sans que rien ne le montre — le test
échoue en disant simplement « faux ». Sept occurrences. C'est exactement le défaut déjà relevé dans
`sprint-status.yaml`. **Le remède est d'écrire les motifs par l'éditeur, jamais par un script.**

## Points ouverts

- ⚠️ **La restitution lit la collection opérationnelle des `Envoi`.** C'est légitime — le filtre
  d'organisation y est inconditionnel — mais cela veut dire qu'au-delà de treize mois (FR-N66), les
  lignes disparaissent avec le journal détaillé. La vue plateforme de STORY-597, elle, lira des
  compteurs pré-agrégés : les deux chiffres divergeront pour les périodes anciennes, et c'est **voulu**
  plutôt que subi.
- ⚠️ **Aucun filtre `?nature=` n'existe** sur la restitution : la garde de STORY-578 le refuse, et la
  sortie étant déjà groupée par nature, l'appelant filtre ses lignes. À rouvrir seulement si un volume
  de réponse le justifie — et alors par un autre nom que « nature ».
- ⚠️ Les envois écrits **avant** cette story ne portent aucun `roleDeclencheur` : leur ventilation les
  range sous `role: null`. Aucune reprise n'est prévue — le rôle qu'ils portaient n'est plus
  connaissable, et l'inventer serait pire que l'absence.
