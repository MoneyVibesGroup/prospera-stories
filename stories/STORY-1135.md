# STORY-1135 : Mettre à jour sans peur — premier incrément : essayer, promouvoir, revenir

Status: in_progress — fiche écrite le 2026-11-27 par une sous-session du groupe B juste avant de coder (lot 7, n° 17 de B,
`coordination/PLAN-LOT-7-GROUPE-B-2026-11-25.md` §1, deuxième partie, ligne 17 ; identifiant réservé D-L7B-1).
**Date du plan : 22/01** (« la mise en service de février, S13, 19/02 »).

**Épic :** EPIC-151 (mettre à jour sans peur : essayer, promouvoir, revenir) · voisins EPIC-148, 149, 150, 152, 153 ·
FR-17, FR-18, FR-22, FR-40 · NFR-9 · AD-3, AD-7, AD-10, AD-11, AD-22, AD-33, AD-36
**Dépôts :** `prospera-plateforme` (part « moteur » de B : `contrats/agent/`, `paquets/signature/`, étiquette neuve
`contrats-agent-v1.2`), `centrale-service`, `agent-instance` · **lus, inchangés** : le catalogue (contrat d'état publié
1.1.0, gel de 1128), paiement, auth
**Points :** 8 · **Dépend de :** STORY-955 (agent, état voulu), STORY-1133 (`contrats-agent-v1`, relais, vecteurs v2),
STORY-1134 (`contrats-agent-v1.1`, `etats-de-confiance.json` : en gel, la mise à jour est fermée) · **Suite :** EPIC-152
(correctifs de sécurité, fin de maintenance), la suite d'EPIC-151 (ci-dessous, « Nommé pour plus tard »)
**Sources :** plan du lot 7 de B §1 (n° 17) ; `epics-moteur-installation-2026-11-11.md` (EPIC-151) ;
`PLAN-FEVRIER-2027-TOUT-CHARGE-2026-11-14.md` (EPIC-151 : S8 → S9, ★) ; PRD du moteur FR-17, FR-18, FR-22, FR-24, FR-40,
NFR-9, addendum §A-8 ; spine du moteur AD-3, AD-7, AD-10, AD-11, AD-22 (et son amendement : `fenetreDSI`), AD-33, AD-36,
AD-37, AD-39 ; fiches STORY-1128 (D-1128-10, inventaire), 1131 (D-1131-4), 1133 (D-1133-11), 1134 (D-1134-1 → 14). Code relu
sur `origin/dev` : agent `7d7c087` (`src/executeur/*`, `src/contact/contact.ts`, `Dockerfile`, `docker-compose.yml`,
`vendor/`), centrale `205e71b` (`src/emetteur.ts`, `src/http.ts`, `src/registre.ts`, `src/main.ts`, `semis/`), plateforme
`ed51833` (`scripts/contrats-agent.ts`, `paquets/signature/src/index.ts`, `contrats/etat-voulu.schema.json`), catalogue
`480c445` (`src/module.manifest.ts` : `migrer`, `interrupteurs: []` ; `lecture-etat-publie.service.ts` : « pas encore tenu »).

---

## Pourquoi

La mise en service de février (S13, 19/02) monte des instances sur site qui devront recevoir des versions sans visite et
sans peur : une version cassée ne doit jamais rester en service, une instance coupée de Money Vibes ne doit rien changer
(STORY-1134 : en gel, la mise à jour est fermée), et le DSI doit garder la main sur la date (FR-17). Aujourd'hui l'agent
**reçoit** `versionCible` dans l'état voulu signé, et n'en fait rien.

## Ce qui existait déjà (relu avant la fiche)

| Déjà là | Où |
|---|---|
| `versionCible { version, niveauCorrectif }`, `interrupteurs`, `annonceMiseAJour`, `fenetreDSI { debut, fin }` (facultatif) dans `etat-voulu@1` ; la centrale émet `versionCible` et `interrupteurs` depuis le contrat de l'instance | plateforme `contrats/etat-voulu.schema.json` ; centrale `emetteur.ts` |
| La matrice ouvert / fermé : `INSTALLER`, `METTRE_A_JOUR` fermés en `GEL` et en `RECUL_LOCAL` ; `autorise(e, operation)` | `etats-de-confiance.json` (1134) ; agent `confiance.ts` |
| La famille de clés `ci` (usage), un certificat de test `ci-test-2026-2036` ; « les artefacts de la famille `ci` (manifeste de version, images) entrent avec la CI de publication » | `@prospera/signature` ; `vecteurs-v2` |
| Le dépôt de l'échange (contact ou DSI), trié par nature ; le contact dépose tel quel ce que la centrale rend (`certificats`) | agent `depot.ts`, `contact.ts` |
| `migrer: 'POST /api/v1/instance/instance/migrer'` au manifeste C1 du module `instance`, non servi ; `module.interrupteurs: []` « pas encore tenu (EPIC-151) » dans l'état publié | catalogue |

**Ce qui manque** : aucun manifeste de version signé, aucune version connue de l'agent, aucun plan de promotion, aucune
exécution (l'agent ne lance encore aucun `docker compose` : AD-10 arrive avec le montage), aucun retour arrière, rien qui
dise à la centrale quelle version tourne.

## Contrat annoncé avant le code (2026-11-27)

`prospera-plateforme`, étiquette neuve **`contrats-agent-v1.2`** (ajouts facultatifs seulement, une source
`scripts/contrats-agent.ts`). Lu par **B** seul (centrale, agent) ; **→ C, D** : information, aucun contrat que vous lisez
ne change ; **→ A** : information, aucun écran débloqué (« voir les mises à jour, essayer, choisir la date, revenir » de la
coque `instance` attend les commandes d'AD-37 ; la console attend des routes authentifiées).

1. **`manifeste-version@1`** (neuf, `contrats/agent/manifeste-version.schema.json`) : la charge du JWS
   `prospera-manifeste-version+jws`, **signé par une clé d'usage `ci`** (AD-7) et **diffusé** (il vaut pour toutes les
   instances de son environnement : ni `instanceId` ni `audience`, comme les artefacts de la racine) : `kid`, `iat`,
   `numero`, `version` (x.y.z), `niveauCorrectif`, `retourArriere` (`SANS_PERTE` | `AVEC_PERTE`), `finMaintenance`,
   `services[]` (`nom`, `image`, `empreinte` `sha256:…`, `migrer` booléen), `interrupteurs[]` (`code`). Modèle fermé.
2. **`@prospera/signature`** : `prospera-manifeste-version+jws` → signataire `ci` ; un type **diffusé** n'est jugé ni sur
   l'instance ni sur l'audience. Rien d'autre ne change (les autres types gardent leurs règles).
3. **`contact-requete@1`** gagne **`miseAJour`** (facultatif, fermé) : `enService` (`{ version, niveauCorrectif }` ou
   `null`) et `plan` (`{ version, niveauCorrectif, nature, etape, statut }` ou `null`). Un agent ≤ 0.3.0 ne l'envoie pas.
4. **`contact-reponse@1`** gagne **`manifestes`** (facultatif, ≤ 4 JWS) : le manifeste signé de la `versionCible`, rendu
   seulement à un contact qui porte `miseAJour` et dont la version en service n'est pas la cible ; sinon réponse à
   l'octet de 1134. Le contact le dépose tel quel.
5. **`contact.openapi.json` 1.2.0** (les deux corps ci-dessus) ; **`agent-executeur.openapi.json` 1.2.0** : **`GET
   /promotion`** (la version en service dans l'essai et dans le réel, la précédente et la fin de sa fenêtre de retour, le
   plan en cours ou le dernier avec ses étapes horodatées, le verrou `PROMOTION_EN_COURS`, l'attente ou le blocage nommé,
   les versions reçues).
6. **Centrale** (routes d'**opérateur de simulation**, servies seulement avec `CENTRALE_CONTACT=simulation`, `503
   OPERATEUR_NON_LIVRE` sinon ; elles tiennent la place de la console tant qu'elle n'a pas de route authentifiée) :
   `POST /api/centrale/v1/versions` (publier un manifeste signé, vérifié par la chaîne), `PUT
   /api/centrale/v1/instances/{instanceId}/version-cible` (la cible et la fenêtre choisie par le DSI),
   `GET /api/centrale/v1/instances/{instanceId}/mise-a-jour` (la cible et le dernier rapport de l'agent). L'état voulu porte
   `fenetreDSI` quand elle est choisie (champ déjà au contrat).
7. **Agent** `agent-0.4.0` : le dépôt accepte les manifestes de version ; `AGENT_EXECUTANT=compose` (absent : l'agent ne
   planifie rien, `/promotion` dit `executant: ABSENT`) ; `AGENT_PROJET` (préfixe des deux projets Compose, `<projet>-essai`
   et `<projet>-reel`).
8. **Inchangés** : le contrat d'état publié (1.1.0), `etat-voulu@1`, `licence@1`, `etats-de-confiance.json`, les vecteurs
   (`vecteurs-v2`), le catalogue, paiement, auth.

## Ce qui doit être vrai à la fin

| # | Exigence | Preuve |
|:--:|---|---|
| AC-1 | **Une version est un manifeste signé par la CI** : l'agent l'apprend par le contact ou par un fichier déposé, le vérifie hors ligne (racine → certificat `ci` → manifeste, à l'heure scellée, contrat) ; signé par une clé `centrale`, altéré, d'un autre environnement : refusé, journalisé | unitaires ; mutations |
| AC-2 | **Essayer** : une `versionCible` plus récente que la version en service, dont le manifeste est connu, ouvre un **plan enregistré** (étapes horodatées sur l'horloge scellée, verrou `PROMOTION_EN_COURS`) : vérifier les images (empreintes du manifeste), poser la candidate dans l'**essai**, à côté du réel qui sert toujours, migrer (point d'entrée `migrer` en conteneur dédié, AD-33), vérifier la santé | unitaires ; pile |
| AC-3 | **Promouvoir seulement si tout est vert, à la date du DSI** : le réel ne change que dans `fenetreDSI` (sur l'horloge scellée) ; sans date, le plan attend (`DATE_NON_CHOISIE`) ; fenêtre passée : reportée, jamais rattrapée (`FENETRE_PASSEE`) ; pas deux promotions en 7 jours, sauf un correctif (`PROMOTION_TROP_PROCHE`) ; migrer le réel pendant que l'ancienne version sert, basculer, vérifier la santé ; tous les interrupteurs à leur position finale | unitaires ; pile |
| AC-4 | **Revenir de lui-même** : une santé ou une migration en échec dans l'essai relance l'essai à la version en service (le réel n'a jamais bougé) ; en échec dans le réel, le réel est relancé aux empreintes de la version précédente, sans restauration ; une version `AVEC_PERTE` en échec dans le réel **s'arrête et alerte** (`ARRETEE`), sans revenir ; une version en échec n'est pas réessayée | unitaires ; pile |
| AC-5 | **Rien n'avance en gel ni en recul local** : avant chaque étape en avant, la matrice de 1134 est lue (`METTRE_A_JOUR`, ou `INSTALLER` pour la première mise en place) ; fermée ⇒ le plan ne part pas, ou reste à son étape, `MISE_A_JOUR_FERMEE` nommé avec l'état, journalisé une fois ; le retour arrière n'est jamais bloqué | unitaires ; pile |
| AC-6 | **Une cible plus ancienne n'est jamais appliquée seule** (AD-22) : `RETOUR_PROPOSE` au journal et dans `/promotion`, rien ne bouge | unitaires |
| AC-7 | **Repris à son étape** : un exécuteur redémarré reprend le plan à l'étape en cours (chaque étape est idempotente) | unitaires |
| AC-8 | **La centrale propose et suit** : un manifeste publié se vérifie par la chaîne ; la cible ne peut être qu'une version publiée ; l'état voulu porte `versionCible` et `fenetreDSI` ; le contact qui porte `miseAJour` reçoit le manifeste de sa cible et son rapport est gardé ; un contact sans `miseAJour` rend la réponse de 1134 à l'octet (jeu croisé r1 → r3 inchangé) | unitaires HTTP ; jeu croisé |
| AC-9 | Contrat `contrats-agent-v1.2` publié et généré ; centrale et agent copiés à l'étiquette, cas rejoués des deux côtés | plateforme `npm test` ; `vendor.test.ts` |
| AC-10 | Node 24 (`--target verification`) des deux services ; **pile `grp-b`** (centrale, exécuteur avec `docker compose`, contact, un module témoin en trois versions) : **essayer, échouer et revenir** ; **essayer, réussir et promouvoir** ; **refus en gel** | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1135-1 — Ce que veut dire « essayer, promouvoir, revenir » dans cet incrément.** (a) **Une version** = un manifeste
  signé par une clé de CI (AD-7), publié à la centrale ; (b) **la centrale propose** : l'état voulu signé porte la
  `versionCible` et la fenêtre choisie par le DSI (`fenetreDSI`, AD-22 amendé), le contact rend le manifeste de la cible ;
  (c) **l'agent essaie** : un plan enregistré pose la candidate dans le projet Compose de l'**essai**, à côté du **réel**
  qui sert toujours, migre, vérifie la santé ; (d) **il promeut** le réel seulement si tout est vert et dans la fenêtre du
  DSI ; (e) **il revient de lui-même** sur tout échec, en relançant les empreintes de la version précédente (AD-11 :
  relancer, pas restaurer) ; (f) **rien n'avance** en gel ni en recul local. C'est le cœur d'EPIC-151 sur site, éprouvé sur
  de vrais conteneurs ; le reste est nommé plus bas.
- **D-1135-2 — L'exécution est réelle : l'agent appelle `docker compose`** (AD-10 : « le binaire `docker compose`, version
  figée dans son image, sortie `--format json` »), deux projets `<AGENT_PROJET>-essai` et `<AGENT_PROJET>-reel`, un fichier
  de composition écrit par l'agent depuis le manifeste (JSON, qui est du YAML). Seul l'exécuteur a le socket (AD-36) ; le
  contact ne l'a jamais. Derrière un port (`Executant`) : les tests unitaires jouent un exécutant simulé, la pile le vrai.
  Sans `AGENT_EXECUTANT=compose`, l'agent ne planifie rien (les piles de 955 → 1134 et la recette inchangées).
- **D-1135-3 — Les images** : l'agent ne lance qu'une image dont l'**identifiant** (`docker image inspect`) est
  l'`empreinte` signée au manifeste (`EMPREINTE_IMAGE_DIFFERENTE` sinon, avant toute pose). La signature `cosign` de chaque
  image, son bundle et le tirage par le contact (AD-7, AD-36) viennent avec la CI de publication : ici la signature du
  manifeste couvre les empreintes, et les images sont déjà sur l'hôte (comme après un tirage).
- **D-1135-4 — Le plan** (AD-11, FR-40) : `VERIFIER` → `ESSAYER` → `MIGRER_ESSAI` → `SANTE_ESSAI` → `ATTENDRE_DATE` →
  `MIGRER_REEL` → `BASCULER` → `SANTE_REEL` → `PROMUE` ; sur échec, `REVENIR_ESSAI` ou `REVENIR_REEL` → `REVENUE` (ou
  `ECHOUEE` si le retour lui-même échoue, avec alerte) ; `ARRETEE` pour `AVEC_PERTE`. Chaque étape est enregistrée avant et
  après, horodatée sur l'horloge scellée ; un redémarrage la rejoue (chaque geste Compose est idempotent). Un seul plan à
  la fois ; le verrou `PROMOTION_EN_COURS` vaut pendant tout plan non terminé et se lit à `/promotion` (la partie A le lira,
  voir « Nommé pour plus tard »). La **première mise en place** (aucune version en service) suit le même plan (`nature
  INSTALLATION`, opération `INSTALLER`, sans date ni retour : en échec, les deux projets sont arrêtés).
- **D-1135-5 — La santé** : chaque service du manifeste a sa vérification de santé d'image (`HEALTHCHECK`) ; l'étape attend
  que **tous** les services du projet soient `healthy` (ou `running` sans vérification), dans `AGENT_SANTE_DELAI_MS` (90 s
  par défaut) ; un `unhealthy`, un conteneur arrêté ou le délai dépassé : échec nommé (`SANTE_EN_ECHEC`, service et état).
- **D-1135-6 — Migrer** (AD-33) : pour chaque service `migrer: true`, dans l'ordre du manifeste, l'agent lance le **point
  d'entrée `migrer` de l'image** en conteneur dédié (`docker compose run --rm --no-deps <service> migrer`), jamais au
  démarrage ; dans le réel, **avant** la bascule, pendant que l'ancienne version sert (NFR-9). Un code de sortie non nul :
  échec. La route `migrer` du manifeste C1 du module `instance` (catalogue) n'a donc **pas d'appelant** dans cet incrément :
  elle n'est pas servie (même raison que D-1133-11) ; elle entrera avec l'image du catalogue dans une version promue sur
  site, et sa forme (route HTTP ou point d'entrée) se tranche alors — le contrat de l'agent est le point d'entrée d'AD-33.
- **D-1135-7 — La date du DSI** : FR-17 sur site, « sans son accord, rien ne change dans l'espace réel ». L'accord est
  `fenetreDSI { debut, fin }` de l'état voulu **signé** (AD-22 amendé) : l'essai part tout de suite, le réel attend
  `debut ≤ maintenant < fin` sur l'horloge scellée. Sans fenêtre : `DATE_NON_CHOISIE` ; fenêtre passée : `FENETRE_PASSEE`
  (reportée, jamais rattrapée). Le choix du DSI dans la coque passera par une commande (AD-37) puis la centrale ; ici la
  route d'opérateur de simulation la pose.
- **D-1135-8 — Pas deux promotions en 7 jours, sauf un correctif** (FR-17, AD-11) : une promotion `PROMUE` ouvre la
  fenêtre de retour arrière de 7 jours ; le réel d'une autre version attend sa fin (`PROMOTION_TROP_PROCHE`). Un
  **correctif** = même `version`, `niveauCorrectif` supérieur. Une version revenue n'a pas ouvert de fenêtre.
- **D-1135-9 — Comparer deux versions** : `x.y.z` numériquement, puis `niveauCorrectif`. Plus récente que la version en
  service ⇒ un plan ; égale ⇒ rien ; plus ancienne ⇒ **`RETOUR_PROPOSE`** (AD-22, FR-18), jamais appliqué seul : le retour
  arrière choisi par le DSI passe par une commande (AD-37), plus tard. Une version dont le plan a fini `REVENUE`, `ECHOUEE`
  ou `ARRETEE` n'est pas réessayée (`VERSION_EN_ECHEC`) : il faut une autre cible.
- **D-1135-10 — Rien n'avance en gel ni en recul local** (1134, D-1134-3) : l'agent juge l'opération (`METTRE_A_JOUR`, ou
  `INSTALLER` pour la première mise en place) **avant de créer le plan et avant chaque étape en avant** ; fermée ⇒
  `MISE_A_JOUR_FERMEE` (avec l'état) dans `/promotion`, `PROMOTION_BLOQUEE` au journal une fois par blocage ; le plan
  reprend de lui-même quand l'état se rouvre. Le **retour arrière n'est jamais bloqué** (revenir à ce qui servait ne change
  rien de neuf). Le correctif de sécurité par fichier (`CORRECTIF_PAR_FICHIER`, ouvert en gel) est d'EPIC-152.
- **D-1135-11 — Les interrupteurs** (FR-17, AD-11) : sur site, la promotion fait passer **tous** les interrupteurs du
  manifeste à leur position finale ; la version en service les porte allumés dans `/promotion`. **`module.interrupteurs` de
  l'état publié reste vide** (D-1131-4, D-1128-10) : sur site, aucun interrupteur ne reste éteint (rien à publier par
  organisation) ; sur la plateforme, où chaque organisation les allume à son rythme jusqu'à leur date limite, la source est
  la partie A (le catalogue), avec la variante « plateforme » de la promotion — nommée plus bas. Le remplir ici sans source
  publierait des positions inventées.
- **D-1135-12 — `config` n'entre pas dans l'état publié** (D-1131-4) : ce n'est pas un interrupteur, aucun consommateur ne
  l'a demandé, et aucun ne quitte `entitlement.changed` avant le 08/01 ; une version 1.2.0 du contrat figé (photo à
  l'historique, Karapace `BACKWARD_TRANSITIVE`, copie à la plateforme) se fera le jour où un consommateur la demande, avec sa
  forme. Nommé plus bas.
- **D-1135-13 — La centrale** : les versions publiées sont gardées (`versions_publiees` : version, niveau, manifeste, publiée
  le) ; un manifeste se vérifie par la chaîne (racine et certificats de CI de son environnement, `CENTRALE_CERTIFICATS_CI`),
  à l'heure de Money Vibes ; la même version republiée à l'identique : sans effet ; autrement : `409
  VERSION_DEJA_PUBLIEE`. La cible d'une instance n'est qu'une version publiée (`422 VERSION_INCONNUE`). Le rapport
  `miseAJour` du dernier contact est gardé (le « suivre les promotions par instance » de la console s'y lira). Les routes
  d'opérateur ne sont servies qu'en profil de simulation (pas d'authentification d'opérateur avant la console).
- **D-1135-14 — L'agent de la plateforme** (AD-19 : `AVEC_PERTE` interdite, retour arrière global décidé par Money Vibes,
  fenêtre fixée par Money Vibes) : cet incrément est la variante **sur site** ; l'agent refuse un manifeste `AVEC_PERTE`
  quand son instance est celle de la plateforme (`AGENT_PLATEFORME=1`, `AVEC_PERTE_INTERDIT_PLATEFORME`).
- **D-1135-15 — Les versions** : `contrats-agent-v1.2` (ajouts seuls), `agent-0.4.0`, `@prospera/signature` 0.2.0 ; la centrale
  garde son corps de réponse de 1134 pour un contact sans `miseAJour`. Le module témoin de la pile (`test/temoin/`, un
  serveur de 30 lignes en trois versions : saine, saine avec migration, malade dans le réel seulement) n'est qu'une image
  de preuve, jamais publiée.
- **D-1135-16 — Clés** : les manifestes de la preuve et des tests sont signés par la clé de **test** `ci-test-2026-2036`
  (vecteurs v2, racine de test) ; aucune clé de production n'est versionnée ; un agent de production refuse la racine de
  test (AD-28, inchangé).

## Nommé pour plus tard

- **La CI de publication** dans `prospera-plateforme` (build, liste des composants, analyse de vulnérabilités qui bloque
  la signature, `cosign sign --tlog-upload=false`, bundle) et la vérification `cosign` de chaque image par l'agent ; le
  **tirage des images par le contact** vers le volume de dépôt et leur chargement par l'exécuteur (AD-7, AD-36).
- Le **retour arrière choisi par le DSI** pendant 7 jours (« revenir » de la coque : commande d'AD-37, `instance:mise-a-jour:revenir`),
  « choisir la date » et « essayer » depuis la coque (commandes), le **dépôt d'un fichier de mise à jour** avec ses images
  (FR-22 : l'archive hors ligne ; ici le manifeste et l'état voulu passent déjà par le dépôt), les écrans de la coque et de la
  console (**A**).
- La **sauvegarde automatique avant la promotion** (FR-17) et la restauration d'une version `AVEC_PERTE` décidée par le DSI
  (EPIC-153, Dev A) ; l'**interruption mesurée** sous 15 minutes sur une instance de recette au volume représentatif (NFR-9) ;
  la **calibration d'IA** intouchable (FR-24, AD-39 : volumes hors de la migration, empreinte avant et après).
- Le **verrou de composition côté partie A** (`PROMOTION_EN_COURS` refusé par le catalogue à l'installation, AD-23, AD-33) :
  la partie A sur site n'est pas encore raccordée à l'agent (`GET /heure` non plus, EPIC-148) ; l'agent l'expose dès
  maintenant à `/promotion`.
- La **variante plateforme** (FR-17 : fenêtre fixée par Money Vibes avec annonce 7 jours avant, `versionCode` réécrite en une
  écriture journalisée, interrupteurs livrés éteints et allumés par chaque organisation jusqu'à leur date limite de 30 jours —
  **c'est là que `module.interrupteurs` de l'état publié se remplit**, par la partie A) ; `config` dans l'état publié (version
  1.2.0 du contrat figé) quand un consommateur la demande.
- La **route `migrer` du module `instance`** (D-1135-6), avec l'image du catalogue promue sur site.
- Le **plan qui installe la dépendance dure** d'une majeure (FR-12, FR-17) ; la **compatibilité croisée** agent N/N-1 ×
  plateforme N/N-1 et la mise à jour de l'agent **hors plan** (AD-3) ; la **coupure à une étape tirée au hasard** en recette ;
  « promouvoir, saisir, revenir, tout se relit » (C12) sur de vrais modules ; les **vagues** (EPIC-156) ; les **correctifs**
  (EPIC-152 : hors vagues, 72 h, par fichier en gel) ; le **message au DSI** en langage simple (`annonceMiseAJour`).
- `instance.etat.modifie` (`retourArriereEnCours`, `miseAJourAnnoncee`) et l'état publié par instance (version de plateforme)
  avec le raccordement aux espaces (EPIC-148).
