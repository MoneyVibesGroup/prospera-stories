# STORY-573 : Carnet de contacts : identifiant normalisé comme clé, dédoublonnage, destinataire polymorphe

Status: done

**Épic :** EPIC-054 — Socle `notification-service`, carnet de contacts et cloisonnement 🏁
**Service :** `notification-service` (nouveau)
**Points :** 5 · **Sprint :** S41
**Prérequis :** **STORY-571** (bases) · **STORY-572** (gate et cloisonnement)
**Origine :** découpage `epics-notification-2026-08-04.md`, spine `architecture/architecture-notification-service-2026-08-03/` AD-11, AD-12, AR-10.

---

## Le fait

Un numéro béninois normalisé en `+228` par une organisation togolaise multi-pays produit **soit deux
fiches pour une personne, soit une fusion à tort — et rien ne le signale**. C'est l'échec silencieux
que cette story ferme.

⚡ **La forme normalisée est la clé et elle est persistée ; la forme brute saisie est conservée à
côté.** Une mauvaise normalisation devient alors **diagnosticable et corrigeable** au lieu d'être
invisible.

⛔ **Aucun contact miroir pour un utilisateur Prospera.** Le destinataire est **polymorphe** :
`Contact` (carnet, canaux externes) ou `Utilisateur` (read-model d'identité, canal in-app
**uniquement**). En créer un « par uniformité » le ferait tomber sous la purge des 3 ans et sous le
désabonnement, et constituerait une **seconde source de vérité** de l'identité, qui appartient à
`auth-service`.

## Critères d'acceptation

- [~] AC-1 — **PARTIEL, voir « Livraison »** — Un `Contact` porte le nom d'usage, un ou plusieurs identifiants de canal, la langue
      préférée et le consentement par nature de message. **Rien d'autre.**
- [x] AC-2 — ⛔ **Aucune donnée métier ne peut entrer** : montant dû, solde, score, statut de dossier
      transitent comme **variables de message**. Un test de schéma refuse tout champ libre ou
      dictionnaire ouvert qui pourrait en recevoir — sans quoi le carnet dérive en second CRM.
- [x] AC-3 — Normalisation en **fonction pure du domaine** : format international pour le téléphone,
      minuscules pour l'e-mail. L'indicatif par défaut vient du **pays de l'organisation** dans le
      read-model `identity.org`, et il est **surchargeable à l'import**.
- [x] AC-4 — ⚡ **Les deux formes sont stockées** : `identifiantNormalise` (la clé, portant l'index
      unique `(orgId, canal, identifiantNormalise)`) et `identifiantBrut`. Le compte rendu d'import
      (FR-N08) montre **les deux, avant persistance**, avec créations, rapprochements, lignes
      rejetées et motif.
- [x] AC-5 — Le dédoublonnage **s'arrête à la frontière de l'organisation** : deux organisations
      détenant le même numéro détiennent deux contacts distincts, sans lien ni visibilité mutuelle —
      **y compris à la recherche par identifiant** (FR-N07). Prouvé avec deux organisations réelles.
- [x] AC-6 — L'inscription par un module est **idempotente** (clé = identifiant normalisé) et
      **n'écrase jamais un consentement**. Un contact porte la trace des modules inscripteurs, et la
      lecture filtre sur les modules souscrits par l'organisation.
- [x] AC-7 — ⛔ AD-12 : **aucun chemin de code ne crée un `Contact` à partir d'un utilisateur**, et le
      carnet n'est **jamais** alimenté par `identity.*`. Un test de mutation le prouve.
- [x] AC-8 — Un identifiant non normalisable est un **refus nommé** `IDENTIFIANT_NON_NORMALISABLE`,
      jamais un enregistrement silencieux de la forme brute.

## Notes

🏁 Clôt EPIC-054.

---

## Livraison (2026-09-04)

Branche **`MNV-573`** sur `origin/dev` de `prospera-notification-service`, qui
portait déjà 570, 571 et 572. ⚠️ **`origin/dev` porte STORY-572 sous le SHA
`d936e44`, pas `4d53a7a`** : « Rebase and merge » réécrit le commit de branche.

**675 tests unitaires (62 suites) + 34 e2e**, seuils du moule tenus
(65/90/90/90) ; `carnet.service.ts` à 100 % de lignes, 88 % de branches.

### AC-1 est PARTIEL, et l'écart est un arbitrage d'architecture

Le `Contact` porte le nom d'usage, les identifiants de canal et la langue. Il ne
porte **pas** le consentement, parce qu'AD-14 range `Consentement` dans la **base
de preuves**, en ajout seul — le service n'y détient ni `update` ni `remove`.
Porté sur la fiche, un consentement serait modifiable par la requête même qui
écrit le nom d'usage, donc **écrasable par une ré-inscription** : exactement ce
qu'AC-6 interdit. L'invariant est ici **structurel** — `CarnetModule` n'a aucune
connexion vers la base de preuves, donc aucun chemin d'écriture du carnet ne peut
atteindre un consentement. Le registre lui-même est livré par **EPIC-059**.

### Ce que la livraison a appris, et qui ne se déduit d'aucune lecture

- ⚡ **Le marqueur d'idempotence de STORY-572 est keyé par `eventId` SEUL — donc
  un seul consumer group par topic, pour toujours.** Le carnet devait connaître
  **tous** les modules souscrits (FR-N04) ; un second consommateur de
  `entitlement.changed` aurait trouvé chaque événement **déjà marqué** et
  n'aurait **jamais rien écrit**, sans une erreur. Les deux read-models sont donc
  écrits par le même consommateur, dans la même transaction — et l'assertion de
  STORY-572 (« ignore les autres modules SANS marquer ») a dû être **retournée**.
  Règle générale : *avant d'ajouter un consommateur sur un topic déjà consommé,
  regarder la clé du marqueur.*
- ⚡ **`identity.org.updated` ne porte pas de pays ; `identity.org.created` oui.**
  Un `$set` inconditionnel y écrirait `undefined` : au premier changement de
  raison sociale, l'indicatif par défaut de l'organisation disparaîtrait et
  **tous** ses numéros nationaux deviendraient `PAYS_INCONNU` — une panne du
  carnet déclenchée par un événement qui n'a rien à voir avec lui.
- ⚡ **`@Prop({ type: Types.ObjectId })` produit un chemin d'instance `Mixed`**
  (mesuré ; `MongooseSchema.Types.ObjectId` donne bien `ObjectId`). C'est la forme
  employée dans `auth-service`, `paiement-service` **et** ici : toutes les clés
  d'organisation du programme sont sans conversion ni contrôle de type. Corrigé
  sur les trois schémas de cette story ; le reste est une dette de programme.
- ⚡ **Le zéro initial ne se retire pas partout** : `06…` devient `+336…` en
  France et reste `+3906…` en Italie. La table pays porte donc le préfixe
  interurbain, et son absence **affirme** que le zéro appartient au numéro.
- ⚠️ **La table des indicatifs n'est pas un plan de numérotation** : elle dit quel
  indicatif préfixer, jamais si le numéro existe. Le valider demanderait une
  bibliothèque absente du stack ratifié — décision d'architecture, pas geste de
  story. Un pays hors table produit un refus visible, jamais un numéro deviné.
- ⚠️ **Le plafond de corps JSON par défaut (100 ko) rendait FR-N08
  inatteignable** : un lot de 5 000 lignes pèse ~250 ko. Relevé à 1 Mo. Un
  dépassement sort encore en **500** et non en `413` (l'erreur de `body-parser`
  n'est pas une `HttpException`) — requalification à faire au socle. Et **ne pas**
  écrire de test e2e postant 5 001 lignes : la suite passe de 107 s à 4 000 s.
- ⚠️ **Aucun des cinq droits de FR-N53 ne couvre le carnet** : les routes sont
  gardées par le gate d'organisation seul. Ajouter un sixième droit ferait entrer
  au catalogue plateforme une permission que le PRD ne décrit pas — **décision
  PO**.
- ⚠️ **L'import reçoit des lignes JSON, pas un fichier CSV.** Le décodage du
  fichier appartient à la surface qui le reçoit ; un analyseur ici mélangerait
  « ligne illisible » et « identifiant non normalisable », deux fautes que FR-N08
  demande de distinguer.
