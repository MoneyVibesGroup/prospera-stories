# STORY-608 : Client d'envoi et file de sortie vers `notification-service`

Status: todo

**Épic :** EPIC-037 — Créance, demande, lien et encaissement
**Service :** `paiement-service`
**Points :** 3 · **Sprint :** S34
**Prérequis :** **STORY-607** (le lien part par appel direct)
**Origine :** revue d'architecture du 2026-09-06 · FR-P17, AD-2 (`notification`), AR-06.

---

## Le récit

En tant qu'**organisation cliente**, je veux que l'émission d'une demande réussisse même si le
service de notification est indisponible, afin qu'une panne d'envoi ne fasse pas perdre une créance.

## Le fait

⚡ **La demande est le FAIT ; l'envoi en est une conséquence.** Un appel direct sur le chemin de
l'argent ne peut pas décider si une demande existe. Appeler la notification dans la transaction
d'émission ferait dépendre l'écriture d'une créance de la santé d'un service tiers — exactement ce
que l'invariant P4 refuse pour l'autorisation, et pour la même raison.

⚡ **La forme est déjà connue de ce service : une file de sortie.** L'outbox existe et sert le bus ;
il lui faut ici un frère qui parle HTTP. Le fait est écrit dans la transaction, la tentative d'appel
vit après.

⛔ **Le jeton ne doit apparaître dans aucun journal de ce chemin.** C'est le point où il est le plus
exposé : une trace d'erreur d'appel HTTP recopie volontiers le corps envoyé. La leçon de
`STORY-243` s'applique telle quelle — *un secret qui peut être imprimé le sera*, et `util.inspect`
ignore `toString` comme `toJSON`.

⚡ **« Lien envoyé » est un fait RAPPORTÉ, jamais présumé.** La demande ne passe pas à *envoyée*
parce qu'on a tenté un appel. Elle y passe parce que la notification a accepté la remise. C'est la
même règle que FR-P22 pour le paiement : rien ne progresse sur la seule foi de l'appelant.

## Critères d'acceptation

- [ ] AC-1 — L'émission d'une demande **réussit** alors que `notification-service` est injoignable.
      Test avec le service coupé.
- [ ] AC-2 — La tentative d'envoi est **rejouable** et **idempotente**, keyée sur la demande : N
      rejeux, dans le désordre, après redémarrage, produisent **un seul** message.
- [ ] AC-3 — ⛔ Ni le jeton, ni l'URL du lien n'apparaissent dans un journal, une trace d'erreur ou
      une charge d'audit de ce chemin. Test qui inspecte la sortie du journal, pas seulement le code.
- [ ] AC-4 — La demande ne porte l'état **envoyée** que sur **réponse** de la notification. Un appel
      parti sans réponse laisse l'état inchangé et la tentative rejouable.
- [ ] AC-5 — Un échec définitif d'envoi est **visible** : il remonte comme écart exploitable, il ne
      disparaît pas dans un journal.
- [ ] AC-6 — L'appel porte l'**organisation émettrice**, ce qui rend la passerelle de `STORY-604`
      applicable — le lien part sous l'identité de l'organisation, pas sous celle de Prospera.

## Notes

⚠️ **Authentification de service à service.** `notification-service` protège `POST /envois` par un
JWT porteur d'une organisation. `paiement-service` appelle **au nom d'une organisation cliente**, pas
en son nom propre. Le mode d'authentification de cet appel est à décider : jeton de service avec
organisation dans le corps, ou délégation. ⚡ **Le choix doit préserver le cloisonnement** :
`notification-service` ne doit pas se retrouver avec un appelant capable d'envoyer au nom de
n'importe qui **sans trace de qui l'a demandé**.

⚠️ Ne pas réutiliser l'outbox Kafka pour cela. Deux transports, deux modes d'échec, deux politiques
de reprise — les fusionner ferait dépendre la publication d'un événement de la santé d'un service
HTTP.
