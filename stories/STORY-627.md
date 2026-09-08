# STORY-627 : Destination par défaut d'une réponse sans contexte

Status: done

**Épic :** EPIC-064 — La conversation dans les deux sens
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S37
**Prérequis :** **STORY-626** (routage vers le module qui a parlé)
**Origine :** rail B, bloc B4 · AD-10 règle 3, AD-19, FR-N43.

---

## Le récit

En tant qu'**organisation cliente**, je veux décider où atterrissent les réponses que rien ne
rattache, afin qu'un client qui répond par SMS ne parle pas dans le vide.

## Le fait

⚠️ **« Sans contexte » et « contexte inconnu de nous » ne se lisent pas pareil**, et la destination
par défaut est une **donnée d'organisation** (FR-N43), pas un réglage de plateforme.

## Critères d'acceptation

- [x] AC-1 — Chaque organisation déclare sa destination par défaut ; l'absence est un état explicite.
- [x] AC-2 — Une réponse orientée par défaut le dit ; elle ne se présente pas comme rattachée.

---

## Ce que la livraison a appris (2026-09-07)

**Branche :** `MNV-627`, empilée sur `MNV-626`.

### ⚡⚡ « Sans contexte » et « contexte inconnu de nous » partent au même endroit, et ne disent pas la même chose

C'est la phrase de la fiche, et elle cache une décision de conception réelle. Trois situations
donnent toutes le rattachement `aucun` :

| ce qui s'est passé | ce que ça dit |
|---|---|
| le canal ne transporte aucune référence | il n'y avait rien à chercher, et il n'y aura jamais rien |
| le canal en transporte, ce message n'en portait pas | le fournisseur a omis quelque chose |
| une référence était là, aucun envoi ne correspond | **nous avons cherché et perdu** |

⛔ **Les confondre ferait passer une panne pour une propriété du canal.** Le jour où une passerelle
se met à renvoyer des références fantaisistes, le routage par défaut continue de fonctionner
parfaitement — et rien, nulle part, ne le dit. Le motif est donc **enregistré et publié**, alors même
qu'il **ne change pas la destination**. ⚡ *Une donnée qui ne change aucune décision peut valoir
d'être écrite, quand elle est la seule à pouvoir dire qu'une décision s'est prise pour la mauvaise
raison.*

### ⛔ L'absence de déclaration est un état, et cet état ne route vers PERSONNE

Le réflexe serait de choisir un déversoir de secours — la première boîte venue vaut mieux que rien.
C'est faux ici : cela enverrait les réponses des clients d'une organisation chez un module qu'elle
n'a peut-être pas souscrit. Au mieux dans le vide, au pire chez quelqu'un qui les traite.

⚡ **Et ce n'est pas une perte, parce que le message reste conservé** (STORY-625, AC-4). Ce qui est
fermé est le **routage**, jamais la conservation. Le jour où l'organisation déclare sa destination,
elle n'a rien perdu — la réponse est en base, datée, avec son motif.

⚡ **Le défaut vit dans l'ABSENCE de document**, jamais dans une valeur semée à l'inscription : une
valeur écrite le jour de la création aurait figé une décision prise par quelqu'un qui n'était pas
là, et aurait rendu « cette organisation a choisi le support » indiscernable de « personne n'a jamais
choisi ». C'est le patron de la marque (STORY-617) et de la politique d'identité d'envoi
(STORY-605), et c'est la troisième fois qu'il sert.

### ⛔ AC-2 tient par un champ, pas par une convention

*« Une réponse orientée par défaut le dit ; elle ne se présente pas comme rattachée. »* Sans
`origineDestination` sur l'événement, le module qui la reçoit ne peut pas distinguer **« ce message
répond à ce que tu as envoyé »** de **« personne ne savait où le mettre, tu es le déversoir »**.

⚡ **La première autorise un automatisme, la seconde exige un humain.** C'est exactement la règle du
niveau de certitude du « lu » (AD-5), appliquée à la destination. Et le champ est **requis** : tout
événement de ce topic nomme une destination et dit d'où elle vient.

### ⚡ Le module de l'envoi gagne TOUJOURS sur le défaut

Un défaut qui pourrait doubler un rattachement certain cesserait d'être un défaut pour devenir une
règle de routage concurrente : deux réponses au même envoi partiraient à deux endroits selon un
réglage modifiable. La résolution suit donc l'ordre d'AD-10, et il n'est pas configurable.

### ⚠️ Aucune liste fermée de modules, et c'est délibéré

Ce service parle pour Relance, Marketing et Support **sans les connaître** (AD-19). Énumérer leurs
noms pour valider la destination ferait de lui l'annuaire du programme, et imposerait une livraison
à chaque module qui naît. Ce qui est contrôlé est la **forme**, pour que le nom reste comparable au
`moduleAppelant` que l'envoi a figé.

⚠️ **Le contrôle est refait dans le service, pas seulement au DTO.** La méthode est appelable par un
autre chemin le jour où une console d'administration existera, et un nom qui franchirait la première
porte sans la seconde deviendrait une destination que plus rien ne peut comparer.

### ⚠️ La garde de suppression a rougi pour la CINQUIÈME fois de ce bloc

`destinations_reponses` porte un `organizationId`, donc l'inventaire de STORY-587 l'exige. Elle
rejoint les collections effacées : c'est un réglage, il part avec l'organisation. ⚡ Et son
effacement est sans conséquence, précisément parce que l'état initial vit dans l'absence — une
organisation résiliée puis recréée retrouve « aucune destination déclarée », pas le déversoir que
quelqu'un d'autre avait choisi.

Cette garde ne s'est pas trompée une seule fois sur les cinq.

### ⛔ Points ouverts légués

1. **Aucune route ne RETIRE une destination déjà posée.** Un `DELETE` ouvrirait un troisième état,
   « effacée », que la résolution ne saurait pas distinguer de « jamais déclarée ». L'absence reste
   donc l'état initial, et redevenir sans destination demandera une story qui dise ce que ça veut
   dire.
2. **Le « STOP » n'est toujours pas intercepté** : AD-10 le veut traité **avant** la cascade. Un
   « STOP » sans contexte part aujourd'hui vers la destination par défaut comme une réponse
   ordinaire. C'est STORY-628, et le trou est **ouvert** d'ici là.
3. **Le niveau `presume` d'AD-10 reste absent du rail** (voir STORY-626). Il aurait servi
   exactement ici : c'est le SMS, canal sans référence, qui tombe dans la destination par défaut.
