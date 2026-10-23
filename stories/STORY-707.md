# STORY-707 : La rotation du secret de signature sortante sert vraiment à la remise

Status: ready-for-dev

**Épic :** EPIC-056 — Le premier message part : port de canal, e-mail, journal et accusés
**Service :** `notification-service`
**Points :** 3 · **Sprint :** rail F, bloc F2
**Prérequis :** **STORY-641** (faits remis chez l'organisation, signés), **STORY-635** (patron de rotation)
**Origine :** rail F · point ouvert du rail D (« le rattrapage de rotation n'est pas branché sur la remise »).

---

## Le récit

En tant qu'**organisation cliente**, je veux pouvoir changer le secret de signature de mes faits
d'envoi sans perdre ceux qui partent pendant que je mets mon serveur à jour.

## Le fait

⛔ **La fenêtre est stockée, et personne ne la lit.** Changer le secret d'une destination sortante
range l'ancien dans `secretSortant` avec une échéance (`retraitDuSecretSortant`), et
`SortiesService.secretSortantServi` sait dire s'il est encore servi — **sans aucun appelant**.
`remettre` signe toujours avec le secret courant : entre le moment où le client change le nôtre et
celui où il change le sien, chaque fait est refusé, compté en échec, et la destination glisse vers la
quarantaine (STORY-641, AC-4).

⚡ **L'ordre fait la rotation (STORY-635)** : le nouveau d'abord, l'ancien en rattrapage, **une seule
fois**, et seulement sur un refus du client — jamais sur une panne réseau.

## Critères d'acceptation

- [ ] AC-1 — Une remise refusée par le client alors que l'ancien secret est **encore servi** est
      retentée **une fois**, signée avec l'ancien.
- [ ] AC-2 — ⛔ Une remise qui échoue sans réponse (délai, connexion) **n'est pas** retentée avec
      l'ancien secret : ce n'est pas un refus de signature.
- [ ] AC-3 — ⚡ Une remise acceptée avec l'ancien secret **remet le compteur d'échecs à zéro**, comme
      une remise acceptée avec le nouveau, et ne compte pas d'échec.
- [ ] AC-4 — Passé l'échéance, l'ancien secret n'est plus jamais essayé (même règle que STORY-635).
- [ ] AC-5 — ⛔ Aucun des deux secrets n'apparaît dans un journal, une trace d'erreur ou une réponse
      d'API.
