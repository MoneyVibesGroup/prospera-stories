# STORY-638 : Attestation d'envoi — l'extrait opposable du journal

Status: done

**Épic :** EPIC-056 — Le premier message part : port de canal, e-mail, journal et accusés
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S39
**Prérequis :** aucun (le journal `audit_envois` existe depuis **STORY-579**)
**Origine :** rail D, bloc D2 · AD-14, AD-15, AD-5.

---

## Le récit

En tant que **microfinance**, je veux prouver qu'un avis d'échéance est parti, afin de le porter
devant un client ou un régulateur.

## Le fait

⚡ **Le journal `audit_envois` est déjà append-only et sur une base au rôle restreint.** Il ne
manque que la **sortie** : un extrait borné, daté, qui cite ce qui a été observé et **rien d'autre**.

## Critères d'acceptation

- [x] AC-1 — L'attestation porte : destinataire, canal, modèle et version **figée**, horodatages des
      statuts observés, et l'identité d'expédition retenue.
- [x] AC-2 — ⛔ Elle ne porte **pas** le contenu rendu au-delà de l'horloge des variables d'AD-15.
- [x] AC-3 — Un statut jamais observé se lit **« non observé »**, jamais « non délivré ».
- [x] AC-4 — La demande d'attestation est elle-même un fait tracé, avec son demandeur.

---

## Journal de livraison (2026-09-08) — branche `MNV-638`

**Livré :** `domain/envoi/attestation.ts`, `AttestationsService`, la collection protégée
`demandes_attestation`, la route `POST /envois/:id/attestation`. Lint, build, unitaires et e2e au
vert.

### ⛔ Ce qui rend une attestation opposable, c'est ce qu'elle REFUSE de dire

Un document qui comble ses trous — « non délivré » là où personne n'a rien observé, le texte du
message reconstitué à partir d'un modèle d'aujourd'hui — est **pire qu'un document absent** : il
porte des affirmations que la première contestation sérieuse démolira, et il emportera avec lui le
crédit de tout ce qu'il disait de vrai. Les trois refus ci-dessous sont donc la story.

### ⛔⛔ AC-3 — il y a TROIS réponses, pas deux

| Réponse | Ce qui s'est passé | Ce que le lecteur peut en tirer |
| --- | --- | --- |
| `OBSERVE` | la passerelle l'a rapporté, avec sa date | un fait |
| `NON_OBSERVE` | le canal sait le rapporter, rien n'est venu | une absence de preuve |
| `NON_OBSERVABLE` | ce canal ne sait pas le rapporter (AD-5) | **rien du tout** |

C'est la leçon de STORY-614 (`NON_VERIFIABLE` ≠ `NON_VERIFIEE`) portée sur un autre objet. Écrire
« non lu » sur un e-mail dont l'adaptateur ne rapporte aucune lecture serait une affirmation
**fausse** : le silence est structurel, pas factuel — et c'est exactement celle qu'une attestation
mal faite produit.

⚠️ **L'ordre des questions compte** : une **date** gagne sur la capacité déclarée, parce qu'un
fournisseur peut rapporter mieux que son contrat. On ne descend sur la capacité que faute
d'observation. Et **aucune date n'est jamais rendue sans observation** — une date sans observation
laisserait croire à un fait.

### ⛔⛔ Elle se compose depuis `audit_envois`, PAS depuis `envois`

C'est toute la différence entre un **extrait** et une **capture d'écran**. La collection `envois`
vit sur la base métier : elle se corrige, elle se supprime, et une purge de rétention la vide.
`audit_envois` est en ajout seul, sur une base dont le rôle Mongo refuse la mise à jour **au
serveur** (AD-14) — c'est ce qui permet de dire *« ce document n'a pas pu être retouché »* à
quelqu'un qui n'a aucune raison de nous croire sur parole. Un test le prouve en supprimant
l'`Envoi` : l'attestation tient quand même.

⚡ **Les horodatages d'accusé, eux, viennent de l'`Envoi`, et c'est assumé.** L'audit ne porte que
celui de la remise. L'attestation distingue donc ce qui est **prouvé** (la remise) de ce qui est
**observé** (les accusés). Prétendre l'inverse aurait demandé de recopier chaque accusé dans la base
de preuves — doubler la collection la plus écrite du service pour une question qu'on pose deux fois
par an.

### ⛔ AC-2 — le contenu purgé n'est pas RECONSTITUÉ

La tentation est réelle : la version de modèle est figée, elle est immuable, on pourrait la
re-rendre. Ce serait produire un texte qui **n'a jamais existé** — les variables ont disparu, donc
le montant, le nom et la date manqueraient ou seraient ceux d'aujourd'hui. Un document opposable qui
invente une phrase est un document qui se retourne contre celui qui le produit.

⚡ **Et c'est la PRÉSENCE des variables qui décide, jamais un calcul de date.** Une échéance
recalculée ici répondrait avec la politique **d'aujourd'hui** à propos d'un document écrit sous celle
de sa collecte — le défaut que STORY-585 a déjà payé.

### ⚡ AC-4 — un `POST`, parce que la demande ÉCRIT

Un `GET` qui laisse une trace en base est un `GET` qui ment sur sa nature, et le premier cache HTTP
interposé ferait disparaître la moitié des demandes. La trace est écrite **avant** que l'extrait ne
parte : l'écrire après laisserait des extraits produits sans trace au seul moment qui compte, celui
où le processus s'arrête entre les deux.

⚡ **Elle porte l'état du contenu, parce qu'il CHANGE avec le temps.** Deux attestations du même
envoi à six mois d'écart ne disent pas la même chose, et sans ce champ personne ne saurait laquelle
a été produite avant la purge des variables.

⚠️ **Elle ne porte pas l'attestation rendue.** La conserver ferait une seconde copie du journal,
sous une horloge différente de celle qu'AD-15 fixe — et cette copie survivrait à la purge de ce
qu'elle décrit. L'attestation se refait ; ce qui se trace, c'est qu'on l'a demandée.

### ⚠️ Le destinataire est rendu EN CLAIR, à l'inverse de partout ailleurs

Le masquage de NFR-7 protège les journaux et les refus. Une attestation qui masquerait le
destinataire n'attesterait **rien** : c'est précisément ce qu'on cherche à prouver. Elle est rendue
à son organisation, authentifiée et cloisonnée par le filtre — vérifié sur les **deux** lectures.

### ⚠️ Un envoi jamais parti rend un refus NOMMÉ, pas un extrait vide

`AUCUNE_REMISE_A_ATTESTER` est distinct d'un `404` parce que le remède n'est pas le même :
« introuvable » dit *cherchez ailleurs*, alors que l'envoi existe et n'est simplement jamais parti.
Et **rien n'est tracé** dans ce cas : on ne trace pas l'extraction d'un document qu'on n'a pas
produit.

### ⚠️ Huitième rattrapage de la garde de suppression complète — et le premier du côté CONSERVÉ

`demandes_attestation` porte un `organizationId`. Elle est **conservée** : elle trace qui a extrait
un document opposable pendant que l'organisation était cliente, et une résiliation ne défait pas ce
qui a été opposé à un tiers. De toute façon, le serveur refuse la suppression sur cette base.
Aucune donnée de destinataire n'y survit — seulement un identifiant d'envoi, un demandeur, une date.

⚠️ Elle est ajoutée aux collections **pré-créées** par le provisionnement : le compte applicatif n'a
pas `createCollection`, et une insertion dans une transaction échouerait au commit (STORY-571).

### ⚠️ Points ouverts

- L'attestation n'est pas **signée**. Elle est opposable par la base qui la porte, pas par une
  cryptographie ; une signature détachée serait une story à part et demanderait une gestion de clé.
- Aucune sortie PDF : le contrat rend du JSON, et la mise en forme appartient à la console.
- Aucune conformité Docker : le refus `update` du rôle Mongo est éprouvé par
  `roles-mongodb.conformite-spec.ts`, qui ne connaît pas encore cette collection.
