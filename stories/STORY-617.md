# STORY-617 : La marque de l'organisation sur les modèles système

Status: done

**Épic :** EPIC-055 — Modèles, rendu et formes par canal
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S35
**Prérequis :** **STORY-611** (les sept modèles système)
**Origine :** revue d'architecture du 2026-09-06 · rail B, bloc B2 · FR-N24, AD-8.

---

## Le récit

En tant qu'**organisation cliente**, je veux que les messages de compte portent mon nom, mon logo
et mes couleurs, afin que mes utilisateurs ne reçoivent pas un message de Prospera.

## Le fait

⚡ **Une organisation habille, elle ne supprime pas.** Un client qui pourrait retirer le message de
réinitialisation fermerait à ses propres utilisateurs le seul chemin de récupération d'un compte.
La surcharge porte sur la **marque et le libellé**, jamais sur l'existence — et c'est ce qui permet
de la confier au client sans réserve.

⚠️ **La marque est une donnée d'ORGANISATION, pas de modèle.** La ranger dans le modèle la ferait
recopier dix-huit fois — une par texte du socle — et diverger à la première correction. Une
organisation change de logo une fois ; elle ne relit pas dix-huit gabarits.

⛔ **Aucune URL arbitraire n'entre dans un message sortant.** Une adresse déposée par un client
dans un e-mail signé de notre relais est trois choses à la fois : un traqueur qui apprend au client
l'ouverture d'un message que le destinataire croyait privé, un mouchard d'adresse IP, et — sur un
lien qui change après coup — une image que nous n'avons jamais vue partant sous notre réputation.
Le logo entre donc par une **référence**, et c'est le service qui compose l'adresse.

## Critères d'acceptation

- [x] AC-1 — Nom affiché, logo, couleur d'accent et pied de page, portés **une fois** par
      organisation.
- [x] AC-2 — Un modèle système sans surcharge rend la marque **Prospera**, et le dit.
- [x] AC-3 — ⛔ Aucune surcharge ne peut retirer un modèle système ni vider son appel à l'action.
- [x] AC-4 — Le logo est servi depuis un emplacement contrôlé ; aucune URL arbitraire n'entre dans
      un message sortant.

## Notes

⚠️ **Cette story n'ouvre pas le HTML.** La mise en page est STORY-618 ; ici, la marque entre dans le
texte par deux variables réservées et par ce que le figement en dit à son appelant.

---

## Ce que la livraison a appris (2026-09-07)

**Branche :** `MNV-617`, empilée sur `MNV-611`.

### ⚡ Ce n'est pas la nature du logo qui décide, c'est CE QUE LA VALEUR PERMET

Une URL déposée par un client dans un e-mail signé de notre relais est trois choses à la fois : un
traqueur qui apprend au client l'ouverture d'un message que le destinataire croyait privé, un
mouchard d'adresse IP, et — sur un lien qui change après coup — une image que nous n'avons jamais
vue partant sous notre réputation. Une **référence** ne permet aucune des trois.

⛔ **Et le remède n'est pas un contrôle, c'est une COMPOSITION.** La base vient de la configuration,
la référence de l'organisation, et `adresseDuLogo` ne sait rien faire d'autre. Il n'existe donc
aucun chemin par lequel une valeur saisie devient une adresse entière — la partie qui décide de
l'hôte n'est jamais écrite par un client. ⚠️ Corollaire tenu par un test : une référence refusée
ne compose **aucune** adresse. Composer « au mieux » aurait fait sortir l'URL du pirate avec notre
base devant.

### ⚡ La marque est résolue au FIGEMENT — le défaut de STORY-604, transposé à l'apparence

La résoudre à la demande aurait fait signer un message en attente sous la marque que l'organisation
venait précisément de changer. C'est le même instant que le texte : ce qui part porte le nom qui
servait quand il est parti, et le figement le **porte**, figé, comme le rôle de STORY-596.

### ⛔ AC-3 porte sur les VARIABLES, jamais sur le texte

Exiger une phrase, un mot ou une longueur aurait été une règle de rédaction — contournable et
invérifiable. Exiger que la surcharge **déclare** ce que le modèle système déclare la rend
structurelle : `validerContenu` refuse déjà une variable déclarée et jamais employée, donc déclarer
`lien` **oblige à l'écrire**. L'appel à l'action ne peut pas disparaître.

⚠️ **La règle est un plancher, pas un moule** : rien n'interdit d'ajouter. ⚠️ Et elle vaut sur les
**deux** chemins d'écriture : contrôler à la création seulement aurait laissé publier une version 2
amputée du lien — la règle aurait été vraie une fois, le jour J.

### ⚡ Déclarer n'est pas fournir

Un gabarit — de socle ou d'organisation — a le droit de citer `{{marqueNom}}` ; c'est la **valeur**
qui n'entre jamais par la porte de l'appelant. Sans ce refus, un module signerait un message au nom
d'une autre organisation, et le moteur n'y verrait qu'une substitution de plus.

⛔ **Le refus est explicite, il n'écrase pas en silence.** Écraser aurait laissé un appelant croire
qu'il décide de la signature, jusqu'au jour où quelqu'un s'en aperçoit dans une boîte de réception.

### ⛔ La marque est PROPOSÉE au gabarit, elle ne lui est pas imposée — une garde du moteur l'a exigé

La première version ajoutait les deux valeurs de marque à **tout** rendu. Le moteur refuse une
valeur dont la version ne déclare pas la variable (`VARIABLE_INATTENDUE`) : **tous les modèles
écrits avant cette story se seraient mis à refuser leur rendu, d'un coup, sans qu'une seule ligne
de leur contenu ait changé.** Vingt tests l'ont dit avant la relecture. Le service ne fournit
désormais une valeur de marque que pour une variable que le gabarit **cite** — c'est le gabarit qui
décide, et un test de non-régression garde la porte.

### ⚠️ Un pied de page vide est un pied de page — d'où la seule variable FACULTATIVE du socle

Le moteur traite une valeur vide comme une valeur absente, et une variable obligatoire absente
**refuse le rendu**. Déclarer `marquePiedDePage` obligatoire aurait fait refuser tous les messages
système de toute organisation sans mentions légales.

### ⛔ Deux `$set` dans un même littéral s'écrasent

La première version posait `$set: { nomAffiche, couleurAccent }` puis diffusait un second `$set`
pour les champs facultatifs : la seconde clé écrasait la première, et le nom affiché n'aurait
jamais été enregistré. Les deux se **fusionnent** désormais dans un seul mouvement, et `$unset`
porte ce qui est retiré — sans quoi une organisation qui retire son logo continuerait de le voir
partir.

### ⚠️ Aucun sixième droit n'est né ici

Habiller un message est un geste de **rédaction** : `notification:modele:rediger` garde les deux
routes. Créer un droit de plus aurait ajouté une ligne à attribuer dans l'IdP pour une frontière
que personne n'aurait su tracer — la leçon est déjà payée côté paiement (STORY-289).

### ⛔ Points ouverts légués

1. **Le logo n'est encore lu par personne** : il n'entre dans aucun message tant que la mise en
   page HTML n'existe pas (STORY-618). La couleur d'accent non plus.
2. **`MARQUE_BASE_LOGOS` n'est pas ajoutée au compose racine** — même point ouvert que les
   variables `NOTIFICATION_*` de STORY-608.
3. **Rien ne dépose de fichier dans l'emplacement contrôlé** : la référence est une promesse que
   le déploiement doit tenir. Le rattachement à `document-service` reste à décider.
