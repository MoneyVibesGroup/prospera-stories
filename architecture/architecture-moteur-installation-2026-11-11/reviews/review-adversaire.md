# Relecture adversaire — Spine « Moteur d'installation »

Date : 2026-11-11. Cible : `ARCHITECTURE-SPINE.md` (draft). Méthode : pour chaque paire d'unités un niveau plus bas, deux constructions qui respectent chaque AD à la lettre et pourtant ne s'assemblent pas. Chaque paire se clôt par un AD nouveau ou resserré, écrit en une phrase de Rule.

Gravité : **B** = bloquant (perte de droit, de donnée, ou faille de sécurité), **M** = majeur (incident de production probable), **m** = mineur.

## Verdict

La spine fixe bien les propriétaires par donnée, mais elle laisse **sans forme ni version** presque tous les contrats qui traversent deux unités (état voulu, licence projetée, entrée de journal, copie de consentement), laisse **deux parties A** émettre et horodater le même fait sans règle de séparation, et ne dit pas **qui lance les migrations de la partie A** ni **qui tient la porte pendant une promotion**.

## Tableau de synthèse

| # | Paire | Gravité | AD proposé |
|---|---|---|---|
| 1 | Partie A essai / partie A réel : horloge et échéances | B | AD-6 resserré + AD-21 |
| 2 | Deux parties A, un seul topic `etat-publie.changed` | B | AD-17 resserré |
| 3 | Agent / partie A : licence reçue pendant une installation ou un GEL | B | AD-8 resserré |
| 4 | Agent / centrale : forme, version et ordre de l'état voulu | B | AD-22 (nouveau) |
| 5 | Centrale / paiement-service : source de l'échéance d'un client hébergé | B | AD-19 resserré |
| 6 | Agent / partie A : migrations de A pendant une promotion | B | AD-11 resserré |
| 7 | Auto-mise à jour de l'agent pendant une promotion | M | AD-3 resserré |
| 8 | Deux services sur `instance.journal`, deux formes | M | AD-12 resserré |
| 9 | Consentement retiré entre deux contacts | B | AD-13 resserré |
| 10 | Rafraîchissement (réel vers essai) et essai prospect | M | AD-15 resserré |
| 11 | Niveau `LOGICIEL` (gel à 7 jours) contre A-1 (30 jours) | M | AD-4 resserré |
| 12 | Sauvegarde (AD-16) et retour arrière `AVEC_PERTE` | B | AD-16 resserré |
| 13 | `GET /heure` : qui répond quand l'agent est en cours de remplacement ou l'horloge refusée | M | AD-6 resserré |
| 14 | Deux jetons de licence acceptés par deux agents (jumeau de sauvegarde) et empreinte | M | AD-4 resserré |
| 15 | `instance.indicateurs` / `instance.journal` : topics `instance.*` partitionnés par `instanceId` alors que les services connaissent `organisationId` | m | Conventions resserrées |
| 16 | Sanction portée par la licence suivante contre licence qui n'arrive pas | M | AD-8 resserré |

---

## 1. Partie A de l'essai et partie A du réel : qui tient l'horloge, et les échéances d'un même contrat

**Construction X (partie A de l'essai).** L'espace essai sur site appelle `GET /heure` de l'agent (AD-6), crée ses tâches BullMQ avec la clef `<organisationId>:<module>:<transition>:<date>` dans **son** Redis, et émet `etat-publie.changed` pour l'organisation.

**Construction Y (partie A du réel).** Même code, même clef, **son** Redis. Elle lit le même `GET /heure`. Mais l'essai prospect et son effacement relèvent de l'horloge de Money Vibes (A-1, ligne « Essai prospect ») et l'essai d'un client sur site relève de l'horloge scellée. Y calcule la fin de préavis sur `echeanceLe` de la licence ; X, qui reçoit `instance.licence.acceptee` à un autre moment (événement par espace, pas atomique), calcule la même transition avec la licence précédente.

**Pourquoi c'est incompatible tout en respectant chaque AD.**
- AD-6 dit que la clef est idempotente, mais l'idempotence est **locale à un Redis** : deux espaces produisent deux fois la transition, à deux instants (la licence N arrive chez Y à 10:00:01, chez X à 10:00:09).
- Aucun AD ne dit quel fait d'horloge s'applique dans un espace d'essai (horloge de la plateforme pour le prospect, horloge scellée pour l'essai d'un client sur site). Deux équipes lisent « HorlogeDeReference » de deux façons.
- `GET /heure` ne dit pas **quelle horloge** il rend ni s'il porte le numéro de l'heure de référence signée : deux lectures successives peuvent diverger après une correction signée (recul).

**Gravité : B** (une échéance qui tombe dans un espace et pas dans l'autre ; un module lecture seule dans le réel mais ouvert dans l'essai).

**AD resserré (AD-6).** *Rule :* `GET /heure` rend un objet `{ instantUtc, horlogeId ∈ {SCELLEE, PLATEFORME}, numeroHeureReference, lamport }` et toute tâche d'échéance enregistre `numeroHeureReference` ; deux espaces d'une même instance **lisent la même horloge** (jamais une horloge par espace), et une correction signée vers l'arrière **annule et recalcule** toutes les tâches d'échéance dont la date est postérieure à l'ancienne lecture.

**AD nouveau (AD-21, « L'état d'un contrat est le même dans les deux espaces »).** *Rule :* un contrat (organisation, module) a **un seul fait de contrat par instance**, tenu par la partie A du **réel** et recopié à la partie A de l'essai par l'événement `instance.licence.acceptee` avec le même `numeroLicence` ; la partie A de l'essai n'émet jamais une transition de contrat avant d'avoir reçu ce numéro, et l'essai prospect (horloge `PLATEFORME`) est un fait distinct, de nature `ESSAI_PROSPECT`, jamais confondu avec un contrat.

---

## 2. Deux parties A, un seul topic `etat-publie.changed`, la même organisation

**Construction X.** La partie A de l'essai émet `etat-publie.changed` (état absolu, `eventId`, partition `organisationId`) sur le topic unique de l'AD-17.

**Construction Y.** La partie A du réel émet sur le **même** topic, pour le même `organisationId` (AD-15 garantit un seul identifiant). Les gardes des modules d'un espace consomment les deux flux.

**Pourquoi c'est incompatible.** AD-2 dit « état publié (seul émetteur) » **par partie A**, mais il y en a deux par instance. AD-17 donne un seul producteur « partie A, seule ». Les gardes du module en essai reçoivent l'état du réel, et inversement : un état « EN_INSTALLATION » du réel désactive l'essai. Les `eventId` ne sont pas comparables entre deux producteurs, et une partition par `organisationId` seule ordonne mal deux sources.

**Gravité : B** (un module de l'essai coupé par une transition du réel).

**AD resserré (AD-17).** *Rule :* `etat-publie.changed` porte `espace ∈ {ESSAI, REEL}` et `instanceId` dans sa clef de partition et dans son `eventId`, chaque service consomme **uniquement les messages de son propre espace**, et les deux espaces d'une instance utilisent deux topics (`etat-publie.changed.essai`, `etat-publie.changed.reel`) lorsqu'ils partagent un même Kafka (socle C10).

---

## 3. L'agent et la partie A sur la licence : licence reçue pendant une installation, ou pendant un GEL

**Construction X (agent).** À chaque licence valide, l'agent émet `instance.licence.acceptee` (AD-8) puis considère la remise **faite**. Il ne réémet pas.

**Construction Y (partie A).** Elle projette la licence en entitlements de source `licence`. Pendant `EN_INSTALLATION` elle bloque toute écriture d'entitlement (FR-4, rejeu par les contrats d'import), donc elle **ignore** l'événement ; pendant `GEL` elle n'applique que ce qui restreint.

**Pourquoi c'est incompatible.** AD-8 ne fixe ni accusé de réception, ni rejeu, ni ordre. La licence est perdue sans erreur, et l'agent croit la remise faite alors que la partie A tient l'ancienne. Au redémarrage de A, rien ne lui redit la licence acceptée. En `GEL` : l'agent a accepté une licence plus récente (qui lève le gel, car elle porte un `echeanceLe` plus tardif) mais la partie A, qui projette « ce qui restreint », ne rouvre pas.

**Gravité : B** (client payé, modules fermés ; ou sanction non appliquée).

**AD resserré (AD-8).** *Rule :* l'événement `instance.licence.acceptee` est un **état absolu** (licence complète + `numeroLicence`) que la partie A de chaque espace acquitte par `instance.licence.projetee{espace, numeroLicence}`, que l'agent **republie à chaque démarrage de la partie A et à chaque contact** jusqu'à l'accusé de chaque espace, et la partie A **met en file puis applique dans l'ordre du numéro** toute licence reçue pendant `EN_INSTALLATION` ou `GEL`, la levée du gel se calculant sur la licence acceptée la plus récente et non sur celle déjà projetée.

---

## 4. L'agent et la centrale sur l'état voulu : format, version, ordre

**Construction X (centrale).** Publie un état voulu `{licence, versionPlateforme: "2.4.0", interrupteurs, sanctions, heureReference}` en JSON, champs additifs à chaque version de la centrale ; un état voulu plus ancien est simplement remplacé par le plus récent publié pour l'instance.

**Construction Y (agent).** Applique le dernier état reçu, signé et valide. Il sait opérer N et N-1 (AD-3). Un état voulu qui demande la version N+2, ou une version dont il n'a pas les images, ou plus ancienne que l'installée, est vérifié, accepté, puis... ?

**Pourquoi c'est incompatible.** La spine ne définit nulle part : (a) le **schéma versionné** de l'état voulu ; (b) la règle « plus récent » (numéro croissant **par clef**, AD-7, mais l'état voulu est un agrégat de plusieurs JWS, sans numéro propre) ; (c) la réaction à un état voulu qui **recule** la version (c'est un retour arrière demandé par la centrale ? par qui est-il décidé, FR-18 donne la décision au DSI ?) ou qui demande plus que ce que l'agent sait opérer. Un agent applique le recul comme un ordre ; l'autre comme une proposition.

**Gravité : B** (retour arrière silencieux imposé par un état voulu ; ou agent bloqué sur une version qu'il ne sait pas lire, donc sans mise à jour de l'agent possible).

**AD nouveau (AD-22, « L'état voulu est un document versionné et une proposition »).** *Rule :* l'état voulu est un document unique `{schemaEtatVoulu, revision (entier croissant par instance), licence, versionCible, ...}` signé comme un tout, que l'agent refuse s'il porte un `schemaEtatVoulu` supérieur à celui qu'il sait lire (code `ETAT_VOULU_TROP_RECENT`, qui déclenche une mise à jour de l'agent seul, jamais de la plateforme), traite toute `versionCible` antérieure à l'installée comme une **proposition de retour arrière à soumettre au DSI** (jamais appliquée seule, FR-18), et n'applique jamais une `revision` inférieure à la dernière acceptée.

---

## 5. La centrale et paiement-service : source de l'échéance d'un client hébergé

**Construction X (centrale).** Pour un client hébergé sur la plateforme, la centrale émet aussi une licence (AD-2 : « licences émises ») avec `echeanceLe`, calculée à partir de l'abonnement d'hébergement lu dans paiement-service, et la partie A de la plateforme la lit.

**Construction Y (partie A de la plateforme).** AD-8 : sur la plateforme, les droits viennent des faits du contrat (`paiement-service`), « avec le même calcul (A-2) ». La partie A lit les créances et échéances de paiement-service directement.

**Pourquoi c'est incompatible.** Deux sources d'échéance pour le même client : la licence de la centrale (empreinte du dernier contact, sanctions) et l'échéance de paiement-service. Quand l'impayé suspend (décision PO de 280), paiement-service dit « suspendu » ; la centrale a déjà émis une licence valide 30 jours. La spine ne dit pas laquelle gagne. De plus, la centrale « supervise » la plateforme dans la même liste (AD-19) : rien n'interdit qu'elle lui projette une licence.

**Gravité : B** (droit ouvert alors que le client est suspendu, ou l'inverse).

**AD resserré (AD-19).** *Rule :* pour un client **hébergé sur la plateforme**, la **seule** source d'échéance est le contrat de `paiement-service` lu par la partie A de la plateforme, la centrale n'émet aucune licence pour une organisation hébergée (seulement l'inscription au parc et la supervision), et le jour où un hébergé passe sur site la licence qui le suit porte l'`echeanceLe` copiée du contrat avec la référence `origineContrat`, jamais recalculée.

---

## 6. L'agent et la partie A sur la promotion : migrations de A, module installé pendant une promotion

**Construction X (agent).** Le plan de promotion (AD-11) lance « migrer » en appelant l'étape de migration de chaque service des modules via le Compose du projet, dans l'ordre du manifeste. `platform-catalog-service` fait partie du socle (C10) : l'agent la traite comme tout service.

**Construction Y (partie A).** Elle a ses propres migrations de schéma (offres, dossiers, entitlements) qu'elle joue **au démarrage** (`migrate on boot`, comme la plupart des services Nest du dépôt). Pendant la promotion elle est donc migrée deux fois, ou migrée par le démarrage du nouveau conteneur **avant** que l'agent ait vérifié l'étape « télécharger et vérifier ».

Variante : un DSI installe un module dans le réel (dossier d'installation, FR-8) pendant que l'agent promeut. Le profil Compose du module et la liste des migrations du manifeste divergent : l'agent promeut vers un manifeste qui ne connaît pas le module installé à l'instant.

**Pourquoi c'est incompatible.** AD-11 ne dit pas **qui possède l'ordre des migrations de A**, ni que la partie A cesse d'écrire pendant la bascule. La partie A (seule propriétaire de l'installation) peut changer l'ensemble des modules pendant que l'agent (seul propriétaire de la promotion) fige cet ensemble dans le plan. Deux propriétaires de « l'ensemble des modules d'un espace ».

**Gravité : B** (module installé non migré, ou migration appliquée sans plan, donc sans retour arrière).

**AD resserré (AD-11).** *Rule :* toutes les migrations, y compris celles de la partie A, sont **déclarées dans le manifeste** et jouées **uniquement** par l'étape « migrer » du plan de l'agent (jamais au démarrage d'un service), et pendant un plan en cours l'agent pose sur l'espace un **verrou de composition** que la partie A respecte : elle refuse (`PROMOTION_EN_COURS`) toute installation, désinstallation ou mise en service de module jusqu'à la fin ou au retour arrière du plan.

---

## 7. L'agent qui se met à jour lui-même pendant une promotion de plateforme

**Construction X.** L'agent lance sa nouvelle image (AD-3) ; l'ancienne ne s'arrête qu'une fois la nouvelle saine. Le plan de promotion de l'ancien agent est en cours (étape 3 sur 5).

**Construction Y.** La nouvelle version de l'agent, qui sait opérer N et N-1, lit le plan en cours dans **l'état de l'agent** (plans de promotion, AD-2) mais le format du plan a changé entre les deux versions de l'agent. Ou : deux agents sains simultanément pendant la bascule tiennent chacun le socket Docker et lancent chacun l'étape 4.

**Pourquoi c'est incompatible.** AD-3 garantit la non-dépendance, pas l'**exclusion mutuelle** : « avant que l'ancienne s'arrête » ménage une fenêtre à deux agents, qui écrivent deux fois le journal chaîné (AD-12 « agent seul ») et font avancer deux fois l'horloge scellée.

**Gravité : M.**

**AD resserré (AD-3).** *Rule :* l'agent ne se met à jour que **hors plan** (aucune promotion ni retour arrière en cours), un verrou exclusif (bail avec renouvellement sur l'état de confiance) garantit qu'un seul agent écrit le journal, l'horloge et les plans à la fois, et la nouvelle version **sait lire tous les formats de plan et de journal écrits par la version précédente** (compatibilité BACKWARD, comme P9).

---

## 8. Deux services versent sur `instance.journal`, deux formes d'entrée

**Construction X (paiement-service ou partie A).** Verse `{ type: "installation", organisationId, acteur, date, ... }`.

**Construction Y (reprise-service).** Verse `{ kind: "RECEPTION", orgId, auteur, horodatage, ... }`. Schema registry compatible BACKWARD (P9) : les deux schémas existent sous deux sujets et passent chacun.

**Pourquoi c'est incompatible.** AD-12 donne la liste des faits à journaliser et le principe de chaînage, mais pas la **forme de l'entrée**. L'agent chaîne un hachage sur des octets que chaque service a choisis : le hachage dépend de la sérialisation, donc deux agents (ou une agent mis à jour) calculent des empreintes différentes. Aucun champ ne dit quelle donnée personnelle est dans l'entrée ; or le journal d'un prospect effacé est **pseudonymisé** (il faut donc savoir où est l'identité).

**Gravité : M** (journal non vérifiable ; pseudonymisation impossible).

**AD resserré (AD-12).** *Rule :* `instance.journal` a **un seul schéma enveloppe** `{ idempotence, source, type ∈ liste fermée, organisationId, espace, acteurRef, instantUtc, charge }` où les identités vivent **seulement** dans `acteurRef` (pseudonymisable) et `charge` est opaque, l'agent hache la forme canonique JCS (RFC 8785) de l'enveloppe qu'il a lui-même complétée (`rang`, `empreintePrecedente`), et rejette (`JOURNAL_FORME_INVALIDE`, tracé) toute entrée hors schéma.

---

## 9. Registre des consentements (agent) et apprentissage-service (copie) : retrait entre deux contacts

**Construction X (agent).** Le DG retire un consentement à 10:00. L'agent met à jour le registre et sa tête. Un export de niveau 1 préparé à 09:55 (avant) est **encore en file** d'envoi ; l'agent l'envoie à 10:05.

**Construction Y (apprentissage-service).** Elle vérifie la finalité sur la **dernière copie reçue** (AD-13), celle du contact de la veille, où le consentement est encore en vigueur : elle accepte.

**Pourquoi c'est incompatible.** AD-13 : « refuse toute donnée … qui ne porte pas une finalité couverte par la dernière copie reçue ». Il n'impose pas que l'envoi **porte** la tête du registre au moment de la préparation ni que l'agent **purge** sa file au retrait. Le retrait est valide sur l'instance et ignoré chez Money Vibes jusqu'au contact suivant. Variante : une restauration ramène un registre plus ancien (le volume de confiance est exclu des sauvegardes, mais la **copie** chez apprentissage-service, plus récente, devient contradictoire avec l'état local ; qui gagne ?).

**Gravité : B** (donnée envoyée sans consentement en vigueur ; obligation légale, loi 2019-014).

**AD resserré (AD-13).** *Rule :* chaque échantillon envoyé à `apprentissage-service` porte `teteRegistre` et la copie signée **complète** du registre au moment de l'envoi, l'agent **vide sa file d'export** pour une finalité retirée avant d'écrire le retrait dans le registre, et `apprentissage-service` **retire** (suppression ou mise en quarantaine, journalisée) toute donnée reçue pour une finalité dont une copie ultérieure porte le retrait, la copie la plus récente par `rangRegistre` faisant foi même si l'état de confiance local est plus ancien.

---

## 10. Rafraîchissement (réel vers essai) et essai prospect

**Construction X (agent, rafraîchissement FR-10).** Copie le réel masqué vers l'essai du client, par un plan, avec l'identité de service du moteur, en écrasant l'essai.

**Construction Y (partie A de l'essai).** L'essai d'un **prospect** est sur la plateforme : un prospect n'a pas de « réel ». Mais un client existant de la plateforme peut aussi avoir un essai de prospect (un second dossier), ou une organisation dont l'essai prospect n'a pas encore été effacé reçoit un rafraîchissement ordonné par la console.

**Pourquoi c'est incompatible.** AD-15 définit le rafraîchissement comme « du réel vers l'essai » sans dire le comportement quand la cible porte un état d'essai de prospect (échéance d'effacement en cours, tâches BullMQ, données saisies par le prospect). Le rafraîchissement écrase l'essai ; les tâches d'effacement (clef idempotente à date fixe) tombent ensuite sur des données du client. En outre l'agent écrase par import (C13) alors que la partie A, propriétaire d'`EN_INSTALLATION`, l'exécute « y compris pendant EN_INSTALLATION » : deux chemins de mutation de l'essai.

**Gravité : M** (effacement d'un essai client rafraîchi).

**AD resserré (AD-15).** *Rule :* un rafraîchissement n'est accepté que vers un espace d'essai de nature `ESSAI_CLIENT` (jamais `ESSAI_PROSPECT`), il annule les tâches d'échéance de l'essai cible avant d'écrire et les recrée après (AD-6), et l'écriture dans l'essai passe **uniquement** par les contrats d'import des propriétaires (C13) sous l'identité de service du moteur, l'agent n'écrivant jamais lui-même dans la base d'un service.

---

## 11. Le niveau `LOGICIEL` (gel à 7 jours) contre l'horloge de A-1 (gel à 30 jours)

**Construction X (agent).** Lit AD-4 : au niveau `LOGICIEL`, le gel tombe à 7 jours de silence. Calcule sur l'horloge scellée.

**Construction Y (partie A, publie le gel, A-1).** Le tableau d'A-1 donne **30 jours** pour le délai de silence ; partie A et supervision de la centrale codent 30 jours.

**Pourquoi c'est incompatible.** Le niveau est une propriété de l'agent (état de confiance), pas un fait que la partie A voit. L'alerte de J+7 de la centrale (AD-9, « dernier contact vu par la centrale ») est **la même durée** que le gel `LOGICIEL` : l'instance gèle au moment même où l'alerte part, sans que personne ait pu prévenir. Et la bascule `TPM` → `LOGICIEL` (TPM en panne) change le seuil en cours de silence : un silence de 10 jours, hier sain, devient un gel immédiat.

**Gravité : M.**

**AD resserré (AD-4).** *Rule :* le **seuil de gel est une valeur de l'état voulu** (`gelApresJours`, 30 ou 7 selon le niveau) calculée et signée par la centrale, l'agent émet le **fait de gel** (`instance.gel.declare`) que la partie A publie sans calculer elle-même, l'alerte de la centrale tombe à **la moitié** du seuil, et un changement de niveau en cours de silence **ne raccourcit jamais** un silence déjà écoulé (le nouveau seuil s'applique au prochain contact réussi).

---

## 12. La sauvegarde (AD-16) et le retour arrière `AVEC_PERTE` : quelle sauvegarde, quel état de confiance

**Construction X (agent, retour arrière).** Pour une version `AVEC_PERTE` (FR-18), le DSI décide la restauration. L'agent restaure la sauvegarde **la plus récente d'avant la promotion**.

**Construction Y (agent, sauvegarde).** AD-16 exclut le volume de l'état de confiance de tout jeu de sauvegarde. Après restauration, les bases reviennent à l'instant T-promotion : consentements retirés depuis, journaux des services, entitlements... Mais l'état de confiance (licence acceptée, tête du journal, tête du registre) est à l'instant présent.

**Pourquoi c'est incompatible.** Après une restauration, la **tête du journal** et la **tête du registre** de l'état de confiance ne correspondent plus aux bases restaurées (le registre des consentements est possédé par l'agent : il est dans l'état de confiance, donc non restauré, bien) mais les **faits des services** (entitlements, état publié, journal des services en outbox) reculent. Le test « restaurer une sauvegarde de six mois » existe, mais la spine ne dit ni (a) quelle sauvegarde on choisit (la dernière avant la promotion, qui a jusqu'à 1 h de perte tolérée, contre la dernière saine), ni (b) que les ID d'événements (outbox, `eventId` de `etat-publie.changed`) ne sont **pas réutilisés** après la restauration : les consommateurs dédupliquent par `eventId` et ignorent les nouveaux événements qui portent les anciens numéros.

**Gravité : B** (états publiés ignorés, journal non cohérent).

**AD resserré (AD-16).** *Rule :* une restauration (retour `AVEC_PERTE` ou test mensuel) rejoue sur l'état de confiance courant sans le toucher, **ajoute au journal un fait `restauration{sauvegardeId, instantRestaure}`**, redémarre toutes les parties A avec un `epoque` incrémenté qui entre dans tout `eventId` d'outbox et dans la clef d'idempotence des tâches d'échéance, et l'agent choisit la sauvegarde la plus récente **antérieure à l'étape « migrer »** du plan inscrit, jamais une autre sans décision écrite du DSI.

---

## 13. `GET /heure` : réponse de l'agent quand l'horloge est refusée ou l'agent en remplacement

**Construction X.** Pendant une anomalie (écart de plus de 48 h, AD-5), l'agent continue à répondre `GET /heure` avec l'horloge scellée, bloquée.

**Construction Y.** La partie A, sans réponse (agent redémarre, AD-3), retombe sur l'horloge système « pour ne pas bloquer ».

**Pourquoi c'est incompatible.** AD-6 interdit `Date.now()` pour une échéance mais ne dit pas ce que fait A **quand `GET /heure` est indisponible ou non fiable**. Une équipe suspend les transitions ; l'autre prend l'horloge système, ce qui rouvre exactement l'attaque « avancer la date du serveur ».

**Gravité : M.**

**AD resserré (AD-6).** *Rule :* lorsque `GET /heure` est injoignable, périmé (plus de 5 minutes sans lecture) ou rend une horloge en anomalie, la partie A **ne fait tomber aucune échéance** et n'en reporte aucune (elle conserve l'état publié courant et ouvre l'alerte `HORLOGE_INDISPONIBLE`), et elle n'utilise jamais l'horloge système pour une échéance sur site.

---

## 14. Deux agents, une licence, un jumeau de sauvegarde

**Construction X.** Une restauration complète de VM (niveau `LOGICIEL`) ramène l'agent et son état de confiance au support de sauvegarde : l'agent restauré envoie à la centrale une empreinte plus ancienne (AD-4 : refus + ticket).

**Construction Y.** Le client lève une seconde VM depuis le même instantané : deux agents avec le **même certificat mTLS** (AD-9 : certificat émis au montage, « renouvelé par contact »), les deux contactent la centrale. Le renouvellement par contact invalide le certificat de l'un, l'autre retombe en silence puis en gel, sans que la centrale sache qu'il y a un jumeau.

**Pourquoi c'est incompatible.** AD-4 détecte un recul d'empreinte, pas une **bifurcation** (deux empreintes différentes, toutes deux postérieures à la dernière connue). La centrale accepte les deux branches alternativement.

**Gravité : M** (licence utilisée sur deux serveurs).

**AD resserré (AD-4).** *Rule :* l'empreinte de l'état de confiance est une **chaîne** (chaque empreinte contient la précédente et un compteur) que la centrale vérifie comme une suite, et tout contact dont l'empreinte n'est ni la suivante ni la même que la dernière connue est traité comme une **bifurcation** : la centrale ne renouvelle pas le certificat, refuse licence et exports, et ouvre un ticket.

---

## 15. Topics `instance.*` partitionnés par `instanceId`

**Construction X.** Un service de module verse `instance.journal` avec la clef de partition `instanceId`. Seule une instance existe sur un Kafka d'instance : toutes les entrées d'une instance vont dans **une seule partition**.

**Construction Y.** Un autre service verse la même entrée avec `organisationId` (convention générale de la ligne « Événements »).

**Pourquoi c'est incompatible.** Les conventions disent « partition `organisationId` (`instanceId` pour `instance.*`) » : un seul `instanceId` par Kafka d'instance, donc l'ordre total sur une partition qui sature (journal de toutes les organisations). Et l'ordre entre `instance.journal` et `etat-publie.changed` n'est garanti nulle part.

**Gravité : m.**

**Convention resserrée.** *Rule :* les topics `instance.*` utilisent comme clef de partition `organisationId` (jamais `instanceId`, redondant dans une instance), et l'agent attribue le rang de chaîne à la réception sans présumer d'ordre entre topics.

---

## 16. Une sanction « portée par la licence suivante » qui n'arrive pas

**Construction X (centrale).** Décide une sanction (FR-41) : elle l'inscrit dans l'état voulu et attend la prochaine **émission** de licence (mensuelle).

**Construction Y (agent).** N'applique aucune sanction hors licence reçue, conformément à AD-8, et ne tire que si le contact quotidien annonce une licence à numéro supérieur.

**Pourquoi c'est incompatible.** Aucun AD ne force la centrale à **émettre immédiatement** une licence quand une sanction est décidée, ni ne fixe le délai maximal entre la décision et l'application. L'agent peut appliquer une sanction un mois plus tard, ou jamais si le contact ne dit pas qu'une licence est nouvelle.

**Gravité : M.**

**AD resserré (AD-8).** *Rule :* toute sanction ou levée de sanction décidée dans la centrale **émet dans la minute une nouvelle licence** (numéro croissant) dont la réponse au prochain contact est obligatoire, et l'agent qui reçoit une licence de numéro supérieur au sien l'applique avant tout autre élément de l'état voulu.

---

## Écarts transversaux à noter

- **Aucun AD ne désigne le propriétaire de la configuration de Traefik par espace** (routes des modules installés) : l'agent la génère (AD-10) mais la partie A décide des modules installés. Voir paire 6, même verrou de composition.
- **AD-2 dit « chaque unité a sa base »** mais la partie A existe deux fois par instance : préciser « une base par espace », sans quoi deux équipes partagent un seul Mongo avec deux jeux de collections.
- **Les gardes de module (NFR) lisent `entitlement.changed` v2 et `etat-publie.changed`** : si les deux arrivent dans un ordre inverse, la garde peut ouvrir un module pour un état publié périmé. Ajouter une règle : la garde applique `etat-publie` seul comme vérité absolue, `entitlement.changed` ne sert qu'à l'invalidation du cache.
- **Absence de contrat d'erreur partagé pour l'état voulu refusé** : la centrale doit savoir pourquoi (sans révéler la vérification, convention « Erreurs ») ; prévoir un code générique `ETAT_VOULU_REFUSE` et le détail au journal.
