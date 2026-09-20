# STORY-660 : Les notifications signées du schéma interopérable — une signature pour plusieurs événements, et aucune horloge pour les dater

Status: done

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 5 · **Sprint :** ⚠️ **NON SLOTTÉE** — sans elle, un encaissement PI-SPI réussi reste invisible pour toujours.
**Prérequis :** **STORY-256** (la boîte de réception et la vérification avant persistance), **STORY-257** (l'encaissement idempotent), **STORY-600** (l'adaptateur du schéma), **STORY-652** (la clé d'API)
**Origine :** documentation des webhooks de l'API Business reçue le **2026-09-15**, après l'inventaire de ce qui restait ouvert sur PI-SPI.

---

## Le fait

Le port prévoit une méthode qui vérifie la signature d'une notification entrante. L'adaptateur
FedaPay l'implémente ; celui du schéma interopérable **non**. Le service lit cette absence comme
« ce fournisseur ne notifie pas », et **ne range donc rien** — c'est le repli fermé de STORY-256, et
il est juste. Mais sur ce canal, la notification est la **seule** chose qui fasse avancer une
demande (AD-4) : il n'y a ni checkout, ni retour de navigateur. **Un paiement accepté par le payeur
ne laisserait aujourd'hui aucune trace dans le service.**

⚡⚡ **UNE SIGNATURE, PLUSIEURS ÉVÉNEMENTS — ET LE PORT N'EN ATTESTE QU'UN.** Le participant envoie
un corps `{ data: [...], meta: { total } }` : un **tableau** d'événements, signé **une seule fois**.
Notre port rend **une** attestation, et la boîte de réception range une pièce par événement. Ranger
le tableau comme un seul événement fusionnerait trois paiements simultanés sous une seule clé
d'unicité — **l'idempotence de STORY-257 avalerait deux encaissements réels**, sans qu'aucune règle
ne soit violée. Le port doit donc rendre une **liste**, et FedaPay une liste d'un élément.

⛔⛔ **AUCUNE HORLOGE DANS LA SIGNATURE, ET C'EST UNE PROPRIÉTÉ DU SCHÉMA, PAS UN OUBLI À
RATTRAPER.** FedaPay signe `horodatage.corps`, et nous refusons une notification trop vieille : sa
fenêtre de rejeu ne dépend d'aucune mémoire. Le schéma signe **le corps seul**. Une notification
authentique captée aujourd'hui reste **indéfiniment** vérifiable. Seule l'idempotence de la boîte de
réception l'écarte — et seulement tant qu'elle la connaît. En production, la vraie barrière est le
**mTLS du participant**, que le guide exige sur la route de rappel. Cette story le **nomme** : elle
ne peut pas le fabriquer.

⚡ **AUCUN IDENTIFIANT D'ÉVÉNEMENT.** Un événement porte un code, une date, notre référence, un
montant, un nom, l'adresse et l'identifiant de bout en bout — mais rien qui lui soit propre. La clé
d'unicité se **dérive** : le code d'événement et l'identifiant de bout en bout, qui distinguent un
paiement reçu de la demande d'annulation qui le vise plus tard. Un événement qui ne porte ni l'un ni
notre référence n'est pas rangeable.

⛔ **LA DOCUMENTATION SE CONTREDIT, ET ELLE SE TROMPE LÀ OÙ C'EST LE PLUS CHER.** Ses exemples Node
et Python calculent la signature sur `JSON.stringify(req.body)` — c'est-à-dire sur un JSON
**re-sérialisé** après analyse. L'ordre des clés, un espace ou un accent échappé suffisent à rendre
des octets différents : **toutes les notifications seraient refusées**, et aucun test de
comportement ne le verrait. Seul l'exemple PHP signe le corps brut, et c'est lui qui a raison. Trois
autres écarts, moins coûteux : le renouvellement du secret prend `dateExpirationSecret` selon le
guide et `dateExpiration` selon la spécification ; les exemples écrivent `PAIEMENT_RECUE` quand
l'énumération dit `PAIEMENT_RECU` ; le guide promet le secret sur `GET /webhooks/{id}` que la
spécification ne liste pas.

## Critères d'acceptation

- [x] AC-1 — La signature `X-Signature` est un **HMAC-SHA256 hexadécimal calculé sur les octets
      bruts** du corps, comparé en temps constant, **avant** toute analyse du JSON. Une
      contre-preuve montre qu'un corps re-sérialisé donne une signature **différente** — c'est la
      garde contre l'exemple de la documentation.
- [x] AC-2 — ⚡⚡ **Le port atteste une LISTE.** Chaque événement du tableau devient une attestation
      rangée sous **sa** clé d'unicité, avec la même pièce brute et la même signature. Un corps de
      trois événements produit trois pièces, et trois paiements simultanés produisent trois
      encaissements. FedaPay rend une liste d'un élément, sans aucun changement de comportement.
- [x] AC-3 — La clé d'unicité se **dérive** du code d'événement et de l'identifiant de bout en bout,
      à défaut de notre référence. Un événement qui ne porte ni l'un ni l'autre fait **refuser** le
      corps entier : ranger à moitié un envoi signé laisserait des événements orphelins de leur
      preuve.
- [x] AC-4 — `PAIEMENT_RECU` est le **seul** événement qui constate de l'argent, montant lu **de
      l'événement**, jamais de la demande (STORY-259). `RTP_REJETE` est un échec de **notre**
      demande. Tous les autres sont **rangés sans rien produire** : une demande d'annulation n'est
      pas encore un remboursement, et un retour de fonds reçu n'est pas un encaissement.
- [x] AC-5 — ⚠️ **La route répond `204`**, pour tous les fournisseurs. C'est le seul succès que le
      contrat du participant énumère, et un statut qu'il ne reconnaît pas se lit comme un échec,
      donc comme une raison de rejouer. FedaPay accepte tout `2xx`. La réponse perd son corps
      `{ recue: true }` : elle en disait déjà le moins possible (STORY-256), elle n'en dit plus rien.
- [x] AC-6 — ⛔ **Un rejeu authentique ne produit qu'un encaissement**, et le test le prouve sur un
      corps de plusieurs événements rejoué à l'identique : c'est la seule barrière contre le rejeu
      qui existe sur ce canal, elle doit donc être éprouvée à cet endroit précis.
- [x] AC-7 — **Non-régression** : les recettes de bout en bout de FedaPay passent inchangées, statut
      mis à part.

## Ce qui sera facile à rater

1. ⛔⛔ **Recopier l'exemple Node de la documentation.** Il re-sérialise le JSON avant de signer. Voir
      AC-1.
2. ⛔ **Ranger le tableau comme un seul événement.** Trois paiements, une clé, deux encaissements
      perdus. Voir AC-2.
3. ⚠️ **Traiter `ANNULATION_DEMANDE` ou `RETOUR_RECU` comme de l'argent.** Le premier est une
      question du payeur, le second le retour d'un envoi — aucun des deux n'éteint une créance.
4. ⚠️ **Croire qu'une fenêtre d'horodatage protège ce canal.** Il n'y a pas d'horodatage signé.
      L'imiter sur `evDate`, qui n'est pas signé à part, ne protégerait rien et ferait refuser les
      rattrapages légitimes du participant après une panne.
5. ⚠️ **Comparer la signature en minuscules d'un côté et telle quelle de l'autre.** Un condensé
      hexadécimal n'a pas de casse significative ; une comparaison sensible à la casse refuserait
      une notification authentique.

## Ce que la story ne fait pas

- ⛔ **Poser ou renouveler le secret après la déclaration du compte.** C'est un défaut qui existe
      déjà, FedaPay compris : le secret n'est accepté qu'à la déclaration, et aucune route ne permet
      de l'ajouter ensuite. Or le schéma ne le rend **qu'à la création du webhook**, dont l'URL
      contient l'identifiant du compte — donc **après** la déclaration. Le renouvellement exige en
      plus d'accepter **deux** secrets jusqu'à la date d'expiration de l'ancien. **Story suivante.**
      En attendant, le chemin praticable est : créer le webhook sur une URL provisoire, déclarer le
      compte avec le secret rendu, puis corriger l'URL du webhook — le schéma autorise sa
      modification et conserve le secret.
- ⛔ **Le mTLS de la route de rappel.** Exigé en production, impossible à exercer sur un poste.
- ⛔ **La gestion des webhooks par le produit** (création, liste, suppression). Ce sont des actes de
      l'organisation chez son participant, comme la création d'un alias.

## Notes

- Voir [[STORY-256]] (vérifier avant de ranger), [[STORY-257]] (deux barrières d'idempotence),
  [[STORY-259]] (le montant vient du fournisseur), [[STORY-271]] (l'encaissement orphelin — un
  paiement par QR sans demande y arrivera), [[STORY-600]], [[STORY-652]].
- ⚠️ **Rien ne peut encore déclencher une vraie notification** : tout événement exige une adresse de
  paiement sur l'un de nos comptes, que le simulateur ne résout toujours pas (STORY-653). La preuve
  passe donc par les exemples de corps de la documentation, signés avec un secret de test.

## Livraison

🏁 **Livrée le 2026-09-15**, branche `MNV-660`. 3 308 tests unitaires (25 de plus),
257 de bout en bout (5 de plus), lint propre.

🏁 **Recette Docker** : le service démarre `healthy`, et la route publique reconnaît
le schéma. Un envoi signé sur un compte inconnu est refusé pour
`COMPTE_ENCAISSEMENT_INTROUVABLE`, là où un fournisseur sans vérification reste
refusé pour `FOURNISSEUR_SANS_NOTIFICATION` : le registre dérive la capacité de la
présence de la méthode, dans le service démarré.

⚠️ **Deux pièges payés pendant la livraison.** La substitution mécanique du statut
`200` en `204` a manqué un contrôle écrit `r.status === 200`, et un test de
rejeu FedaPay a rougi — une garde qui a raison. Et le test « signature absente »
passait `undefined` à un paramètre doté d'une valeur par défaut : JavaScript
appliquait la valeur par défaut, donc une signature valide, et le test vérifiait
l'inverse de son nom avant d'être corrigé en `null`.

⚠️ **Une première recette Docker a menti** : le moteur n'était pas démarré, et la
boucle d'attente avalait les échecs, si bien que la commande rendait un succès sans
avoir rien sondé. Elle s'arrête désormais sur un message explicite à chaque étape.

⛔ **Rien n'a encore reçu de vraie notification du participant** : tout événement
exige une adresse de paiement sur l'un de nos comptes, que le simulateur ne résout
toujours pas. La preuve repose sur les corps d'exemple de la documentation.
