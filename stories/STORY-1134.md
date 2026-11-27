# STORY-1134 : L'instance garde la confiance, coupée de Money Vibes — premier incrément

Status: in-progress — fiche écrite le 2026-11-27 par une sous-session du groupe B juste avant de coder (lot 7, n° 16 de B,
`coordination/PLAN-LOT-7-GROUPE-B-2026-11-25.md` §1, deuxième partie, ligne 16 ; identifiant réservé D-L7B-1).
**Date du plan : 15/01** (« prérequis de la licence et des mises à jour »).

**Épic :** EPIC-149 (l'instance garde la confiance, même coupée de Money Vibes) · voisins EPIC-148, 150, 151 · FR-15, FR-22 ·
NFR-4, NFR-11 · AD-4, AD-5, AD-7, AD-9, AD-12, AD-22, AD-28, AD-35
**Dépôts :** `agent-instance`, `centrale-service`, `prospera-plateforme` (part « moteur » de B : `contrats/agent/`, étiquette
neuve `contrats-agent-v1.1`) · **lus, inchangés** : le catalogue, paiement, le contrat d'état publié (gel de 1128)
**Points :** 5 · **Dépend de :** STORY-955 (agent, horloge scellée, état voulu), STORY-931 (vecteurs, fichier d'urgence),
STORY-1132 (licence par le paiement), STORY-1133 (`contrats-agent-v1`, `vecteurs-v2`, relais) · **Suite :** STORY-1135
(EPIC-151 : une mise à jour ne s'applique pas en gel), suite d'EPIC-150
**Sources :** plan du lot 7 de B §1 (n° 16) ; `epics-moteur-installation-2026-11-11.md` (EPIC-149 ; « EPIC-149 précède
EPIC-150 » ; « Pour février : EPIC-149 », suite d'attaques) ; `PLAN-FEVRIER-2027-TOUT-CHARGE-2026-11-14.md` (S8, R6) ; PRD du
moteur §3 (contact, délai de silence, gel, horloge scellée, état de confiance), §3.1 (état de l'instance `NORMAL`, `GEL`),
FR-15, NFR-11, addendum §A-1 ; spine du moteur AD-4, AD-5, AD-7, AD-9, AD-19, AD-22, AD-25, AD-28, AD-35 ; fiches STORY-955,
1132 (D-1132-1 → 13, « reste nommé »), 1133 (D-1133-1 → 13). Code relu sur `origin/dev` : agent `ea634af` (`src/executeur/*`,
`src/contact/*`, `test/aide.ts`, copies `vendor/`), centrale `9942cf1` (`src/http.ts`, `src/emetteur.ts`, `src/registre.ts`,
`src/cle.ts`), plateforme `c481f00` (`scripts/contrats-agent.ts`, `paquets/signature`, `paquets/point-de-decision/src/licence.ts`,
`vecteurs/fichier-urgence-valide.jws`).

---

## Pourquoi

Une instance sur site vit le plus souvent **sans** Money Vibes : câble coupé, pare-feu, client qui ne paie pas. FR-15 dit
que le silence ne punit rien, mais NFR-11 et AD-4 disent que rien ne doit pouvoir reculer l'état de confiance : une licence
ancienne qui revient, une horloge ramenée en arrière par un instantané de VM, un jumeau de VM. Le risque R6 du plan de
février est exactement celui-ci : « un état de confiance qui laisse une licence éternelle », invisible en test fonctionnel.
Et EPIC-149 précède la licence (EPIC-150) et les mises à jour (EPIC-151) : une mise à jour ne s'applique pas en gel, une
licence ne s'accepte qu'au regard d'un état de confiance qui n'a pas reculé.

## Ce qui existait déjà (relu avant la fiche)

| Déjà là | Où |
|---|---|
| Horloge scellée, trois règles : allumée, temps mesuré ; au redémarrage, la date du serveur si elle avance, 48 h au plus ; seule une heure de référence signée de numéro supérieur la corrige | agent `horloge-scellee.ts` (955) — tests « + 10 ans », « recul de 40 jours » |
| Licence vérifiée hors ligne, à l'heure scellée : `LICENCE_ANTERIEURE` (numéro ≤ plus haut vu par clé, ou heure de référence antérieure), `LICENCE_AUTRE_INSTANCE`, `LICENCE_INVALIDE` ; état voulu tout ou rien ; révision jamais en recul | agent `appliquer.ts`, `lireLicence` (943, 955) |
| Liste de révocation de la centrale fusionnée (une clé révoquée ne revient jamais), aucun signataire révoqué | agent `appliquer.ts` (955) |
| Journal chaîné (empreinte de la précédente), `verifierJournal`, `/health` | agent `magasin.ts` (955) |
| Le contrat du fichier d'urgence (signé par la racine : `cleRevoquee`, `remplacante`, `numero`) et son vecteur | plateforme `contrats/fichier-urgence.schema.json`, `vecteurs/fichier-urgence-valide.jws` (931) |
| `gelApresJours` dans l'état voulu (30), émis par la centrale | contrat `etat-voulu@1`, centrale `emetteur.ts` |

**Ce qui manque** : aucun état de confiance nommé (ni silence, ni gel), rien de ce qui est ouvert ou fermé selon l'état ;
aucun dernier contact gardé ; aucun compteur, aucune empreinte, aucun miroir : un magasin restauré d'un instantané repart
avec son ancienne licence, son ancien plus haut numéro et son ancienne horloge, sans que personne le voie ; aucun témoin à
la centrale ; le fichier d'urgence n'est lu par personne ; l'agent ne connaît que les certificats copiés à son étiquette :
**une clé de la centrale renouvelée (chaque trimestre, AD-28) serait refusée `CLE_INCONNUE`, et son heure de référence n° 1
refusée `HEURE_ANTERIEURE`** (l'agent compare le numéro sans regarder la clé) — la rotation est impossible aujourd'hui.

## Contrat annoncé avant le code (2026-11-27)

`prospera-plateforme/contrats/agent/`, étiquette neuve **`contrats-agent-v1.1`** (règle de la plateforme : `@1`, ajouts
facultatifs seulement, une source `scripts/contrats-agent.ts`). Lu par **B** seul (centrale, agent ; STORY-1135 lira la
matrice) ; aucun contrat de C ou de D ; **→ A** : information (aucun écran débloqué).

1. **`contact-requete@1`** gagne **`confiance`** (facultatif, fermé) : `compteur` (entier ≥ 1), `empreinte` et
   `empreintePrecedente` (64 hexadécimaux), `etat` (`NORMAL` | `SILENCE` | `GEL` | `RECUL_LOCAL`), `niveauAncrage`
   (`LOGICIEL`). Un agent ≤ 0.2.0 ne l'envoie pas : la centrale le traite comme avant.
2. **`contact-reponse@1`** gagne **`certificats`** (facultatif, ≤ 8 JWS) : les certificats de clé, signés par la racine,
   des clés dont la centrale signe ; rendu seulement à un contact qui porte `confiance` (sinon réponse à l'octet de 1133).
3. **`contact.openapi.json` 1.1.0** : refus neuf **`409 CONFIANCE_EN_ANOMALIE`** (`{ code, nature }`, `nature` ∈ `RECUL` |
   `BIFURCATION` | `RECUL_LOCAL`) : aucun état voulu, aucune licence, anomalie ouverte. Les autres refus inchangés.
4. **`agent-executeur.openapi.json` 1.1.0** : **`GET /confiance`** (l'état de confiance nommé, le silence, le seuil, ce qui
   est ouvert ou fermé, le compteur et l'empreinte du contact préparé, le miroir, les clés connues) ; **`POST
   /simulation/horloge`** (`{ avancerJours }`) — **profil de simulation seulement** (racine de test), `404` ailleurs : le
   seul moyen d'avancer l'horloge scellée sans toucher à celle du poste.
5. **`etats-de-confiance.json`** (neuf) : les seuils (silence 7 jours, gel 30 par défaut), les quatre états, les opérations
   et la matrice état × opération (ouvert / fermé), avec la raison de chaque case fermée.
6. **Centrale** : `POST /api/centrale/v1/contacts` juge `confiance` (témoin d'AD-4) et rend `certificats` ; sans
   `confiance`, inchangé à l'octet. **Agent** : `agent-0.3.0`, `AGENT_MIROIR` (facultatif), le dépôt accepte aussi les
   certificats de clé et les fichiers d'urgence.
7. **Inchangés** : le contrat d'état publié (1.1.0, gel de 1128 : le bandeau de gel vient plus tard), `etat-voulu@1`,
   `licence@1`, les vecteurs (`vecteurs-v2`), paiement, catalogue, auth.

## Ce qui doit être vrai à la fin

| # | Exigence | Preuve |
|:--:|---|---|
| AC-1 | **États nommés sur l'horloge scellée** : `NORMAL` (< 7 j depuis le dernier contact vu), `SILENCE` (≥ 7 j), `GEL` (≥ `gelApresJours`), `RECUL_LOCAL` ; chaque transition au journal ; la matrice ouvert / fermé est celle du contrat | unitaires (bornes 7 j et 30 j à la milliseconde) ; mutations |
| AC-2 | **Le silence ne punit pas** : en `SILENCE` et en `GEL`, `/decision` rend la même réponse qu'en `NORMAL` ; en `GEL`, `INSTALLER` et `METTRE_A_JOUR` sont fermés, le travail quotidien, les commandes de fichier et de support, et le correctif par fichier restent ouverts | unitaires ; pile |
| AC-3 | **Le retour du contact lève le gel** : un état voulu appliqué (réseau ou fichier) est un contact ; un fichier déjà vu redéposé n'en est pas un ; un seuil abaissé ne raccourcit pas un silence déjà écoulé | unitaires ; pile |
| AC-4 | **Compteur et empreinte** : +1 à chaque contact préparé, le même couple tant que le contact n'a pas abouti ; deux magasins identiques préparent deux empreintes différentes (jumeau) | unitaires ; mutations |
| AC-5 | **Miroir qui n'avance que** : jamais réécrit par un magasin de compteur ou de rang inférieur ; au démarrage, un magasin en retard ⇒ `RECUL_LOCAL`, l'état de confiance repris du miroir (l'ancienne licence reste refusée, l'horloge ne recule pas), toute licence refusée ensuite | unitaires (« restaurer un instantané ») ; mutations |
| AC-6 | **Témoin à la centrale** : `PREMIER`, `REJEU`, `SUIVANT`, `LACUNE` (journalisée, acceptée), `RECUL`, `BIFURCATION`, `RECUL_LOCAL` déclaré ⇒ `409 CONFIANCE_EN_ANOMALIE`, anomalie ouverte, aucun état voulu, jusqu'au ré-ancrage ; un contact sans `confiance` inchangé à l'octet | unitaires HTTP ; jeu croisé inchangé |
| AC-7 | **Rotation et révocation sans appel** : un certificat de clé de la racine, déposé par le contact ou par le DSI, est appris (une clé neuve signe alors l'état voulu, son heure de référence n° 1 est acceptée : numéros par clé) ; un fichier d'urgence déposé révoque la clé, réinitialise son plus haut numéro et l'heure de la dernière licence, et passe avant tout état voulu du même dépôt ; une urgence rejouée ou plus ancienne est refusée | unitaires ; vecteur `fichier-urgence-valide` ; pile |
| AC-8 | **Les refus de toujours tiennent** : licence rejouée, plus ancienne, d'une clé révoquée, d'une clé de CI ; état voulu redéposé ; « + 10 ans » ; « recul de 40 jours » | tests de 955 rejoués, verts |
| AC-9 | Contrat `contrats-agent-v1.1` publié et généré ; centrale et agent copiés à l'étiquette, cas rejoués des deux côtés | plateforme `npm test` ; `vendor.test.ts` |
| AC-10 | Node 24 (`--target verification`) des deux services ; **pile `grp-b`** : couper la centrale, avancer l'horloge de l'agent (`/simulation/horloge`) jusqu'au gel, montrer ce qui reste ouvert, révoquer par fichier, rétablir la centrale : le gel se lève au premier contact | « Preuves » |

## Décisions retenues par défaut (contestables)

- **D-1134-1 — Ce que couvre cet incrément.** « Garder la confiance, coupée » = (a) des **états de confiance nommés** et la
  **période de grâce** jusqu'au gel, avec ce qui reste ouvert ou fermé ; (b) le **compteur** et le **miroir qui n'avance
  que** (le recul local) ; (c) la centrale **témoin** (recul, bifurcation, lacune) au retour du contact ; (d) la **rotation et
  la révocation** des clés de la centrale **sans appel** (certificat et fichier d'urgence par le dépôt, numéros d'heure de
  référence par clé). C'est le premier incrément qui a le plus de valeur pour le 15/01 : STORY-1135 lit la matrice (aucune
  mise à jour en gel), la suite d'EPIC-150 s'appuie sur un état de confiance qui ne recule pas, et la rotation trimestrielle
  de la clé de la centrale (AD-28) devient possible. Le reste est nommé plus bas.
- **D-1134-2 — Les états, sur l'horloge scellée, depuis le dernier contact vu** (AD-9, FR-15, addendum §A-1) : `NORMAL`
  (silence < 7 jours), `SILENCE` (≥ 7 jours : le pendant, sur site, de l'alerte de J+7 que la centrale lève sur son horloge),
  `GEL` (≥ `gelApresJours`), `RECUL_LOCAL` (prime sur les trois autres). Bornes fermées à gauche (`SILENCE` à 7 j pile).
  Avant le premier contact, le silence court depuis l'initialisation de l'horloge (`initialiseeLe`).
- **D-1134-3 — Ce qui reste ouvert ou fermé** (`etats-de-confiance.json`, une source pour l'agent et STORY-1135) :

  | Opération | `NORMAL` | `SILENCE` | `GEL` | `RECUL_LOCAL` |
  |---|:--:|:--:|:--:|:--:|
  | `TRAVAIL_QUOTIDIEN` (décision sur la licence acceptée) | ✓ | ✓ | ✓ | ✓ |
  | `ACCEPTER_LICENCE` (appliquer un état voulu) | ✓ | ✓ | ✓ (c'est un contact : il lève le gel) | ✗ |
  | `INSTALLER`, `METTRE_A_JOUR` | ✓ | ✓ | ✗ | ✗ |
  | `CORRECTIF_PAR_FICHIER` (correctif de sécurité critique) | ✓ | ✓ | ✓ | ✓ |
  | `COMMANDE_FICHIER`, `COMMANDE_SUPPORT` (FR-35) | ✓ | ✓ | ✓ | ✓ |
  | `EXPORT_APPRENTISSAGE` (niveaux 1 à 3) | ✓ | ✓ | ✓ | ✗ |

  « Le silence ne punit pas » (FR-15) : aucun état ne ferme un module ; `/decision` ne lit pas l'état de confiance.
- **D-1134-4 — Ce qui est un contact** (PRD §3) : un **état voulu appliqué** (révision neuve, heure de référence de numéro
  supérieur pour sa clé), qu'il arrive par le contact réseau ou par un fichier déposé par le DSI. Un fichier déjà vu redéposé
  est refusé (révision ou heure antérieure) : ce n'est pas un contact. Un fichier d'urgence ou un certificat de clé n'est
  pas un contact (ni heure de référence ni révision).
- **D-1134-5 — Le seuil** : `gelApresJours` de l'état voulu appliqué, 30 par défaut. Il est pris au contact qui le porte, où
  le silence repart de zéro : un seuil abaissé ne raccourcit jamais un silence déjà écoulé (AD-9).
- **D-1134-6 — Le compteur et l'empreinte** (AD-4) : le compteur croît de un à chaque **contact préparé** (le premier au
  démarrage, puis après chaque état voulu appliqué) ; le couple (compteur, empreinte) reste le même tant que le contact n'a
  pas abouti, quel que soit le nombre de réécritures de la charge. L'empreinte = sha256 de la précédente et, en JCS, du
  compteur, de l'instance, d'un **aléa tiré à la préparation** et du résumé de l'état de confiance (révision, licence, plus
  haut numéro par clé, clés révoquées, heure de référence, tête du journal) : deux jumeaux de VM identiques préparent deux
  empreintes différentes, et la centrale voit la bifurcation dès leur premier contact suivant.
- **D-1134-7 — Le miroir** (`AGENT_MIROIR` : un fichier sur le volume dédié du second support) : une copie de l'état de
  confiance, du compteur et de la tête du journal, réécrite (atomiquement) à chaque tour de l'exécuteur, **jamais** par un
  magasin de compteur ou de rang de journal inférieur. Au démarrage, un magasin en retard sur le miroir est un **recul
  local** : l'agent journalise `RECUL_LOCAL`, **reprend l'état de confiance du miroir** (horloge la plus avancée, plus haut
  numéro par clé, licence acceptée, révision, clés révoquées, dernier contact, compteur) — l'ancienne licence reste refusée
  et l'échéance tombe à la même date (NFR-11) — et reste en `RECUL_LOCAL` (toute licence refusée, exports fermés) jusqu'au
  ré-ancrage (AD-35, plus tard). Sans `AGENT_MIROIR`, `/confiance` dit `miroir: ABSENT` (le montage d'EPIC-148 l'exigera) ;
  le miroir d'une autre instance fait refuser le démarrage.
- **D-1134-8 — La centrale témoin** (AD-4, AD-35) : elle garde le dernier couple vu. `PREMIER` (aucun), `REJEU` (même
  couple), `SUIVANT` (compteur + 1, précédente connue), `LACUNE` (compteur plus haut d'au moins deux : journalisée, acceptée,
  jamais sanctionnée), `RECUL` (compteur plus bas), `BIFURCATION` (même compteur, autre empreinte ; ou compteur + 1 et
  précédente inconnue), `RECUL_LOCAL` (déclaré par l'agent). Les trois derniers ouvrent une **anomalie** (le ticket) et
  rendent `409 CONFIANCE_EN_ANOMALIE` : ni état voulu ni licence, à ce contact et aux suivants, jusqu'à sa levée par le
  ré-ancrage (plus tard). Un contact sans `confiance` (agent ≤ 0.2.0) n'est pas jugé.
- **D-1134-9 — La rotation sans appel** : la centrale rend dans le contact le certificat de la clé dont elle signe (`certificats`) ;
  le contact le dépose tel quel ; l'exécuteur **apprend** tout certificat de clé vérifié par sa racine, de son environnement,
  encore valide à l'heure scellée, d'une clé non révoquée (un `kid` déjà connu sous un autre certificat est refusé). Le DSI peut
  déposer le même fichier à la main (FR-22). Les certificats appris font partie de l'état de confiance (miroir compris).
  **Numéros d'heure de référence par clé** : une heure de référence se compare au plus haut numéro vu **pour sa clé** (AD-7 :
  « un numéro qui ne fait que croître par clé ») ; un magasin d'avant cette story rattache son numéro à la clé de sa licence.
- **D-1134-10 — La révocation sans appel** : un **fichier d'urgence** (signé par la racine, AD-7) déposé — par le contact ou le
  DSI — est vérifié hors ligne (racine, environnement, numéro supérieur au plus haut vu pour la racine ; le même rejoué est
  « déjà appliqué », un plus ancien est refusé) ; il **révoque** la clé, **réinitialise** son plus haut numéro et l'heure de la
  dernière licence acceptée (une licence ré-émise sous la remplaçante est acceptée même si son heure est antérieure). Dans un
  dépôt, l'ordre est : fichiers d'urgence, puis certificats, puis états voulus.
- **D-1134-11 — La licence en vigueur signée par une clé révoquée par urgence reste appliquée** jusqu'à la licence ré-émise
  sous la remplaçante : un incident de clé chez Money Vibes ne coupe pas le travail du client (FR-15). Tout ce que la clé
  signerait ensuite est refusé. Contestable : AD-7 dit « révoque tout ce que la clé a signé » ; l'autre lecture fermerait
  tous les modules d'une instance coupée jusqu'au fichier suivant.
- **D-1134-12 — Avancer l'horloge en preuve** : `POST /simulation/horloge` sur l'exécuteur, servi **seulement** quand la racine
  de l'agent est de l'environnement `test` (le profil de simulation) ; `404 ROUTE_INCONNUE` sinon ; chaque avance au journal
  (`HORLOGE_AVANCEE_EN_SIMULATION`). Jamais l'horloge du poste.
- **D-1134-13 — `instance.etat.modifie` n'est pas publié ici** : sur site, l'agent n'a encore aucun client Kafka vers les
  espaces (D-1133-5 : un contrat sans lecteur ne se fige pas). Les transitions vont au journal chaîné et à `/confiance` ; la
  charge du contact porte l'état. Le fait, sa projection par la partie A et le **bandeau de gel dans la coque** viennent avec
  le raccordement aux espaces (EPIC-148) ; le contrat d'état publié n'est pas touché (gel de 1128).
- **D-1134-14 — Les versions** : `contrats-agent-v1.1` (ajouts seuls), `agent-0.3.0` ; la centrale garde son corps de
  réponse de 1133 pour un contact sans `confiance` (jeu croisé r1 → r3 inchangé à l'octet).

## Nommé pour plus tard

- **Ré-ancrage** après sinistre (AD-35 : fichier de rétablissement à usage unique, compteur à `dernier + 1`, trou du journal,
  époque) : la seule sortie de `RECUL_LOCAL` et la levée d'une anomalie de témoin ; **fichier de prolongation** (panne de
  Money Vibes de plus de 3 jours).
- `instance.etat.modifie`, sa projection par la partie A, le **bandeau de gel dans la coque** ; « couper le contact 30 jours
  fait apparaître le bandeau » (fin d'épic) — avec le raccordement aux espaces (EPIC-148).
- La **ré-émission des licences sous la remplaçante** à la centrale après une urgence, et l'émission du fichier d'urgence
  (cérémonie de la racine, AD-28) ; la rotation de la clé de la centrale vue de la centrale (deux certificats servis pendant le
  recouvrement).
- Le **registre des consentements** dans l'état de confiance (AD-13) ; l'**époque** (AD-16) ; le magasin **chiffré** et le
  **bail** (AD-34, AD-3) ; le refus du renouvellement du certificat mTLS après recul (AD-29).
- L'**alerte de J+7** à la centrale, le parc (dernier contact, niveau d'ancrage, anomalies) dans la console (EPIC-148, A).
- La partie A sur site qui lit `numeroHeureReference` (désormais par clé) et fait tomber l'échéance de la licence sur
  l'horloge scellée (EPIC-148/150).
- La **suite d'attaques** jouée en recette (fin d'EPIC-149 : + 10 ans, recul de 40 jours, sauvegarde de six mois, jumeau,
  magasin restauré sous son miroir, licence rejouée, clé révoquée, fichier modifié) : cet incrément les prouve en unitaires et
  sur la pile de l'agent ; la recette croisée vient avec le montage.
