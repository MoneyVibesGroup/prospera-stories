# STORY-583 : Surface publique de désabonnement — jeton opaque, opposabilité immédiate, aucune lecture du carnet

Status: done

**Épic :** EPIC-059 — Consentement, désabonnement et droits des personnes
**Service :** `notification-service`
**Points :** 3 · **Sprint :** S42
**Prérequis :** **STORY-582** (registre de consentement)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-17, AR-13.

---

## Le fait

⛔ **Exactement deux préfixes sont exemptés de la validation JWT à la gateway, nommément et de manière
énumérée, jamais par un motif large** : la surface publique de désabonnement et les webhooks de
passerelle. Aucune autre route n'est publique.

⚡ **Le jeton est opaque à forte entropie**, sans aucun identifiant devinable — ni `orgId`, ni
identifiant de contact, ni séquence. Sans quoi le lien devient un outil d'**énumération des
destinataires** d'une organisation.

## Critères d'acceptation

- [x] AC-1 — Tout message de masse porte un moyen de désabonnement **adapté au canal** (FR-N47).
      Pour l'e-mail et l'in-app : le lien public.
- [x] AC-2 — Le jeton **ne désigne qu'un couple `(identifiantCanal, canal)`** et **n'ouvre aucune
      lecture du carnet**. Aucune donnée de contact n'est rendue par la page.
- [x] AC-3 — ⛔ **Un jeton inconnu et un jeton révoqué rendent la même réponse.** Les distinguer
      révèle l'existence du contact. Test explicite sur les deux cas.
- [x] AC-4 — Le désabonnement est **opposable immédiatement** (FR-N48) : l'entrée de consentement est
      écrite avant que la page réponde.
- [x] AC-5 — AR-13 : la surface porte **son propre plafond de débit, par jeton et par IP**.
      Les deux préfixes publics sont **énumérés** en configuration de gateway, et un test de présence
      refuse tout motif large.
- [x] AC-6 — Le gabarit de la page est **livré avec le code** — c'est la seule surface servie par ce
      service (AD-17), et son rendu emprunte le moteur de gabarits système, pas celui des modèles de
      base (AD-8).

## Notes

⚠️ **FR-N47 reste partielle jusqu'à EPIC-064.** Sur les canaux où le refus arrive comme un message
entrant — « répondez STOP » en SMS et WhatsApp — l'interception vit dans EPIC-064. L'écart est sans
effet tant qu'EPIC-063 n'est pas ordonnancé ; **il redevient bloquant le jour où il l'est**.

## Livraison — 2026-09-05, branche `MNV-583` sur `MNV-582`

1 675 tests unitaires (139 suites) + 118 e2e ; couverture globale 99,24 %, et
100 % sur les huit fichiers de la story.

**Ce qui a changé par rapport à la fiche, et pourquoi :**

- ⛔ **AC-1 et AD-12 se contredisent sur l'in-app, et le code suit AD-12.**
  L'AC nomme l'in-app parmi les canaux qui portent le lien public ; AD-12 dit
  que « le désabonnement de masse ne s'applique pas à l'in-app : ce sont des
  alertes applicatives, **de nature transactionnelle** ». Un lien y aurait été
  **inopérant par construction** — `natureOpposable` (STORY-582) ramène toute
  cloche au registre transactionnel, donc un refus enregistré depuis ce lien
  n'aurait jamais été relu. Plutôt que d'écrire un lien décoratif, un envoi de
  masse vers une cloche est **refusé** (`CANAL_SANS_ENVOI_DE_MASSE`, `422`).
  ⚠️ **Décision PO** : soit AD-12 tient et l'AC-1 est trop large, soit AD-12
  s'amende et `natureOpposable` doit changer — ce qui modifierait du code de
  STORY-582, et n'a pas été fait sans arbitrage.

- ⛔ **AC-5 parlait d'une « configuration de gateway ». Il n'y en a aucune.**
  Relevé au `docker-compose` racine : ni Traefik, ni Kong, ni nginx — chaque
  service valide lui-même le jeton. L'exemption d'AD-17 **est** le décorateur
  `@Public()`, et c'est lui qui est inventorié
  (`common/surfaces/surfaces-publiques.ts` + sa garde). Une garde qui aurait lu
  un fichier de configuration inexistant serait passée verte sur zéro ligne.
  ⚠️ La **sonde de santé** est déclarée à part : ouverte elle aussi, mais sans
  effet métier, sans corps, sans destinataire, et interrogée par le
  `healthcheck` du conteneur. La fondre aurait fait dire « trois » à un
  invariant qui dit « deux » ; la taire aurait fait mentir l'inventaire.

- ⚡ **AC-6 n'a demandé AUCUNE dépendance.** AD-8 *autorise* un moteur complet
  pour un gabarit livré avec le code ; la page n'a ni condition ni boucle, et
  inscrire `handlebars` aurait affaibli une garde réelle contre un bénéfice nul.
  Le moteur système est écrit à la main et **échappe le HTML** — ce que le
  moteur des modèles clients ne fait pas et ne doit pas faire, puisqu'il produit
  du texte. Les partager aurait introduit un XSS sur la seule page publique du
  service.

- ⛔ **Un défaut LIVRÉ, corrigé ici : le jeton fuyait dans le journal.**
  `epurerJournal` (STORY-570) porte sur des **noms de champs** ; le
  `LoggingInterceptor` et le filtre d'exceptions composent une **phrase**, où le
  jeton voyage à l'intérieur de `msg`. Le défaut touchait **aussi les webhooks**
  depuis STORY-579 — un secret de configuration de passerelle, en clair, lisible
  par toute l'exploitation. `masquerJetonDUrl` le corrige pour les deux, en
  dérivant le masque de l'énumération d'AD-17.

- ⚡ **`GET` n'écrit rien, et ce n'était pas dans la fiche.** Un lien qui
  agirait à l'ouverture est déclenché par tout ce qui préfetche : Outlook Safe
  Links, le proxy d'images de Gmail, un antivirus de messagerie. Des gens
  seraient désabonnés **sans avoir cliqué**. D'où deux temps : la page confirme,
  le `POST` agit.

- ⚡ **AC-1 est tenu par un TYPE, pas par une vigilance.** `enfilerMasse`
  n'accepte qu'un `RenduDeMasse`, marqué par un `unique symbol` que seul
  l'apposeur sait produire — un champ `lienDesabonnement: string` se serait
  rempli d'une chaîne vide au premier copier-coller.

- ⚡ **Le clic enregistre `MASSE`, jamais `GLOBAL`.** Un acte global écrirait
  aussi la nature `TRANSACTIONNEL` et éteindrait confirmations, échéances et
  mises en demeure. « Ne me contactez plus du tout » reste l'acte distinct de
  STORY-584.

- ⛔ **L'événement `notification.desabonnement.enregistre` n'est PAS publié, et
  c'est AC-2 qui l'interdit.** STORY-582 avait renvoyé ici l'événement sortant.
  Or son contrat (livré en STORY-570) exige un **`contactId`** — « PORTE UN
  contactId, JAMAIS l'identifiant de canal : ce topic est durable, rejouable et
  lisible par tout consumer group ». Le jeton, lui, ne désigne qu'un couple
  `(identifiantCanal, canal)` et **n'ouvre aucune lecture du carnet** : obtenir
  le `contactId` demanderait exactement la lecture qu'AC-2 refuse, et stocker le
  contact sur le jeton ferait de celui-ci la **porte** que le schéma refuse
  d'ouvrir. Aucun consommateur n'existe aujourd'hui. **Deux issues, au PO :**
  publier depuis les chemins qui détiennent déjà le contact — l'acte
  administratif (STORY-584, `origine: administratif`) et le « STOP » entrant
  (EPIC-064) — ou amender le contrat pour qu'il porte le couple plutôt que le
  contact, ce qui contredirait sa propre justification.

**Écarts assumés :** `ApposeurDesabonnementService` n'a **aucun appelant** —
l'exécution d'un `EnvoiDeMasse` arrive avec EPIC-061 ; la **purge** des jetons
expirés (AD-18) appartient à EPIC-062, jusque-là l'expiration n'est opposable
qu'à la **lecture** ; la page est en **français seulement**, la langue du
destinataire attendant le référentiel (EPIC-060).

**⛔ Deux décisions PO ouvertes :** l'in-app ci-dessus, et la troisième reste
celle de STORY-579 — aucun des cinq droits ne couvre la demande d'envoi ni le
rejeu.

**⚠️ `sprint-status.yaml` est en retard sur le rail** : STORY-580 et 581 sont
sur `origin/dev` et y figurent encore en `ready-for-dev`, STORY-582 est livrée
sur sa branche. Seule la ligne de STORY-583 a été corrigée ici — corriger celles
des autres, depuis une session qui ne les a pas livrées, aurait effacé ce que
leur propre clôture doit écrire.
