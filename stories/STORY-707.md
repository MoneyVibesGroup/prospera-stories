# STORY-707 : La rotation du secret de signature sortante sert vraiment à la remise

Status: done

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

- [x] AC-1 — Une remise refusée par le client alors que l'ancien secret est **encore servi** est
      retentée **une fois**, signée avec l'ancien.
- [x] AC-2 — ⛔ Une remise qui échoue sans réponse (délai, connexion) **n'est pas** retentée avec
      l'ancien secret : ce n'est pas un refus de signature.
- [x] AC-3 — ⚡ Une remise acceptée avec l'ancien secret **remet le compteur d'échecs à zéro**, comme
      une remise acceptée avec le nouveau, et ne compte pas d'échec.
- [x] AC-4 — Passé l'échéance, l'ancien secret n'est plus jamais essayé (même règle que STORY-635).
- [x] AC-5 — ⛔ Aucun des deux secrets n'apparaît dans un journal, une trace d'erreur ou une réponse
      d'API.

---

## Livré le 2026-10-23 — branche `MNV-707` (`prospera-notification-service`, sur `origin/dev`)

`npm test` 3 402/3 402 (255 suites) · `npm run test:e2e` 246/246 · lint 0 · build vert.

- Le port de remise sortante rend désormais le **statut HTTP** du client, **absent** s'il n'a rien
  répondu : « le client a dit non » et « le client n'a rien dit » appellent deux gestes.
- `estRefusDeSignature` (domaine) : **401 et 403 seulement**. Un `400` dit *je ne comprends pas*, un
  `5xx` *je suis en panne* — ni l'un ni l'autre ne changerait avec l'ancien secret. Le contrat du
  récepteur est écrit au README (répondre `400` à une mauvaise signature prive du rattrapage).
- `remettre` : sur un refus de signature, pendant la fenêtre (`secretSortantServi`, enfin appelée),
  **un** second essai signé avec l'ancien secret ; succès ⇒ fait remis et série rompue ; double refus ⇒
  **un seul** échec compté.
- ⚡ Le double du test **juge la signature** comme le ferait le client : sans cela, rien n'aurait
  prouvé *quel* secret a signé la remise acceptée.

⛔⛔ **Défaut de production trouvé par AC-3, hors rotation.** La remise à zéro de la série d'échecs
filtrait `{ _id: destination.organizationId }` — or une destination a son propre `_id`, l'organisation
est un champ à part. **La série ne se rompait jamais** : une adresse qui échoue une fois de temps en
temps franchissait le seuil de quarantaine par le seul passage du temps, et frappait d'abord les
organisations qui reçoivent le plus de faits (la leçon de STORY-633, sur un autre objet). Filtre
corrigé sur `organizationId`, test de non-régression. Les tests de STORY-641 ne l'avaient pas vu : ils
vérifiaient `remisLe`, jamais le compteur.
