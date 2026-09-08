# STORY-579 : Envoi unitaire : idempotence arbitrée par la base, accusés append-only, statut projeté, coût figé

Status: done

**Épic :** EPIC-056 — Le premier message part : port de canal, e-mail, journal et accusés 🏁
**Service :** `notification-service` (nouveau)
**Points :** 8 · **Sprint :** S41
**Prérequis :** **STORY-573** (carnet) · **STORY-576** (résolution et variables) · **STORY-578** (files)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-1, AD-3, AD-4, AD-14, AD-15, AR-07, AR-08, AR-19.

---

## Le fait

**Keystone du module.** Elle porte les trois invariants que tout le reste suppose acquis.

⚡ **La clé d'idempotence n'est pas l'`eventId` seul.** `kyc.status.changed` prévient légitimement le
dirigeant par e-mail **et** le gestionnaire de compte en in-app, et FR-N24 rend la correspondance
événement → modèle configurable par organisation. Une clé réduite à `(orgId, eventId, canal)`
**ferait avaler silencieusement** le second envoi comme un rejeu.

⛔ **Le statut ne recule jamais.** Sur WhatsApp, l'inversion des accusés est la **norme**, pas
l'exception.

## Critères d'acceptation

- [x] AC-1 — Une demande d'envoi porte modèle, destinataire, variables, canal et **identité de
      l'appelant** — **jamais un texte déjà rendu** (FR-N23). Tout `Envoi` porte le **module qui a
      parlé**.
- [x] AC-2 — ⚡ Index unique sur
      `(orgId, cleIdempotence, regleDeclenchementId, destinataireRef, canal)`, la `cleIdempotence`
      venant de l'appelant ou de l'`eventId` du bus (AR-08). Un test couvre le cas qui justifie la
      clé étendue : **un événement, deux envois légitimes**, aucun avalé.
- [x] AC-3 — ⚡ **Le rejeu est un succès** : une erreur de clé dupliquée se traite comme un succès —
      jamais comme une panne, **jamais comme un `409`**. Aucun verrou applicatif, aucun verrou Redis,
      aucun `find` préalable. `findOneAndUpdate` ou `insertMany(ordered: false)`, **jamais un
      `insert` nu**.
- [x] AC-4 — ⛔ **Test de la définition de terminé, pas de la recette** (AR-19, NFR-4) : rejouer N fois
      la même demande et le même événement — **en désordre, en parallèle, et après redémarrage du
      service** — produit **exactement un** message chez le destinataire.
- [x] AC-5 — Boîte de réception d'accusés **append-only** : accusé persisté **brut**, signature
      **vérifiée avant persistance**, clé `(passerelle, referenceAccuse)`. Un accusé non signé ou mal
      signé est **rejeté et tracé**, jamais traité (`SIGNATURE_INVALIDE` → `401`).
- [x] AC-6 — ⛔ Statut = `max(états observés)` sur l'ordre total
      `prepare < envoye < delivre < lu < repondu`, **écrit dans la transaction qui insère l'accusé**
      et jamais recalculé à la lecture — sinon FR-N39 devient une agrégation sur toute la collection.
      `echoue` est terminal, atteignable depuis `prepare` et `envoye` uniquement, avec un **motif
      nommé**. Un test envoie les accusés **en ordre inversé** et vérifie qu'aucun saut arrière ne se
      produit.
- [x] AC-7 — NFR-1a : **aucun statut de lecture ne circule sans son `niveauCertitude`**
      (`confirmé` · `présumé` · `indisponible sur ce canal`). Un test de schéma le rend impossible.
- [x] AC-8 — AD-14 : chaque remise écrit une **entrée d'audit dans la base protégée** — `orgId`,
      `moduleAppelant`, `identifiantCanal`, `canal`, `modele@version`, `cout`, horodatage — **sans
      variables et sans rendu**, dans la **même transaction** que la transition vers `envoye`.
- [x] AC-9 — ⚠️ **Le journal sépare le squelette des variables dès maintenant** (AD-15) : les
      variables portent une horloge de **90 jours**, plus courte que les **13 mois** du journal
      détaillé. Un schéma qui les mélange rendra EPIC-062 impossible sans migration. Le **rendu figé
      n'est jamais conservé**.
- [x] AC-10 — `Cout = (montantMineur: entier, devise)` figé sur l'`Envoi` à l'envoi. **Aucun `number`
      flottant, aucune conversion, aucun total inter-devises.** La restitution et l'agrégation
      relèvent d'EPIC-060.
- [x] AC-11 — FR-N26 : un envoi transactionnel **ignore le désabonnement de masse** mais **respecte un
      blocage global**. Le régime naît du point d'entrée (AD-1), jamais d'un paramètre.
- [x] AC-12 — Journal consultable et exportable, **filtrable** par période, canal, module appelant et
      statut (FR-N39). Rejeu manuel d'un envoi échoué **sans reconstruire la demande d'origine**
      (FR-N40).
- [x] AC-13 — Parseur **brut uniquement** sur les routes de webhook ; parseur JSON standard partout
      ailleurs (AR-07). Un parseur global casserait silencieusement la vérification de signature.

## Notes

🏁 Clôt EPIC-056 et le **bloc 1**.

⚠️ **La boîte d'accusés est construite ici et reste largement inerte** : SMTP ne rend pas d'accusé de
lecture, donc l'e-mail n'atteint que `envoye` / `echoue` dans ce sprint. À documenter **et tester
comme inerte** — leçon STORY-173 : un test vert sur un chemin sans appelant a déjà fait croire trois
fois dans ce dépôt qu'un câblage existait.

⚡ **Le troisième test de la définition de terminé** (exactitude du XOF à zéro décimale, AR-19)
appartient à EPIC-060, avec la restitution de consommation. Les deux autres sont ici (rejeu) et dans
EPIC-061 (reprise d'un envoi de masse interrompu).

---

## Livraison — 2026-09-05, branche `MNV-579` sur `origin/dev`

🏁 **EPIC-056 close, bloc 1 clos.** 1 451 tests unitaires (114 suites) + 91 e2e +
32 de conformité ; couverture 99,12 / 91,62 / 96,67 / 99,15.

**Ce qui a changé par rapport à la fiche, et pourquoi :**

- ⚡ **L'index d'idempotence porte SIX champs, pas cinq.** AC-2 en nomme cinq
  (AD-3) ; AC-6 (`echoue` terminal), AC-12 (rejeu) et AD-15 (le rejeu produit un
  **nouvel** `Envoi` chaîné) sont **inapplicables** à cinq — le rejeu porterait
  exactement la même clé que l'envoi qu'il rejoue, et l'index qui protège du
  doublon rendrait le rejeu impossible. La `tentative` est **dérivée** de l'envoi
  rejoué, jamais tirée d'un compteur : deux clics rendent le même document, par
  le même index. ⚠️ **À remonter à l'architecte** : AD-3 est à amender.

- ⛔ **L'atomicité d'AD-14 était inapplicable telle que le câblage se
  présentait.** Deux connexions Mongoose sont deux `MongoClient` ; le pilote
  refuse une opération servie avec une session née d'un autre. Remède :
  `connexion.useDb(BASE_PREUVES)`, qui partage le client. Une conformité exécute
  la faute exacte.

- ⛔ **L'URL de webhook porte un jeton opaque, pas l'`orgId`.** La garde
  `cloisonnement-par-le-jeton.invariant.spec.ts` (STORY-572) a refusé la première
  version ; AD-17 exige déjà un jeton opaque sur l'autre surface publique.

- ⛔ **Le contrat `notification.envoi.lu` était faux** (`confirme | probable |
  declare`, trois valeurs absentes du domaine). Corrigé avant la première
  publication.

**Écarts assumés :** `ecarte` reste sans écrivain (EPIC-059) ; la boîte
d'accusés est inerte pour l'e-mail (EPIC-064) ; le contrôle de blocage global
est réel et sans effet observable tant que `desabonnements` est vide (EPIC-059).

**⛔ Décision PO ouverte :** aucun des cinq droits ne couvre la demande d'envoi
ni le rejeu. `POST /envois` est gardé par le seul gate d'organisation — c'est un
module qui parle à un module (AD-2) — et le **rejeu**, qui est une écriture, est
gardé par `notification:journal:consulter`, un droit de **lecture**. Un sixième
droit est à trancher ; c'est la troisième surface du service dans ce cas, après
le carnet (STORY-573) et la remise d'essai (STORY-577).
