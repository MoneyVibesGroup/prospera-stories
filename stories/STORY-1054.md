# STORY-1054 : prévenir l'assuré (2) — l'accusé de transmission rendu au dossier, le repli dans la cloche de l'assuré, les consentements par finalité

Status: in-progress

**Épic :** EPIC-220 (prévenir : notification, relais Money Vibes et portail des cabinets) · **Dépôt :**
`prospera-notification-service` (tenu par D, port 3008) · **Plage :** groupe D, n° 10 du lot 3
(`PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §4). **Dépend de :** STORY-1051 (faite : `dev` 7d4b24d, cdbcd8a, b3d4388).
**Suivante :** STORY-1055 (l'import réseau par la Reprise, `reseau-service`, `kit-cible` 1.0.1).

**Sources :** PRD assurance FR-18 (« le courrier et le SMS ont un suivi de distribution : `notification` rend cet état
lisible par le dossier » ; « un assuré qui refuse un canal ne reçoit plus de message sur ce canal » ; aucune
prospection), FR-19 (consentement **par finalité**, tracé **par dossier** ; « un test retire un consentement et vérifie
l'arrêt de l'usage »), FR-36 (accusé de déclaration immédiat et automatique), FR-48 (accusé de réception du dossier),
FR-146 (« le module `notification` renvoie l'accusé de transmission ; Prospera l'inscrit au journal du dossier » ;
`CANAL_ABSENT` ⇒ « à contacter autrement » ; numéro officiel à l'assuré « (information) »), FR-226 (in-app, repli,
« journal et accusés (le « lu » n'existe pas pour un SMS) » ; WhatsApp approuvé avant la mise en service), FR-227 ;
EPIC-220 « fini quand : un message de la démo part, **est accusé et se retrouve dans la cloche en repli** » ; PRD
`notification` FR-N19 (l'in-app ne sert que l'utilisateur authentifié), FR-N21 (repli sur échec technique du canal,
jamais sur l'absence de lecture), FR-N36 (statuts normalisés), FR-N46 (consentement par personne, canal et nature, jamais
déduit) ; spine assurance AD-23 (aucun message ne transporte de contenu médical), AD-18 (le temps se lit par un port
d'horloge) ; STORY-1051 (D-1051-1 → 11) ; journal de C, STORY-1007 (courrier `ACCUSE_RECEPTION` en brouillon).

## Pourquoi

1051 fait partir les messages de l'assuré, mais personne ne sait ce qu'ils deviennent : le dossier ne voit pas
l'accusé de transmission, un message qui ne peut pas partir (pas de destinataire, canal refusé, passerelle en échec) se
perd dans un journal technique, et rien ne distingue un message dû à l'assuré d'un message d'information qu'il peut
refuser. Cette story rend le sort de chaque message lisible par le dossier, donne à l'assuré une cloche où tombe tout
message qui n'a pas pu partir, et pose les consentements par finalité, en échec fermé.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve |
|:--:|---|---|
| AC-1 | **L'accusé est lisible par le dossier** : pour chaque message de l'assuré, la voie (externe ou cloche), le canal, l'état de distribution (`EN_COURS`, `TRANSMIS`, `REMIS`, `LU`, `NON_REMIS`, `EN_CLOCHE`) et ses dates, par `GET …/service/assurance/dossiers/{id}/messages` (`sinistres-service` seul) ; l'adresse n'est jamais rendue | unitaires ; e2e ; pile `grp-d` |
| AC-2 | **Repli dans la cloche** : un message tombe dans la cloche de l'assuré quand sa finalité facultative n'est pas consentie, quand aucun destinataire n'est enregistré (`CANAL_ABSENT`), quand le canal est refusé à la demande, ou quand l'envoi externe échoue sans maillon de repli restant (à la remise ou par l'accusé de la passerelle) | unitaires ; intégration ; pile |
| AC-3 | **Le texte de la cloche passe le contrôle des interdits de 1051** (même fonction) : un test parcourt tous les textes déposables (neuf clés, `fr` et `en`) ; un texte interdit n'est ni envoyé ni déposé ; mutations | unitaires ; mutation |
| AC-4 | **Idempotent** : rejouer un fait, une relance, un échec ou un accusé ne crée ni message, ni dépôt, ni envoi de plus | unitaires ; intégration ; pile (rejeu) |
| AC-5 | **Consentements par finalité, tracés par dossier** : deux finalités (`SUIVI_DU_SINISTRE` obligatoire, `INFORMATION_DU_DOSSIER` facultative) ; chaque acte garde qui l'a recueilli, quand, la version du texte, l'appelant ; en ajout seul ; l'état est la dernière décision | unitaires ; e2e |
| AC-6 | **Échec fermé** : sans `ACCORDE` sur une finalité facultative (inconnu ou retiré), aucun envoi externe ; un retrait est opposable au message suivant (fait ou relance) ; une finalité obligatoire n'accepte pas de décision (`FINALITE_OBLIGATOIRE`) | unitaires ; intégration ; pile |
| AC-7 | **Rien d'autre ne casse** : les gardes du dépôt (porte de service inventoriée, suppression complète, consommateurs supervisés, aucune minuterie) restent vertes ; `/health` 200 ; les quatre suites e2e rouges héritées restent les mêmes | Node 24 ; pile |

## Décisions retenues par défaut (contestables)

- **D-1054-1 — L'accusé de réception de cette story est l'accusé de transmission rendu au dossier.** Les accusés que
  l'assuré **reçoit** existent depuis 1051 : l'accusé de déclaration (FR-36, `assurance-declaration-enregistree`, au
  fait `DECLARE`) et l'accusé de réception du dossier (FR-48, `assurance-dossier-ouvert`, au fait `OUVERT`). Ce qui
  manquait est l'autre sens, celui de FR-146 (« `notification` renvoie l'accusé de transmission ; Prospera l'inscrit au
  journal du dossier ») et d'EPIC-220 (« un message part, est accusé ») : le sort de chaque message, lisible par le
  dossier. États : `EN_COURS` (préparé), `TRANSMIS` (accepté par la passerelle), `REMIS` (accusé de délivrance), `LU`
  (accusé de lecture, quand le canal en a un), `NON_REMIS` (échoué ou écarté, chaîne épuisée), `EN_CLOCHE` (aucune voie
  externe). Le courrier papier `ACCUSE_RECEPTION` que `sinistres` prépare en brouillon (C, STORY-1007) n'est pas un
  canal de `notification` : son envoi avec preuve reste hors de cette story.
- **D-1054-2 — L'accusé se lit par une route de service, sans topic neuf.** `GET
  /api/v1/service/assurance/dossiers/{dossierId}/messages?organisationId=` (`sinistres-service` seul) rend l'état de
  distribution, calculé à la lecture depuis les `Envoi` de la clé du message (origine, maillons de repli, rejeux). Le
  fait générique `notification.envoi.delivre@1` ne porte pas le dossier ; un fait propre à l'assurance s'ajoutera si
  C le demande (→ C).
- **D-1054-3 — Un journal des messages de l'assuré** (`assurance_messages`) : un document par `(organisation,
  dossier, événement)`, écrit **avant** toute tentative (premier écrivain gagnant) : clé du modèle, finalité,
  référence, langue, variables permises (`reference`, `numeroOfficiel`), clé d'idempotence de l'`Envoi`, date de la
  demande (horloge de référence), puis la voie prise. **Jamais l'adresse.** Un message déjà traité n'est pas retraité
  au rejeu.
- **D-1054-4 — La cloche de l'assuré est la boîte de son dossier, tenue par `notification`.** L'assuré n'a pas de
  compte Prospera : la cloche in-app de FR-N19 (utilisateur authentifié) ne peut pas le servir. Un message y tombe
  avec un motif nommé : `CONSENTEMENT_ABSENT`, `CONSENTEMENT_RETIRE`, `CANAL_ABSENT`, `CANAL_REFUSE` (refus métier de
  l'envoi : désabonné, adresse supprimée, canal ou modèle indisponible ; le code est gardé), `ECHEC_DU_CANAL` (chaîne
  épuisée). Le texte déposé est le **rendu SMS** du modèle (court, sans mise en page), dans la langue de l'assuré, et il
  passe le contrôle des interdits de 1051 sur l'objet et le corps rendus. Un dépôt par message (le premier gagne). La
  cloche se lit par la même route que l'accusé : `sinistres` la montre au guichet (FR-146 : « à contacter
  autrement ») ; l'application de l'assuré la lira quand elle existera.
- **D-1054-5 — La fin de chaîne est signalée par l'`Envoi`, sans qu'il connaisse l'assurance.** Un registre
  d'observateurs (`FinsDeChaine`, module `envois`) est prévenu quand un envoi échoue et qu'aucun maillon de repli ne
  reste — à la remise (exécutant BullMQ, après l'échec écrit) et à l'accusé « échoué » d'une passerelle. Le module de
  l'assurance s'y inscrit et ne retient que ses envois (module appelant `sinistres`, clé `assurance:`). Une erreur d'un
  observateur se journalise et ne touche ni la remise ni l'accusé.
- **D-1054-6 — Deux finalités de messages, et une seule facultative.** `SUIVI_DU_SINISTRE` (**obligatoire**) : la
  déclaration enregistrée, les pièces attendues et leurs relances, l'ouverture, l'offre, le chèque, le règlement, la
  clôture ; `INFORMATION_DU_DOSSIER` (**facultative**) : le numéro de sinistre officiel (FR-146 : « assuré
  (information) »). Les autres finalités de FR-19 (traitement du sinistre, données de santé, envoi à l'IA commune) ne
  sont pas des messages : elles appartiennent à `sinistres` et à l'IA, pas à `notification`.
- **D-1054-7 — Échec fermé, et ce qui part sans consentement.** Une finalité facultative sans `ACCORDE` (inconnue ou
  retirée) ne part **jamais** par un canal externe : le message tombe dans la cloche. Une finalité obligatoire part sans
  consentement de finalité : sa base est l'exécution du contrat et l'obligation légale (FR-36 : accusé immédiat et
  automatique ; FR-48 ; FR-18 : l'assuré est prévenu à chaque étape ; la loi n° 2019-014, art. 26, vise la prospection,
  et Prospera n'en envoie aucune). **Le refus d'un canal** (registre de FR-N46, `DESTINATAIRE_DESABONNE`) continue de
  fermer ce canal, pour toutes les finalités : le message tombe dans la cloche (`CANAL_REFUSE`). Une décision posée sur
  une finalité obligatoire est refusée `FINALITE_OBLIGATOIRE` : refuser le suivi, c'est refuser le canal.
- **D-1054-8 — Traçabilité et retrait.** `POST /api/v1/service/assurance/dossiers/{dossierId}/consentements`
  (`sinistres-service` seul) ajoute un acte à `assurance_consentements`, **en ajout seul** : finalité, décision
  (`ACCORDE` ou `RETIRE`), version du texte présenté (exigée pour `ACCORDE`), date de la décision (`recueilliLe`, qui
  peut précéder l'écriture, jamais la suivre), qui l'a recueilli (`recueilliPar`, identifiant opaque de l'agent ou
  `assure`, jamais un nom), l'appelant et la date d'écriture (horloge de référence). Le même acte rejoué n'ajoute rien.
  L'état est la **dernière décision** (par date de décision, puis d'écriture). Le retrait est opposable au **message
  suivant** : la finalité est lue à chaque message (fait ou relance), jamais figée à l'enregistrement. `GET …/consentements`
  rend l'état et l'historique de chaque finalité.
- **D-1054-9 — Une relance déposée dans la cloche compte comme donnée.** L'intervalle de 5 jours tient entre deux
  relances, parties ou déposées ; la chaîne ne s'arrête plus faute de destinataire (D-1051-8 amendé : le message tombe
  dans la cloche, `CANAL_ABSENT`) ; elle s'arrête sur un contenu interdit ou quand le dossier quitte l'attente de pièces.
- **D-1054-10 — Toujours une seule porte de service pour l'assurance.** Les routes neuves (consentements, messages)
  rejoignent le contrôleur du destinataire (D-1051-9) : même jeton de service, même appelant unique, inventaire
  inchangé en nombre, motif mis à jour.
- **D-1054-11 — Les deux collections neuves partent avec l'organisation** (`assurance_messages`,
  `assurance_consentements` dans `COLLECTIONS_A_SUPPRIMER`). Aucun consommateur neuf (le relevé des consommateurs
  supervisés ne change pas), aucun topic, aucune variable d'environnement.
- **D-1054-12 — WhatsApp attend toujours.** Aucun modèle WhatsApp n'est approuvé (FR-226 : délai externe) ; le canal
  reste refusé à l'assuré (`CANAL_NON_SERVI_A_L_ASSURE`) ; le repli « WhatsApp, sinon SMS » viendra avec ses modèles.

## Ce qui n'est pas fait ici

WhatsApp et ses modèles approuvés ; le courrier avec preuve (`ACCUSE_RECEPTION` papier de `sinistres`) ; un fait
d'accusé propre à l'assurance sur le bus ; l'état « lu » d'un dépôt de cloche (l'application de l'assuré n'existe pas) ;
les messages au courtier, aux coassureurs et au personnel ; les réponses entrantes ; l'appel des routes par `sinistres`
(C).

## Avancement

- 2026-11-17 : rituel fait (plan, règles, journaux A, B, C, D, EPIC-220, PRD, fiche 1051, code de `notification` sur
  `origin/dev` b3d4388) ; fiche écrite ; annonce « ⚠ Contrats » avant le code.
- 2026-11-17 : annonce fusionnée (prospera-stories #647, `main` 296699e). Code poussé sur `MNV-1054` (967f412) ; Node 24 :
  tsc, build, lint verts, unitaires 287/287 suites. Verrou Docker pris à 12:38 (libre). En cours : e2e, mutations, pile.
