# STORY-569 : L'employeur invite, il ne crée pas — et il ne saura jamais ce que son salarié déclare

Status: ready-for-dev

**Épic :** EPIC-027 — Natures d'accès et habilitations graduées
**Service :** `fiscal-service` (`:3012`) · `auth-service` · `notification-service`
**Points :** 5 · **Sprint :** S30
**Origine :** **décision PO du 2026-08-28** — l'ouverture du volet personne physique passe par
l'employeur : *« oui, ta recommandation change, j'aime l'idée »*, en réponse à la variante proposée
le même jour.
**Prérequis :** **STORY-567** (les trois portes) · **STORY-568** (la qualification)
**Réf. :** **AD-21** (donnée personnelle de tiers) · **NFR-F06** (isolation) · **AD-20**
(`LigneDeRemuneration`, keyée par bénéficiaire)

---

## Ce que l'invitation résout

STORY-567 pose une garde nette : ⛔ *« Pas de compte salarié créé par son employeur : ce serait un
accès qu'il pourrait lire. »* Elle est juste, et elle laisse un problème entier — **le salarié
arrive vide, et il faut aller le chercher un par un.**

⚡ **L'invitation lève le problème sans lever la garde.** L'employeur **invite** ; le salarié
**ouvre lui-même**. Un interlocuteur, cent comptes, aucune acquisition unitaire — et aucun accès
créé au nom de quelqu'un d'autre.

⇒ **Et la liste existe déjà.** Les bénéficiaires sont dans `LigneDeRemuneration`, keyée
`(dossier, période, bénéficiaire)`. L'employeur ne tape aucune liste : il désigne une période et
invite ceux qu'elle contient.

## ⛔ Le risque, et il est unique

**Un employeur qui apprend que son salarié a des revenus fonciers a appris quelque chose qu'il
n'avait pas à savoir.**

C'est le seul vrai danger de cette story, et il n'est pas technique — il est de conception. Tout
signal renvoyé à l'employeur est une fuite potentielle :

| Ce que l'employeur peut voir | Ce qu'il ne doit jamais voir |
|---|---|
| **invité** | le verdict de qualification (dispensé / redevable / indéterminé) |
| **compte ouvert** | les catégories de revenus déclarées |
| **invitation déclinée** | les montants, les pièces, la déclaration |
| **invitation expirée** | la date à laquelle le salarié a déclaré |

⚠️ **Et « déclinée » est déjà limite.** Un salarié qui refuse peut avoir une raison qu'il ne veut
pas exposer. ⇒ **`décliné` et `sans réponse` sont rendus indistinguables** : l'employeur voit
« invitation non aboutie », rien de plus.

⛔ **Une invitation n'est pas un mandat.** Le salarié qui ouvre son compte n'autorise ni son
employeur ni le cabinet à agir pour lui. Le mandat reste un acte séparé, et il n'est **jamais**
pré-coché.

## Périmètre

**Inclus**

- **L'invitation en lot** depuis la base de rémunération d'une période : l'employeur désigne, le
  système envoie.
- **Le canal d'envoi ne fuit pas non plus** : l'invitation dit ce qu'est le service et qui l'offre,
  ⛔ elle ne dit rien de la situation fiscale du destinataire.
- **L'ouverture du compte est un acte du salarié** — il suit le lien, s'authentifie, et devient
  titulaire. Personne d'autre ne peut le faire à sa place.
- **Le statut rendu à l'employeur est un enum fermé de trois valeurs** : `INVITE`,
  `COMPTE_OUVERT`, `NON_ABOUTIE`. ⛔ Aucun autre champ, jamais.
- **La révocation par le salarié** ferme l'accès et repasse le statut à `NON_ABOUTIE` — l'employeur
  n'apprend ni qu'il y a eu révocation, ni pourquoi.
- Le compte survit au départ de l'entreprise : le salarié qui change d'employeur **garde son
  compte et ses déclarations passées**. ⚠️ Ce qu'il perd, c'est le pré-remplissage — plus la
  matière.

**Hors périmètre**

- Le cas du **dirigeant**, qui a son propre chemin (STORY-567) et un lien assumé avec la société.
- Toute forme de relance automatique par l'employeur. ⚠️ Une relance répétée sur un service fiscal
  personnel devient une pression. Une invitation, un rappel, puis silence.
- L'obligation d'accepter. ⛔ Un salarié qui ignore l'invitation ne doit subir **aucune
  conséquence** dans le produit, et l'employeur ne doit pouvoir en tirer aucune liste exploitable.
- L'application mobile. Elle est la destination de ce chemin, pas son contenu.

## Critères d'acceptation

1. Une invitation ne crée **aucun compte** : le compte n'existe qu'après un acte du salarié.
2. Le statut rendu à l'employeur appartient à l'enum fermé de trois valeurs. ⛔ Une garde vérifie
   qu'aucune route, aucun export et aucun log ne rend autre chose à l'employeur.
3. **`décliné` et `sans réponse` sont indistinguables** pour l'employeur — témoin exécutable sur
   les deux chemins.
4. Le contenu de l'invitation ne dépend **pas** de la situation fiscale du destinataire : deux
   salariés aux situations opposées reçoivent le **même** message.
5. Ouvrir un compte n'accorde **aucun mandat** ; le mandat reste un acte distinct, jamais
   pré-coché, et son absence bloque toute action pour le compte du salarié.
6. Une révocation par le salarié n'est **pas notifiée** à l'employeur et ne se distingue pas d'une
   invitation non aboutie.
7. Le salarié qui quitte l'entreprise conserve compte et déclarations ; le pré-remplissage cesse.
8. L'isolation reste dérivée du jeton : un employeur ne peut jamais atteindre le `Redevable` d'un
   salarié, y compris en connaissant son NIF ou son identifiant interne.

## Notes

- ⚡ **Ce que cette story change à l'économie du volet personne physique.** Sans elle, le salarié
  s'acquiert un par un — canal, coût et support d'un produit grand public. Avec elle, il s'acquiert
  **par l'employeur**, c'est-à-dire par le canal que le produit maîtrise déjà. C'est la même porte
  de STORY-567, avec une distribution qui la rend praticable.
- ⚠️ **La garde de STORY-567 n'est pas assouplie, elle est contournée par le haut.** L'employeur
  n'obtient toujours aucun accès ; il obtient le droit de proposer. La différence est ténue dans le
  code et totale en droit.
- ⛔ **Le jour où un employeur demandera « qui de mes salariés est en règle ? », la réponse est
  non**, et elle doit rester non même si elle est demandée par un client important. Cette story
  écrit cette réponse dans un enum, pas dans une politique.
