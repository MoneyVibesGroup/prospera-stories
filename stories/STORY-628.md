# STORY-628 : Interception du « STOP »

Status: done

**Épic :** EPIC-064 — La conversation dans les deux sens
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S37
**Prérequis :** **STORY-625** (réception du message entrant)
**Origine :** rail B, bloc B4 · AD-10, FR-N47, FR-N48, FR-N49.

---

## Le récit

En tant que **personne qui reçoit des messages**, je veux que « STOP » arrête vraiment les envois,
afin que le geste qu'on me demande de faire produise l'effet qu'on me promet.

## Le fait

⛔ **Sur un canal entrant, le refus arrive comme un MESSAGE, pas comme un clic sur un lien.** Le
désabonnement d'EPIC-059 ne le voit pas. Un « STOP » non intercepté est une infraction, sur un canal
où l'opérateur l'impose.

⚡ Il est **opposable immédiatement**, y compris à un envoi de masse déjà en cours.

## Critères d'acceptation

- [x] AC-1 — Le mot-clé est reconnu quelle que soit la casse et l'espacement, et il est **énuméré**.
- [x] AC-2 — L'entrée de consentement est écrite **avant** que l'accusé ne parte.
- [x] AC-3 — Le refus suit la **personne**, pour tous les modules de l'organisation (FR-N49).
- [x] AC-4 — ⛔ Il n'éteint **pas** le transactionnel : un code de vérification passe toujours.

---

## Ce que la livraison a appris (2026-09-07)

**Branche :** `MNV-628`, empilée sur `MNV-627`.

### ⚡⚡ Une prédiction écrite dans le code s'est vérifiée à la ligne près

STORY-583 avait laissé ceci dans `estMoyenOperant` :

> *« Un seul `true` aujourd'hui, et c'est une mesure, pas une opinion. Le jour où EPIC-064 branche
> l'interception des STOP, c'est cette fonction — une ligne — qui change, et tous les refus posés
> sur elle s'ouvrent ensemble. »*

Ce jour est arrivé. La ligne a changé, et **deux tests ont rougi exactement là où c'était prévu** :
ceux qui affirmaient que le SMS et WhatsApp refusaient l'envoi de masse faute de moyen de
désabonnement. Ils avaient raison de le dire hier, et raison de rougir aujourd'hui.

⚡ **C'est le rendement d'une exigence partielle tenue par un refus nommé plutôt que par une note.**
Un commentaire disant « à faire en EPIC-064 » aurait été lu par personne ; un refus exécutable a
ouvert tout seul, au bon moment, et a désigné ce qu'il fallait relire.

⚠️ **`REGLAGE_DE_L_APPAREIL` reste non opérant**, et pour une raison qui ne se soigne pas ici : ce
que la personne coupe dans les réglages de son téléphone, nous ne l'apprenons jamais. Un refus que
nous ne pouvons pas enregistrer n'est pas un refus opposable.

### ⛔ Égalité après normalisation, JAMAIS inclusion

C'est la ligne qui décide de tout, et l'erreur naturelle est d'écrire `texte.includes('STOP')`.

Un `includes` aurait transformé **« stoppez le prélèvement »** en désabonnement définitif. Et le pire
n'est pas l'erreur : c'est qu'elle est **invisible**. Le message n'arrive jamais chez le module qui
aurait pu la lire, donc personne ne signale rien — ni le client, qui croit avoir écrit à sa banque,
ni l'organisation, qui ne voit qu'un désabonnement de plus.

⚡ **Chaque mot ajouté à la liste est une réponse légitime confisquée.** La liste tient donc aux mots
qui n'ont pas d'autre usage possible en réponse à un message commercial. La normalisation, elle, est
généreuse : accents, casse, ponctuation et espaces tombent, parce qu'« arrêt », « ARRET » et
« STOP. » sont le même geste et qu'un clavier de téléphone perd les accents.

⚠️ **La contrepartie est assumée et se dit : « ne m'envoyez plus rien » n'est PAS intercepté.** Le
reconnaître demanderait d'interpréter une phrase, c'est-à-dire de deviner. Cette phrase-là part chez
le module, où un humain la lit — ce qui est le bon endroit pour elle.

### ⚡ C'est le MOYEN du canal qui décide, pas le canal

Un « STOP » écrit dans un courriel **n'est pas un refus**. Ce canal-là porte un lien, et c'est le
lien qui fait foi. Intercepter partout aurait confisqué le mot là où il ne veut rien dire, et aurait
fait dépendre l'effet d'une phrase du canal par lequel elle arrive plutôt que de ce que ce canal
promet à la personne.

La condition est donc `moyenDeDesabonnement(canal) === 'MESSAGE_ENTRANT'`, et l'arrivée d'un sixième
canal la traverse sans qu'une ligne bouge.

### ⚡⚡ « Avant que l'accusé ne parte » : l'accusé, c'est la réponse HTTP elle-même

AC-2 se lit comme s'il fallait ordonner deux messages. Il n'y en a qu'un : ce que la passerelle
attend est notre `2xx`, et c'est lui qui lui dit d'arrêter de réémettre.

⛔ **Écrire après avoir répondu aurait laissé une fenêtre où la passerelle considère le refus
enregistré et où il ne l'est pas.** Une panne de notre côté à cet instant, et le message suivant part
quand même — c'est-à-dire exactement l'infraction que la story ferme. L'écriture vit donc dans la
transaction, et la réponse ne quitte le contrôleur qu'après le commit.

⚡ **Et le rejeu ne produit pas de second refus** : l'écriture du consentement vit dans la
transaction que la clé dupliquée abandonne.

### ⚡ AC-3 et AC-4 tiennent par des ABSENCES, pas par du code

Les deux critères les plus lourds de la fiche n'ont demandé aucune ligne :

- **AC-3 — le refus suit la personne, pour tous les modules.** Le registre de consentement n'a
  **aucune dimension de module** : il est clé par organisation et identifiant de canal. Un refus y
  est opposable à Relance comme à Marketing sans qu'aucun code n'énumère les modules. ⚡ C'est la
  quatrième fois dans ce service qu'un critère tient par une absence plutôt que par une garde.
- **AC-4 — il n'éteint pas le transactionnel.** La portée `MASSE` ne couvre que la nature `MASSE`
  (`naturesCouvertes`, STORY-582). Un code de vérification passe, **sans qu'une seule ligne ne le
  dise dans cette story**. Écrire `GLOBAL` aurait éteint les deux, et il aurait fallu un `if` pour
  rattraper — un `if` que quelqu'un aurait fini par déplacer.

### ⚠️ Un « STOP » n'avance pas l'envoi d'origine vers « répondu »

L'interception passant **avant** la cascade, l'envoi n'est même pas cherché. C'est le bon
comportement et il méritait un test : faire passer une relance à « répondu » parce que le client a
écrit STOP aurait fait croire au module qu'il discute, alors qu'il claque la porte.

### ⚠️ Le jeton n'est émis que pour le moyen qui en a besoin

Rendre `MESSAGE_ENTRANT` opérant a fait apparaître un second chemin dans l'apposeur. Émettre un jeton
de désabonnement pour un SMS aurait ouvert **une adresse publique vivante que personne n'emploiera
jamais** — une surface de plus, pour rien. Et la base publique n'est plus requise sur ce chemin :
exiger une configuration qui ne sert pas aurait rendu le SMS indisponible pour un lien qu'il ne
porte pas.

⚡ **La mesure du plafond, elle, reste unique pour les deux moyens.** Deux mesures écrites séparément
auraient fini par diverger, et l'une des deux aurait laissé partir un message tronqué — sur le SMS,
où 160 caractères et la phrase « répondez STOP » se disputent la place.

### ⛔ Points ouverts légués

1. **Aucun événement `desabonnement.enregistre` n'est publié ici**, et c'est le **même mur que
   STORY-583** : le contrat de ce topic exige un `contactId`, « jamais l'identifiant de canal », et
   l'interception ne détient qu'un émetteur — que STORY-625 a délibérément choisi de **ne pas**
   normaliser par le carnet. Le fait opposable est écrit (le consentement) ; sa **publication** au
   bus attend qu'une story dise comment on remonte de l'émetteur au contact.
2. **Aucun accusé n'est renvoyé à la personne.** L'usage opérateur veut un « vous êtes désabonné » ;
   ici, rien ne repart. C'est un envoi sortant, donc une décision de produit et un coût — pas un
   effet de bord d'interception.
3. **Le mot-clé n'est pas déclarable par organisation.** AD-10 parle des « mots-clés déclarés du
   canal » ; la liste est ici une donnée du domaine, commune. La rendre configurable ouvrirait la
   porte à une organisation qui déclare un mot courant et confisque les réponses de ses clients.
