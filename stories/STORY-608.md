# STORY-608 : Client d'envoi et file de sortie vers `notification-service`

Status: done

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

- [x] AC-1 — L'émission d'une demande **réussit** alors que `notification-service` est injoignable.
      Test avec le service coupé.
- [x] AC-2 — La tentative d'envoi est **rejouable** et **idempotente**, keyée sur la demande : N
      rejeux, dans le désordre, après redémarrage, produisent **un seul** message.
- [x] AC-3 — ⛔ Ni le jeton, ni l'URL du lien n'apparaissent dans un journal, une trace d'erreur ou
      une charge d'audit de ce chemin. Test qui inspecte la sortie du journal, pas seulement le code.
- [x] AC-4 — La demande ne porte l'état **envoyée** que sur **réponse** de la notification. Un appel
      parti sans réponse laisse l'état inchangé et la tentative rejouable.
- [x] AC-5 — Un échec définitif d'envoi est **visible** : il remonte comme écart exploitable, il ne
      disparaît pas dans un journal.
- [x] AC-6 — L'appel porte l'**organisation émettrice**, ce qui rend la passerelle de `STORY-604`
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

---

## Livré le 2026-09-06 — branche `MNV-608` (`prospera-paiement-service`)

`npm test` 2296/2296 · `npm run test:e2e` 183/183 (`--runInBand`) · lint 0.

⚡⚡ **Ce que la fiche ne demandait pas et qui change tout : LA FILE NE PORTE
AUCUN SECRET.** La forme évidente — recopier dans la ligne de file le message
tout prêt, jeton et URL compris — crée une **seconde copie** du secret, dans une
collection que personne ne pense à protéger. Ici la ligne ne porte que la
**désignation** du fait ; le lien est reconstruit au moment de remettre, à partir
de la demande relue. AC-3 cesse d'être une discipline de journalisation pour
devenir une propriété : il n'y a rien à masquer, parce qu'il n'y a rien dedans.

⚡ **L'idempotence est la CLEF PRIMAIRE, pas un index à côté** (`_id` =
identifiant de la demande). Un index unique se supprime, s'oublie, et **ne se
crée jamais** sur une collection déjà peuplée de doublons — leçon STORY-240, où
un index anti-fork raté mettait le conteneur en boucle.

⚡ **AC-4 est tenu par le TYPAGE du port** : `remettre` rend un **accusé**, pas
`void`. Un port qui rendrait `void` laisserait marquer « envoyée » sur la seule
foi d'un appel parti. Et un `2xx` sans accusé n'est pas une remise, c'est une
réponse qu'on ne sait pas lire.

⚡ **Un fait constaté ne se perd pas parce qu'un état refuse de bouger**
(STORY-260) : une demande payée entre l'enfilement et la remise ne repasse pas
`Envoyee`, mais la ligne passe `REMIS` et l'acte d'audit dit l'état **réel**.

⚡ **Troisième minuterie du service.** L'inventaire d'AD-12
(`ecriture-argent.invariant.spec.ts`) l'accueille avec le même critère que les
deux autres, mot pour mot : elle ne décide de rien et n'écrit aucun fait de son
propre chef. Le critère n'a pas bougé, et c'est ce qui compte.

⚠️ **Point ouvert PO — l'authentification service-à-service** (déjà dans les
Notes). Livré : jeton de service en en-tête + organisation émettrice dans le
corps. Le cloisonnement est préservé, mais `notification-service` doit encore
décider ce qu'il fait de cette organisation — c'est un point de contrat entre les
deux services.

⚠️ **À faire hors dépôt.** `NOTIFICATION_BASE_URL` et
`NOTIFICATION_JETON_SERVICE` au `docker-compose` racine. Non ajoutées par cette
story : ce fichier n'est dans aucun git et une session voisine l'édite. Leur
absence est un état normal — l'adaptateur **refuse** plutôt que d'envoyer un lien
de paiement à un hôte au hasard.
