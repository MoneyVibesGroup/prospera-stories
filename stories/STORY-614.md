# STORY-614 : Vérifier une passerelle avant de l'activer

Status: done

**Épic :** EPIC-054 — Permissions au catalogue et cloisonnement des passerelles
**Service :** `notification-service`
**Points :** 5 · **Sprint :** S44
**Prérequis :** **STORY-604** (résolution de la passerelle à la remise), **STORY-605** (repli nommé)
**Origine :** revue d'architecture du 2026-09-06 · rail B, bloc B1 · FR-N54, AD-6.

---

## Le récit

En tant qu'**organisation cliente**, je veux savoir que ma passerelle fonctionne au moment où je
l'enregistre, afin de ne pas le découvrir sur le premier message d'un client.

## Le fait

⛔ **Aujourd'hui, une clé fausse se découvre chez un destinataire.** STORY-605 a donné un nom au
refus — `PASSERELLE_REFUSEE` — mais il n'apparaît qu'à la remise, c'est-à-dire sur un vrai message,
d'un vrai client, souvent une relance de recouvrement. La saisie, elle, accepte tout.

⚡ **La vérification est une QUESTION, jamais un envoi.** Le patron est déjà écrit côté paiement
(STORY-244) : on interroge la capacité, on n'émet pas un message d'essai vers une adresse réelle. Un
message d'essai serait un envoi **non demandé, non consenti et facturé** — et sur un canal payant,
la facture arriverait pour un message que personne n'a voulu.

⚡ **Savoir vérifier se DÉRIVE de la présence de la méthode** sur l'adaptateur ; un booléen à côté
mentirait le jour où l'un des deux changerait sans l'autre. Une passerelle qu'aucun adaptateur ne
sait interroger est `NON_VERIFIABLE`, et **le dire est un code, pas un échec**.

⛔ **Une passerelle injoignable ne marque RIEN.** L'indisponibilité dit le **moment**, pas la
validité : écrire « refusée » parce que le réseau a coupé ferait désactiver une passerelle
parfaitement bonne, et le client irait chercher une clé à renouveler qui n'a rien.

⚠️ **« Non vérifiée » et « non vérifiable » ne se traitent PAS pareil.** La première interdit
l'activation, la seconde ne peut pas l'interdire — sinon la cloche in-app, qui n'a aucune passerelle
à interroger, ne serait activable par personne.

## Critères d'acceptation

- [x] AC-1 — L'enregistrement d'une passerelle déclenche une vérification **synchrone et bornée**.
      Le délai d'attente ne peut pas être allongé par un réglage saisi par le client.
- [x] AC-2 — La vérification **n'envoie aucun message** vers un destinataire réel. Garde de
      balayage sur les adaptateurs de canal.
- [x] AC-3 — Trois issues distinctes et nommées : **vérifiée**, **refusée par la passerelle**,
      **non vérifiable**. Une passerelle injoignable n'en écrit aucune.
- [x] AC-4 — Une passerelle **non vérifiée** peut être enregistrée mais **pas activée**. Une
      passerelle *non vérifiable* reste activable.
- [x] AC-5 — Le secret n'apparaît ni dans la réponse, ni dans le motif, ni dans le journal.

## Notes

⚠️ **La vérification est le second consommateur légitime du secret en clair**, après la remise. Elle
ne doit pas devenir une troisième porte : elle rend un **verdict**, jamais une valeur.

⚠️ **Elle porte sur ce qu'on s'apprête à écrire, pas sur ce qu'on vient d'écrire.** Vérifier après
la persistance laisserait un instant pendant lequel une passerelle est **active et non vérifiée**.

---

## Journal de livraison (2026-09-06) — branche `MNV-614`

**Livré :** 2 396 tests unitaires (193 suites), e2e complet, lint et build au vert.

### ⚡ La capacité de vérifier se DÉRIVE de la présence de la méthode

`CanalProvider.verifierIdentifiants?()` est **optionnelle**. Un booléen `saitVerifier` posé à
côté aurait menti le jour où l'un des deux aurait changé sans l'autre ; ici, il n'y a rien à
tenir en accord. Le registre rend `undefined` quand la méthode est absente, et c'est **cette
valeur-là** qui devient `NON_VERIFIABLE`. Reprise directe de `paiement-service` STORY-244.

### ⛔⛔ « Non vérifiée » et « non vérifiable » sont deux mots, et c'est AC-4 qui en dépend

Quatre valeurs de statut, dont **trois seulement sont des issues de vérification** :

| Réponse de la passerelle | Verdict | Activation |
| --- | --- | --- |
| accepte le compte | `VERIFIEE` | permise |
| répond et refuse | `REFUSEE` | interdite |
| aucun adaptateur ne sait demander | `NON_VERIFIABLE` | **permise** |
| injoignable | `NON_VERIFIEE`, sans date | interdite |

⛔ Exiger une vérification de `NON_VERIFIABLE` aurait rendu **la cloche in-app inactivable pour
tout le monde, définitivement** — elle n'a aucune passerelle à interroger. ⚡ Et la liste des
statuts activables est **une liste, jamais une négation** : « tout sauf refusée » aurait laissé
passer `NON_VERIFIEE`, c'est-à-dire exactement la passerelle dont on ne sait rien.

### ⛔ Une passerelle injoignable ne marque RIEN — et ne date rien

L'indisponibilité dit le **moment**, pas la validité du compte. Écrire « refusée » parce que le
réseau a coupé ferait désactiver une passerelle parfaitement bonne et enverrait le client
chercher une clé à renouveler qui n'a rien. D'où deux formes de retour dans l'adaptateur : un
refus d'authentification rend **`false`** (un verdict, et il prouve que le relais répond), une
coupure **LÈVE**.

### ⚡ La vérification porte sur ce qu'on s'APPRÊTE à écrire

Vérifier après la persistance laisserait un instant pendant lequel une passerelle est **active
et non vérifiée** — court, mais c'est celui d'une remise en file d'attente. Le verdict est donc
écrit dans la **même** écriture que la configuration qu'il concerne : un verdict qui survivrait
à un changement de secret parlerait d'un compte d'envoi qui n'existe plus.

### ⚡⚡ La révision d'une candidate se DÉRIVE de son contenu — sinon la vérification ment

C'est le piège le plus coûteux de la story, et il vient directement du cache de STORY-604. Le
transport SMTP est indexé sur la `revision`. Une passerelle candidate **n'a pas encore été
écrite**, donc pas d'horodatage : reprendre la révision de la configuration en place aurait
réutilisé le transport de l'**ancien** compte, et la vérification aurait répondu *« tout va
bien »* sur des identifiants qu'on est précisément en train de remplacer.

⚡ Remède : `verification:<empreinte(canal, expéditeur, réglages, secrets)>`. C'est la même règle
qu'en `paiement-service` STORY-603 — *une version que rien ne protège doit être dérivée de son
contenu*. ⚠️ Et les clés sont **triées** avant l'empreinte : l'ordre d'un objet JSON suit
l'ordre d'insertion, deux saisies identiques auraient produit deux transports.

### ⛔ AC-1 a révélé un trou de STORY-604 : un réglage CLIENT décidait du temps d'attente

`delaiMs` vient des réglages de la passerelle, c'est-à-dire d'une case de formulaire, et rien ne
le bornait. Une organisation pouvait faire attendre dix minutes à la requête HTTP **synchrone**
de vérification — et, pire, occuper un exécutant de remise d'autant. ⚡ *Un réglage saisi par le
client ne peut pas décider du temps que la plateforme attend* : plafond à 15 s, et le test le
prouve avec `delaiMs: 600000`.

### ⚡ La garde d'AC-2 balaie un PÉRIMÈTRE, pas un fichier

Le fichier entier ne pouvait pas servir de périmètre : un adaptateur de canal **doit** savoir
remettre, c'est son autre méthode. La garde extrait donc le **corps** de `verifierIdentifiants`
par équilibre des accolades — une expression régulière « du nom jusqu'à la prochaine méthode »
aurait cassé au premier `if` imbriqué, et *une garde qui lit un périmètre faux ne dit plus rien
de vrai*. Elle vérifie aussi qu'au moins un canal sait vérifier, sinon elle balaierait le vide.

⚡ Et `verify()` de SMTP est exactement la question qu'on voulait poser : elle ouvre la
conversation, s'authentifie, et **raccroche**. C'est le protocole qui la porte — on n'a rien
inventé pour l'occasion.

### ⚠️ Le refus d'activation est rendu DEVANT L'APPELANT

`ACTIVATION_SANS_VERIFICATION`, jamais une désactivation silencieuse : le client vient d'écrire
`actif: true`, et lui rendre `200` en ayant écrit `false` lui ferait croire que ses messages
partent. La saisie, elle, n'est pas perdue — `actif: false` est accepté et gardé avec son
verdict.

### Ce que la story ne fait pas

- ⚠️ **Aucune re-vérification périodique** : une clé qui expire après l'enregistrement se
  découvre encore à la remise, avec `PASSERELLE_REFUSEE` (STORY-605). La santé par organisation
  est **STORY-616**.
- ⚠️ **L'expéditeur déclaré n'est toujours pas vérifié** : c'est **STORY-615**.
- ⚠️ Les configurations écrites avant cette story se lisent `NON_VERIFIEE` et **ne sont pas
  réécrites** : une reprise de données changerait l'état actif de passerelles qui fonctionnent.
