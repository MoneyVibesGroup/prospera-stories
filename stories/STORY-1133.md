# STORY-1133 : L'interface de l'agent publiée — et des vecteurs de test qui n'expirent plus en silence

Status: done — **livrée le 2026-11-27** : prospera-plateforme **#43** (`b98d1d0`, étiquette `vecteurs-v2`) et **#44**
(`c481f00`, étiquette `contrats-agent-v1`), centrale-service **#3** (`a790a46`) et **#4** (`9942cf1`), agent-instance **#2**
(`5998597`) et **#3** (`ea634af`) ; voir « Livraison ». Fiche écrite le 2026-11-27 par une sous-session du groupe B juste
avant de coder (lot 7, n° 15 de B, `coordination/PLAN-LOT-7-GROUPE-B-2026-11-25.md` §1, deuxième partie, ligne 15 ;
identifiant réservé D-L7B-1). **Date du plan : 08/01** (« l'instance est montée sur site en S10, le 29/01 »).

**Épic :** EPIC-148 (monter une instance sur site et la superviser) · voisins EPIC-149, 150, 151 · FR-13, FR-14, FR-16 ·
AD-1, AD-6, AD-7, AD-9, AD-17, AD-19, AD-25, AD-26, AD-28, AD-34, AD-36, AD-37
**Dépôts :** `prospera-plateforme` (part « moteur » de B : `vecteurs/`, `contrats/agent/`, `scripts/`, `test/`),
`centrale-service`, `agent-instance` · **lus, inchangés** : `prospera-paiement-service` (le fait relayé), le catalogue
**Points :** 5 · **Dépend de :** STORY-931 (vecteurs), STORY-943 (`point-de-decision-v1`), STORY-955 (agent et centrale),
STORY-1132 (la section « faits de paiement » du contact) · **Suite :** STORY-1134 (EPIC-149), STORY-1135 (EPIC-151)
**Sources :** plan du lot 7 de B §1 (n° 15) ; `epics-moteur-installation-2026-11-11.md` (EPIC-148 : « 🔁 08/01 : l'interface
de l'agent est publiée pour les dossiers backend de Dev A, `sauvegardes/`, `support/` » ; EPIC-149, 150, 151, 153, 154) ;
`PLAN-FEVRIER-2027-TOUT-CHARGE-2026-11-14.md` (S7) ; spine du moteur (AD-17, AD-19, AD-25, AD-36, AD-37) ; fiches
STORY-955, 1128 (inventaire), 1131 (D-1131-2 : `sante`, `migrer`), **1132** (« Nommé pour plus tard » : le relais réel ; la
clé `centrale-test-2026` qui expire le 2027-01-01). Code relu sur `origin/dev` : plateforme `758568e`
(`scripts/generer-vecteurs.ts`, `test/vecteurs.test.ts`, `paquets/point-de-decision/test/licence.test.ts`,
`test/contrats-instance.test.ts`), centrale `75977de` (`src/http.ts`, `src/cle.ts`, `src/faits-de-paiement.ts`,
`docker-compose.yml`, `scripts/jeu-croise.ts`), agent `db1dd58` (`src/executeur/*`, `src/contact/*`, copies `vendor/`).

---

## Pourquoi

Deux choses, dans cet ordre.

1. **Bloquant signalé par 1132.** La clé de test `centrale-test-2026` des vecteurs de la plateforme (et `ci-test-2026`)
   expire le **2027-01-01**. Après, la centrale de simulation refuse de démarrer (`chargerCle` : hors de sa période), un
   agent de simulation refuse tout état voulu (l'horloge scellée part de la date du serveur), et toute preuve sur pile
   rougit. Rien ne l'aurait dit avant le jour même.
2. **L'interface de l'agent.** Le 08/01, l'agent et la centrale doivent être « vivants » et l'interface de l'agent
   publiée (EPIC-148), pour que Dev A bâtisse `sauvegardes/` et `support/` dessus et que l'instance se monte sur site le
   29/01. Aujourd'hui, le contact n'existe que dans le code de la centrale (schéma en ligne de `src/http.ts`), les routes de
   l'exécuteur ne sont décrites nulle part, et **le relais des faits de paiement n'existe pas** : la preuve de 1132 a tenu
   le rôle de l'agent de la plateforme.

## Ce qui existait déjà (relu avant la fiche)

| Déjà là | Où |
|---|---|
| Vecteurs reproductibles à l'octet ; une clé manquante est **générée** par le script, puis réutilisée ; instants fixés (`2026-11-15`) | plateforme `scripts/generer-vecteurs.ts` (931) |
| Copies épinglées des vecteurs : **centrale** et **agent** seulement, à `point-de-decision-v1` (`ORIGINE.json`, `test/vendor.test.ts`) | les deux dépôts ; recherche ci-dessous |
| La centrale lit l'heure du système au démarrage pour juger sa clé (`src/main.ts` → `chargerCle`) ; tous ses tests ont une horloge fixée | centrale |
| L'exécuteur sert `GET /heure` (port `HorlogeDeReference`, AD-6), `/etat`, `/decision`, `/health` sur le réseau interne | agent `src/executeur/http.ts` (955) |
| Le contact lit `charge-contact.json`, appelle `POST /api/centrale/v1/contacts`, dépose l'état voulu ; l'exécuteur vérifie et applique | agent (955) |
| La centrale accepte `faitsDePaiement` du seul agent `PLATEFORME`, acquitte fait par fait (`APPLIQUE`, `SANS_EFFET`, `SANS_INSTANCE_SUR_SITE`, `ILLISIBLE`, `dejaVu`) | centrale `src/http.ts`, `src/faits-de-paiement.ts` (1132) |
| `paiement.abonnement.echeance.encaissee` : JSON à plat (`schemaVersion` 1, `eventId` UUID), publié par l'outbox de paiement | paiement (278, 727) ; fixture produite par son code dans la centrale (1132) |

**Copies des vecteurs cherchées partout** (le 2026-11-27) : tous les checkouts du poste (B, C, D, worktrees compris, en
lecture), par le nom des clés et par leur clé publique ; les dépôts de l'organisation non clonés ici (`prospera-app`,
`prospera-cabinet-service`, `prospera-infra`, `prospera-paie-service`, `prospera-platform-config`,
`prospera-expert-comptable`), par l'arbre de `main` et de `dev`. **Seuls `centrale-service` et `agent-instance` les
épinglent.** Le catalogue nomme `centrale-test-2026` dans `effacement.spec.ts` pour une clé **générée dans le test** : ce
n'est pas une copie (rien à faire). **Aucun dépôt de C ni de D ne les épingle** : aucune demande à leur écrire.

## Contrat annoncé avant le code (2026-11-27)

1. **Vecteurs v2** (`prospera-plateforme/vecteurs/`, étiquette **`vecteurs-v2`**) : deux clés de test neuves,
   **`centrale-test-2026-2036`** (`centrale`) et **`ci-test-2026-2036`** (`ci`), certifiées par `racine-test-2026` du
   2026-01-01 au **2036-01-01** ; `centrale-pretendue-production` recertifiée sur la même période ; `centrale-test-2025`
   gardée (expirée exprès : `CLE_HORS_VALIDITE`) ; `centrale-test-2026` et `ci-test-2026` retirées. Mêmes 16 vecteurs,
   mêmes verdicts, mêmes instants ; leurs octets changent (nouveau `kid`). La racine ne change pas. Lu par **B** seul
   (centrale, agent) ; aucun dépôt de C ou de D.
2. **`contrats/agent/`** (`prospera-plateforme`, étiquette **`contrats-agent-v1`**, neuf) :
   - `contact-requete.schema.json` (`contact-requete@1`) : le corps de `POST /api/centrale/v1/contacts`, **à l'identique**
     de ce que la centrale accepte depuis 1132 (corps fermé ; `faitsDePaiement` facultatif, ≤ 50, topic en liste fermée) ;
   - `contact-reponse.schema.json` (`contact-reponse@1`) : `{ etatVoulu, faitsDePaiement? }` et l'acquittement de 1132 ;
   - `agent-executeur.openapi.json` 1.0.0 : les routes internes de l'exécuteur (`GET /heure`, `/etat`, `/decision`,
     `/health`), telles que servies, plus `relais` (facultatif) dans `/etat` ;
   - `contact.cas.json` : des corps acceptés et refusés, rejoués des deux côtés.
3. **Centrale** : `POST /api/centrale/v1/contacts` **inchangé** (même corps, mêmes codes) ; son schéma devient la copie
   du contrat publié.
4. **Agent** : l'exécuteur de l'agent **de la plateforme** consomme `paiement.abonnement.echeance.encaissee` sur le bus de
   l'espace réel (groupe **`agent.relais-paiement`**, client de Confluent), seulement quand `AGENT_RELAIS_KAFKA` est
   posé ; `charge-contact.json` gagne `faitsDePaiement` (facultatif) ; le contact écrit les acquittements reçus dans
   `<echange>/acquittements/`. Un agent sur site ne change pas (aucun client Kafka démarré, charge à l'identique).
5. **Inchangés** : paiement (aucun fait ni champ neuf : le fait gagne un consommateur que l'AD-17 nomme déjà, « agent de la
   plateforme (relais) »), le contrat d'état publié (gel 1.1.0), la licence, les contrats de C et D.

## Ce qui doit être vrai à la fin

| # | Exigence | Preuve |
|:--:|---|---|
| AC-1 | Les vecteurs v2 sont produits par le script (clés neuves générées, puis reproductibles à l'octet) ; 16 vecteurs, mêmes verdicts ; aucune clé de production versionnée | plateforme `npm test` ; rejeu du script sans diff |
| AC-2 | **Garde des 60 jours** dans les trois dépôts : rouge si une clé de test (hors celle expirée exprès) expire dans moins de 60 jours, à l'horloge du système ; prouvée à des instants fixés (59 j : rouge ; 61 j : vert) | tests ; mutations |
| AC-3 | Centrale et agent copiés à `vecteurs-v2` ; le jeu croisé r1 → r3 réémis sous la clé neuve et recopié dans l'agent ; la centrale de simulation démarre | tests ; Node 24 ; pile |
| AC-4 | `contrats/agent/` publié, généré par un script, chaque schéma draft-07 fermé (une seule ouverture nommée : `valeur`) ; les cas rejoués par la plateforme, la centrale et l'agent | `test/contrats-agent.test.ts` ; tests des deux côtés |
| AC-5 | **Le relais réel** : un fait publié sur le bus est gardé par l'exécuteur de la plateforme, relayé au contact suivant, acquitté, jamais renvoyé ; un fait rejoué par Kafka n'est pas doublé ; un message illisible est écarté et journalisé, jamais levé | unitaires ; mutations |
| AC-6 | De bout en bout sur pile `grp-b` : un fait produit par le code de paiement, publié sur Kafka, ouvre `fiscalite` dans la licence de l'instance sur site (`GET /decision` de son agent), sans aucun appel à la main à la centrale | pile |
| AC-7 | Un agent sur site sans `AGENT_RELAIS_KAFKA` : charge et contact à l'identique de 955 | unitaires |
| AC-8 | Node 24 (`docker build --target verification`) des deux services | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1133-1 — Une clé de test neuve à validité LONGUE et fixe, pas glissante.** `centrale-test-2026-2036` et
  `ci-test-2026-2036`, du 2026-01-01 au 2036-01-01 (fin exclusive). Une validité glissante (recalculée à chaque génération)
  rendrait les vecteurs non reproductibles à l'octet : chaque copie épinglée divergerait de la plateforme au premier rejeu
  du script. Dix ans fixes gardent la règle de 931 ; la garde des 60 jours (D-1133-4) préviendra en novembre 2035. Les
  clés sont **générées par le script** (`cle()` crée une paire Ed25519 si le fichier manque, puis la réutilise) ; leur
  partie privée est versionnée comme toutes les clés de test (README : voulu), jamais une clé de production.
- **D-1133-2 — Ce qui change dans `vecteurs/`.** `centrale-pretendue-production` garde sa clé et reçoit un certificat
  jusqu'au 2036-01-01 (son nom ne porte pas d'année ; elle doit rester refusée pour `ENVIRONNEMENT_INTERDIT`, pas pour une
  date). `centrale-test-2025` reste (le vecteur `licence-cle-expiree`). `centrale-test-2026` et `ci-test-2026` sortent du
  dossier (elles restent à l'étiquette `point-de-decision-v1`). Le fichier d'urgence nomme la remplaçante neuve.
- **D-1133-3 — L'étiquette `vecteurs-v2`**, posée sur `dev` de la plateforme après la fusion ; centrale et agent s'y
  recopient (`npm run plateforme:copier`), chacun dans sa PR. Les vecteurs passent **avant** le reste de la story, en trois
  PR (plateforme, centrale, agent), pour ne pas attendre le relais.
- **D-1133-4 — La garde des 60 jours** : chaque certificat de `vecteurs/certificats/` doit rester valide au moins 60 jours
  après l'heure du **système** — le seul test qui lit cette horloge, exprès : il garde le temps réel, pas un instant fixé.
  Exemptée : la clé qui signe un vecteur dont le verdict attendu est `CLE_HORS_VALIDITE` (dérivée des vecteurs, pas d'une
  liste à tenir). La règle est une fonction pure, éprouvée à des instants fixés. Même garde dans la centrale et l'agent, sur
  leur copie.
- **D-1133-5 — « L'interface de l'agent publiée » = `contrats/agent/` à l'étiquette `contrats-agent-v1`** : ce que l'agent
  **expose** (les routes internes de l'exécuteur, OpenAPI : l'heure de la partie A, l'état, la décision sur site, la santé)
  et ce qu'il **parle** au-dehors (le contact avec la centrale : requête, réponse, faits de paiement, acquittements). Ce que
  l'agent **consomme** sur le bus (le topic relayé) est la liste fermée du contrat du contact. Les contrats d'AD-17 qui
  n'ont encore ni producteur ni lecteur (commandes, `instance.licence.acceptee`, `instance.etat.modifie`, `instance.journal`,
  signal hebdomadaire) ne sont pas figés ici : les figer sans lecteur, c'est les figer faux (même raison que D-1131-4).
- **D-1133-6 — `valeur` est le seul objet ouvert du contrat** : c'est le message du bus tel que paiement l'a publié ; son
  contrat est celui de paiement (AD-17), lu par la centrale selon ses règles (1132). Le test du dossier le nomme comme
  exception, avec sa raison ; tout autre objet est fermé.
- **D-1133-7 — Premier incrément de code : le relais réel** (celui qui a le plus de valeur : il ferme la chaîne
  paiement → bus → agent de la plateforme → centrale → licence → agent sur site, que la mise en service vend). Selon AD-36 :
  l'**exécuteur** consomme le bus du réel et range chaque fait dans son magasin (`faits_a_relayer`) ; il place les plus
  anciens non acquittés (≤ 50) dans `charge-contact.json` ; le **contact** les envoie tels quels et écrit les acquittements
  reçus dans `<echange>/acquittements/` (il ne vérifie rien) ; l'exécuteur les lit, marque chaque fait acquitté (toute issue
  est finale) et réécrit la charge. Le contact n'a toujours aucun client Kafka.
- **D-1133-8 — Le relais ne tourne que si `AGENT_RELAIS_KAFKA` est posé** (l'agent de la plateforme) : aucune branche
  « plateforme » dans le code, une configuration (AD-19). Les topics consommés sont lus dans la copie du contrat
  (`contact-requete`, liste fermée) : une source, partagée avec la centrale. Groupe `agent.relais-paiement`,
  `fromBeginning` (relire est sans danger : dédoublonnage), `createTopics` avant `subscribe`, `metadataMaxAge` 10 s,
  démarrage relancé en tâche de fond (un broker absent ne retient pas l'exécuteur).
- **D-1133-9 — Dédoublonnage et poison pill.** Un fait est gardé par `eventId` (`INSERT OR IGNORE`) : Kafka qui relivre,
  ou paiement qui republie, ne le double jamais, et un fait déjà acquitté n'est ni réadmis ni renvoyé. Un message qui n'est
  pas un objet JSON, ou dont l'`eventId` est hors du motif du contrat, est **écarté et journalisé** (journal chaîné), jamais
  levé ni relayé. Un message lisible mais faux (version, organisation…) est relayé : la centrale le garde `ILLISIBLE`.
- **D-1133-10 — La centrale valide le contact par le contrat publié** (copie à `contrats-agent-v1`) au lieu de son schéma
  en ligne ; un test vérifie que sa liste de topics est celle du contrat. Comportement à l'octet (mêmes codes, mêmes
  réponses, jeu croisé inchangé hors clé).
- **D-1133-11 — `sante` et `migrer` du module `instance` ne sont pas servis ici.** Leur seul appelant est l'agent sur site :
  `migrer` quand il promeut une version (EPIC-151, **STORY-1135**), `sante` quand il supervise (signal hebdomadaire, AD-9,
  AD-40 : suite d'EPIC-148, après le montage). Cet incrément n'appelle ni l'un ni l'autre ; les servir maintenant au
  catalogue serait une porte sans appelant (même raison que D-1131-2). Le contrat de l'exécuteur les nomme comme appels à
  venir.
- **D-1133-12 — Le rythme** : un fait part au contact suivant de l'agent de la plateforme (`CONTACT_PERIODE_MS`). Un contact
  anticipé quand des faits attendent (la vérification quotidienne d'AD-9 laisserait un jour) est nommé pour plus tard.
- **D-1133-13 — Pour Dev A** (`sauvegardes/`, `support/`, EPIC-153, 154 : dans `agent-instance`) : le contrat publié et le
  README de l'agent décrivent le volume d'échange (`charge-contact.json`, `depot/`, `acquittements/`) et réservent `ordres/`
  aux ordres de l'exécuteur vers le contact (copie hors machine, tunnel : AD-36) ; leurs formes viennent avec leurs épics.

## Nommé pour plus tard

- Les commandes (AD-37 : `POST /api/instance/v1/commandes`, `instance.commande.deposee` et `.executee`), les ordres vers le
  contact (sauvegardes, support), la remise de la licence aux espaces (`instance.licence.acceptee`), `instance.journal`,
  `instance.etat.modifie`, le signal hebdomadaire et `sante` (supervision), le montage, l'enrôlement et le contact mTLS,
  le magasin chiffré et son miroir (EPIC-148, 149) ; `migrer` (STORY-1135).
- Les autres faits relayés (`paiement.abonnement.impayee`, `.regularise`, `abonnement.contrat.signe`) : la liste fermée
  s'élargit avec la centrale qui les traite.
- Le contact anticipé quand des faits attendent (D-1133-12).

## Livraison (2026-11-27)

Contrat annoncé avant le code (prospera-stories **#1051**, `main` `e791a31`), livré sans écart. Ordre : les vecteurs
d'abord (trois PR), puis l'interface et le relais.

| PR | Poussé → sur `dev` | Ce qu'elle porte |
|---|---|---|
| prospera-plateforme **#43** | `39392d1` → **`b98d1d0`** (étiquette **`vecteurs-v2`**) | clés de test neuves `centrale-test-2026-2036`, `ci-test-2026-2036` (2026-01-01 → 2036-01-01, générées par le script) ; `centrale-pretendue-production` recertifiée ; `centrale-test-2026`, `ci-test-2026` retirées ; garde des 60 jours (`test/vecteurs.test.ts`) ; README |
| centrale-service **#3** | `bd1e024` → **`a790a46`** | copie à `vecteurs-v2` (dont `@prospera/signature` : le type du certificat d'effacement de 953, ajout seul) ; jeu croisé r1 → r3 réémis ; pile de simulation sur la clé neuve ; garde des 60 jours sur la copie ; `cle.test` : fin exclusive du 2036-01-01 |
| agent-instance **#2** | `a29ae8d` → **`5998597`** | copie à `vecteurs-v2`, jeu croisé recopié à `a790a46` ; garde des 60 jours ; pile sur la clé neuve |
| prospera-plateforme **#44** | `a4b71ea` → **`c481f00`** (étiquette **`contrats-agent-v1`**) | `contrats/agent/` : `contact-requete@1`, `contact-reponse@1`, `contact.openapi.json` 1.0.0, `agent-executeur.openapi.json` 1.0.0, `contact.cas.json` ; source `scripts/contrats-agent.ts` (`npm run contrats:agent`) ; `test/contrats-agent.test.ts` ; README |
| centrale-service **#4** | `ce1c00a` → **`9942cf1`** | copie à `contrats-agent-v1` ; le contact compile la copie de `contact-requete@1` ; `test/contrat-du-contact.test.ts` |
| agent-instance **#3** | `8275e14` → **`ea634af`** | copie à `contrats-agent-v1` ; `src/executeur/relais.ts`, `kafka.ts` (client de Confluent ~1.11.0), `depot.ts` (charge, `traiterAcquittements`), `contact.ts` (acquittements déposés), `http.ts` (`relais`), `main.ts` (`AGENT_RELAIS_KAFKA`, `AGENT_RELAIS_GROUPE`) ; `agent-0.2.0` ; profil compose `relais` ; tests `relais`, `contrat-executeur` ; README |

Chaque PR : `mergedAt` non nul, `headRefOid` = SHA poussé, diff vide entre la branche et `dev` après le rejeu.

### Preuves

- **Plateforme** (Node 25) : `npm test` **676/676** après #43 (674 avant), **697/697** après #44 ; `typecheck` vert ; le
  script des vecteurs rejoué deux fois sans diff (reproductible) ; mutations **7/7** sur la garde (dont le témoin : l'ancien
  certificat de 1132 remis au dossier est nommé, « fin 2027-01-01 ») et **8/8** sur le contrat de l'agent.
- **Centrale** (Node 25) : **63/63** après #3 (59 avant), **74/74** après #4 ; `typecheck` ; mutations 5/5 (garde) et 4/4
  (contrat).
- **Agent** (Node 25) : **55/55** après #2, **78/78** après #3 ; `typecheck` ; mutations 5/5 (garde) et **23/23** sur le
  relais (dédoublonnage, ordre, borne, acquittement rejoué, écart compté et journalisé, contrat du fait, tableau JSON, reçu
  journalisé, section vide, acquittements non jugés, charge non réécrite, refus non journalisé, acquittements non déposés ;
  Kafka : topics avant `subscribe`, `fromBeginning`, métadonnées, panne avalée, pause absente ou constante, consommateur
  réemployé, ancien non déconnecté).
- **Node 24** (`docker build --target verification`, archives des branches avant la recopie à l'étiquette) : agent
  **77/78**, centrale **73/74** — le seul rouge de chacun, le test « copié à une étiquette », venait de la copie temporaire
  faite depuis la branche de la plateforme (`origin/MNV-1133-agent`), recopiée ensuite à `contrats-agent-v1`, sans autre
  changement qu'`ORIGINE.json`. `npm ci` du client de Confluent réussi dans l'image. Rejoué après la fusion sur les archives d'`origin/dev` (agent `ea634af`, centrale `9942cf1`) : **agent 78/78, centrale 74/74** (verrou 15:55:24 → 15:56:01).
- **Pile `grp-b --profile relais`** (archives des branches : agent `7846a29`, centrale `91c8ed5` ; Kafka 3.9.0, centrale,
  agent sur site, agent de la plateforme) : **9/9** —
  - l'agent sur site applique la licence semée n° 2 (`bilan`, `balance`), signée par **`centrale-test-2026-2036`** ;
    `fiscalite` ⇒ `MODULE_HORS_LICENCE` ;
  - l'exécuteur de la plateforme s'abonne (`agent.relais-paiement`) ; on publie sur Kafka le fait **produit par le code de
    paiement** (`0b8d1f2e-…-0001`, `FISCALITE`, `PI_SPI`) et un message illisible ;
  - **15 s** plus tard, le fait est relayé et acquitté (`APPLIQUE`, journal de la centrale), le message illisible écarté
    (`relais` : 0 en attente, 1 acquitté, 1 écarté) ;
  - **29 s** après la publication, l'agent sur site applique la licence **n° 16** (`bilan`, `balance`, `fiscalite`,
    `pi-spi`) : `fiscalite` ⇒ `{ ouvert: true }` — sans aucun appel à la main à la centrale ;
  - le même fait republié, puis l'exécuteur de la plateforme redémarré (il relit l'offset 2, pas encore validé) : gardé une
    fois, rien de neuf à relayer, la centrale n'a reçu qu'**un** contact portant des faits ; le site garde la n° 16.
- **Verrou Docker** : 15:31:28 → 15:36:32 (une passe), `down -v`, aucun conteneur ni volume `grp-b` restant.

### Écarts à la fiche

- Aucun écart au contrat annoncé. Précisions : `@prospera/signature` copié à `vecteurs-v2` porte le type du certificat
  d'effacement (953) que la copie de `point-de-decision-v1` n'avait pas (ajout seul) ; un cas du contrat (`eventId` hors du
  motif) a été durci pendant les mutations (`evenement:00001`, plus long que 8, pour juger le motif et non la longueur).
