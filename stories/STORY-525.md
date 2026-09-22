# STORY-525 : Le dépôt — une doctrine, ou neuf intégrations ? La question qui change le chiffrage du programme international

Status: review

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` (cadrage) — puis N services selon l'arbitrage
**Points :** 8 *(le cadrage ; les intégrations sont hors de ce chiffrage)* · **Sprint :** S20
**Complexité :** medium
**Origine :** §6.1 de `analyse-scalabilite-multireferentiel-2026-08-27.md`.

---

## Le fait

Le produit s'arrête à la **liasse et à son export**. Ce que le cabinet achète, c'est **le dépôt** :
l'**e-DSF** à l'OTR au Togo, et des plateformes, des formats, des canaux et des calendriers
**différents** à la DGI du Bénin, de Côte d'Ivoire, du Sénégal.

**État réel, vérifié :**

| Ce qui existe | Ce que ça couvre |
|---|---|
| `EPIC-032` — dépôt assisté, accusé, dossier de contrôle, jalon `format confirmé` | **cadré**, non livré |
| **FE-081** — déclarer un dépôt, son numéro d'accusé, sa pièce jointe, son signataire | écrite, `blocked` sur **STORY-446**, non livrée |
| **STORY-446** — état `DEPOSE` + accusé | non livrée |

> ⚠️ *Relu le 2026-09-22 :* ce tableau date du 2026-08-27. **STORY-446 est `done` depuis le
> 2026-09-03**, et les trois appuis backend de FE-081 (446, 452, 453) sont livrés — cf. M1 et M3.

⇒ **Ce qui existe couvre la TRACE du dépôt, pas le dépôt.** Et FE-034 a déjà dû corriger un libellé
qui disait « Liasse déposée » là où le produit ne savait que « figer ».

## ✅ ARBITRAGE PO — 2026-08-28 : **VOIE A. Le produit dépose.**

La doctrine vaut pour **les trois verticaux** : fiscal (ici), IMF ([[STORY-509]]) et assurance
([[STORY-523]]). Elles cessent d'être `needs-po-decision` et citent cette décision.

### Ce que la voie A engage, dit sans adoucir

**Le dépôt devient une capacité produit, donc un engagement de disponibilité.** Un cabinet qui
dépose par Prospera ne peut plus déposer autrement le jour de l'échéance. Trois conséquences qui ne
se négocient pas :

1. ⛔ **Chaque pays est une intégration, avec son jalon `format confirmé`.** Aucun pays n'est promis
   avant que son gabarit officiel ne soit **au dépôt**, sourcé et daté. Le programme a payé deux
   fois pour l'avoir oublié (acomptes trimestriels au lieu des dates réelles, RSL à 10 % au lieu de
   8,75 %) : deux erreurs **plausibles**, donc invisibles à la relecture.
2. ⛔ **Un format change sans prévenir.** Une administration révise son gabarit entre deux lois de
   finances. ⇒ Le format est **packagé et versionné**, jamais codé ([[STORY-536]]), et un dépôt
   porte **la version de format qui l'a produit**.
3. ⛔ **Un dépôt peut être REJETÉ par l'administration.** C'est l'état que le produit ne connaît pas
   aujourd'hui, et il est aussi important que l'accusé : un rejet non traité est une échéance
   manquée, et au Togo une échéance manquée coûte **40 %**.

### Le découpage qui en découle

| Story | Objet |
|---|---|
| **STORY-536** | le **paquet de dépôt** : format, canal, calendrier, gabarit — packagé par pays et par état |
| **STORY-537** | la **génération du fichier e-DSF Togo** (OTR) — 1ᵉʳ pays, jalon `format confirmé` |
| **STORY-538** | **transmission, accusé et REJET** — le cycle de vie complet d'un dépôt |
| **STORY-539** | le **calendrier de dépôt** et les échéances opposables, multi-pays et multi-état |
| **STORY-446** | état `DEPOSE` + accusé — **existante, non livrée, et elle bloque FE-081** |

> ⚠️ *Statuts réels au 2026-09-22 :* §8 de [`doctrine-depot-2026-09-22.md`](../doctrine-depot-2026-09-22.md).

⚠️ **Cette story-ci reste le CADRAGE** : elle pose la doctrine, le contrat commun et le jalon. Les
intégrations pays sont chiffrées une par une, et **aucune n'est incluse dans ses 8 points**.

---

# Cadrage mesuré — fait AVANT de rédiger la doctrine

Mesuré le 2026-09-22. Les statuts ont été relus dans `sprint-status.yaml` et
`frontend-sprint-status.yaml`. Le code a été lu sur `dev` de `fiscal-service`, `dossier-service`,
`bilan-service`, `assurance-service`, `microfinance-service` et `balance-service` : les arbres
étaient propres et `HEAD` = `origin/dev`.

**M1 — STORY-446 est livrée.** Elle est `done` depuis le 2026-09-03 (`sprint-status.yaml`
l. 3218-3219 ; `STORY-446.md` l. 3 et 52-56). Côté code :

- `bilan-service` : `JeuEtatsStatut.DEPOSE` (`src/modules/bilan/jeu-etats/jeu-etats.enums.ts` l. 26),
  `POST :id/deposer` (`jeu-etats.controller.ts` l. 506), `DEPOSEE` publié sur `liasse.etat.change`
  (`src/kafka/events/liasse-events.ts` l. 72) et `AuditType.LIASSE_DEPOSEE`
  (`src/modules/bilan/audit/audit.enums.ts` l. 29) ;
- `dossier-service` : `DEPOSEE` accepté (`src/modules/portefeuille/etats-amont-enveloppe.util.ts`
  l. 32) et `AvancementDossier.LIASSE_DEPOSEE` (`avancement.enum.ts` l. 68).

⇒ Sur ce point, le tableau « État réel » et le découpage de cette story sont périmés.

**M2 — Ce que STORY-446 enregistre est un dépôt constaté, jamais réalisé** (AC-6, `STORY-446.md`
l. 39-40 ; `jeu-etats.enums.ts` l. 21-24). Le fait a été modélisé sur le dépôt fiscal :

- `numeroAccuse` est obligatoire (`dto/deposer-liasse.dto.ts` l. 181) ;
- le signataire doit être inscrit à un **ordre professionnel** (`numeroOrdre`, l. 51-96) ;
- `canal` est un texte libre (l. 158), par choix (`STORY-446.md` l. 89-94).

**M3 — FE-081 est toujours `blocked` sur STORY-446**, alors que ses trois appuis backend (446, 452,
453) sont `done` (`FE-081.md` l. 3, 7 et 65-69 ; `frontend-sprint-status.yaml` l. 567). FE-095 dit
aussi que 446 est « NON LIVRÉE » (l. 577), et l'en-tête de `STORY-538.md` dit « non livrée » (l. 8).

**M4 — STORY-536 est `done` depuis le 2026-09-19** (`sprint-status.yaml` l. 3973-3974). Le contrat
`PaquetDepot` (`fiscal-service/src/domain/paquets-depot/contrat-paquet-depot.ts` l. 21-56) :

| Champ | Ce que le contrat accepte | Lignes |
|---|---|---|
| `format.support` | `XML`, `CSV_POSITIONNE`, `TABLEUR`, `PDF_A` | l. 27 |
| `canal` | un seul type parmi `TELESERVICE`, `DEPOT_PHYSIQUE`, `COURRIEL`, et une seule adresse | l. 38-42 et 126-130 |
| `calendrier.regle.type` | `CLOTURE_PLUS_MOIS` seulement | l. 45 et 138 |
| `gabarit` | non vide | l. 102-104 |
| `pays` | code ISO alpha-2 | l. 72 |

Tout dépôt devra porter la version de format qui l'a produit (`ReferenceFormatDepot`, l. 1-13). Le
manifeste est vide (`src/modules/paquets-depot/assets/manifeste.json`). Le statut de dépôt des pays
(`dossier-service/src/modules/pays/enums/statut-depot-pays.enum.ts` l. 16-21) est dérivé de ce seul
manifeste (`registre-pays.ts` l. 142-147 ; `paquets-packages.miroir.ts` l. 221). ⇒ Aucun pays n'est
servi pour le dépôt : les 23 pays sont `non-servi` à la vérification docker de 536 (`STORY-536.md`
l. 174-175).

**M5 — Le régime SFD est `DEPOT_PHYSIQUE`.** STORY-509 est `done` depuis le 2026-09-19
(`sprint-status.yaml` l. 3772-3773).

- **Support :** papier signé ; l'électronique vient seulement en complément ; aucun format de fichier
  n'est prescrit (Instr. 030-02-2009 art. 7 ; `STORY-509.md` l. 111-126 ;
  `bilan-service/src/modules/bilan/referentiel/assets/etats-dimf-sfd-bceao-1.0.json` l. 92-100).
- **Destinataires :** trois, avec 5, 2 et 2 exemplaires (l. 114-145).
- **Échéance :** clôture + 6 mois (l. 101-112).
- **Portée :** zone `BCEAO-SFD`, 8 pays (l. 8-18).
- **Arbitrage PO du 2026-09-19 :** états codés + régime ; le rendu imprimable signable part en story
  dédiée (`STORY-509.md` l. 154-158).
- **Exposition :** le régime est porté par le service de production, sans aucune route
  (`etats-dimf-production.service.ts` l. 89-98 ; `STORY-509.md` l. 225-228).

**M6 — Le régime CIMA est aussi `DEPOT_PHYSIQUE`.** STORY-523 est `done` depuis le 2026-09-22
(`sprint-status.yaml` l. 3887-3888).

- **Support :** 3 exemplaires certifiés par le président du CA ou le DG, au Ministre et à la
  Commission de contrôle des assurances ; aucun format prescrit (art. 425 ; `STORY-523.md`
  l. 115-129 ; `etats-cima-1.0.json` l. 33-41 et 56-87).
- **Échéance :** assemblée générale + 30 jours, au plus tard le 1er juin (`ASSEMBLEE_PLUS_JOURS`,
  l. 42-55). Le contrat de 536 ne sait pas l'exprimer.
- **Portée :** 14 pays (l. 9-24).
- **Garde du jalon** reformulée : « gabarit imposé **ou** norme de contenu identifiée » (M3 et
  D-523-3, `STORY-523.md` l. 68-83 et 157-158 ; `etats-cima.types.ts` l. 46-60).

**M7 — ⛔ STORY-523 M6 confond le régime et la doctrine.** STORY-523 (l. 126-129) et
`referentiels/README-etats-cima.md` (l. 93 et 111-112) appellent `DEPOT_PHYSIQUE` « la doctrine
de dépôt unique ». Or le fiscal togolais n'est pas un dépôt papier : les états financiers vont au
**GUDEF** (LPF art. 17) et les déclarations sur **dimana** (`STORY-561.md` l. 71-79 ;
`STORY-565.md` l. 47-57). Le PRD décrit le GUDEF comme un portail web authentifié
(`prd-fiscalite` §3.2, `prd.md` l. 89-105).

**M8 — Le dépôt automatisé a été décidé par le PO le 2026-08-28** (`STORY-561.md` l. 7-10).

- Le connecteur est déclaré par pays, et le repli sur l'assisté reste toujours ouvert (l. 44-51).
- *« Il n'existe aucun état où déclarer devient impossible »* (l. 53-54).
- *« Le produit ne détient toujours pas le dernier maillon »* (l. 142-144).

Cette décision lève la réserve du PRD fiscalité §3.2. STORY-560, 561, 562 et 565 sont toutes
`ready-for-dev`.

**M9 — ⛔ Le jalon togolais est dit levé, mais il ne l'est pas au dépôt.**

- `sprint-status.yaml` annonce « JALON FORMAT CONFIRMÉ LEVÉ LE 2026-08-28 » pour STORY-330 à 333
  (l. 4785 et suivantes).
- STORY-537 est « débloquée » (l. 9-11), mais son AC-1 « gabarit versé au dépôt » n'est pas coché
  (l. 57-58). L'analyse §9 dit que « son gabarit officiel n'est pas encore au dépôt » (l. 334-335).
- Mesure : `git ls-files` ne trouve aucun `.xlsx` dans `docs`, `fiscal-service`, `bilan-service`,
  `balance-service` ni `dossier-service`, et `referentiels/` ne contient aucune fiche e-DSF.
- L'accusé, le rejet et le parcours sont cochés `☐` au récapitulatif
  (`demande-pieces-fiscales-2026-08-03.md` l. 213-217).
- Or le jalon exige le gabarit, le parcours **et** l'accusé (PRD §9, `prd.md` l. 612-614 ;
  EPIC-032, `epics-fiscalite-2026-08-03.md` l. 270-271).

**M10 — Le régime varie selon l'état, pas selon le vertical.**

- Les indicateurs périodiques des SFD (Instr. 020-12-2010) sont en électronique obligatoire pour
  l'art. 44 (`referentiels/README-etats-dimf-sfd-bceao.md` l. 84-91).
- Le paquet fiscal togolais publie une échéance de dépôt DSF propre aux assurances : 31-05, source
  `A_CONFIRMER` (`balance-service/src/modules/referentiel/assets/paquet-fiscal-togo-2026.json`
  l. 285-291).

⇒ Un même dossier peut devoir plusieurs dépôts, sous des régimes différents.

**M11 — STORY-539 contredit STORY-509 sur la périodicité.** STORY-539 (l. 27) parle d'un « état DIMF
**trimestriel** ». Or les DIMF sont **annuels** (`STORY-509.md` l. 91-96 et 208 ;
`README-etats-dimf-sfd-bceao.md` l. 84-97). De plus, l'AC-1 de STORY-539 (l. 33-34) calcule
l'échéance depuis les bornes de l'exercice, alors que l'échéance CIMA part de l'assemblée générale
(M6).

**M12 — Les « 40 % » sont un palier, pas un taux unique.** LPF art. 121 : en cas de taxation d'office
pour défaut de déclaration dans les délais, la majoration est de 30 %. Elle est portée à 40 % faute
de régularisation dans les quinze jours de la notification
(`referentiels/corpus-justificatif-fiscal-togo.json` l. 287-290).

**M13 — Aucun des deux relevés papier ne mentionne de numéro d'accusé ni de procédure de rejet.**
« accus » et « rejet » ont zéro occurrence dans `README-etats-dimf-sfd-bceao.md` et dans
`README-etats-cima.md`.

⇒ **La doctrine est écrite dans
[`doctrine-depot-2026-09-22.md`](../doctrine-depot-2026-09-22.md).** Elle reprend M1 à M13 : le
§3 définit le régime comme une donnée, le §4 corrige quatre énoncés de la doctrine d'origine, le §5
définit le jalon, le §7 liste les écarts de contrat et le §8 donne le découpage avec les statuts
réels.

---

## Ce qui a été tranché — conservé pour la traçabilité

**Q1 — Prospera produit-il le fichier de télédéclaration, ou s'arrête-t-il à la liasse que le
cabinet dépose lui-même ?**

- **Voie A — le produit dépose.** N pays = N intégrations, N formats, N calendriers, N évolutions
  annuelles à suivre. **Aucune n'est chiffrée aujourd'hui.** C'est le poste de coût caché le plus
  lourd du programme international.
- **Voie B — le produit produit la liasse et trace le dépôt.** Parfaitement défendable : c'est ce
  que fait la majorité des outils de production comptable, et le cabinet dépose lui-même. ⚠️ **Mais
  il faut le DIRE** — un cabinet suppose la voie A tant qu'on ne lui dit rien.

⚡ **Et la question se pose TROIS fois dans le programme** : ici (fiscal), à **STORY-509** (états DIMF
d'une IMF) et à **STORY-523** (états annuels CIMA). **Une seule doctrine doit valoir pour les
trois** — trois doctrines de dépôt dans un même produit seraient incompréhensibles pour le cabinet
qui tient les trois types de dossiers.

## Critères d'acceptation *(applicables une fois Q1 tranchée)*

- [x] AC-1 — La doctrine retenue est **écrite** et s'applique aux trois verticaux ; STORY-509 et
      STORY-523 la citent au lieu de la re-poser.
      *Preuve :* la doctrine est écrite dans `doctrine-depot-2026-09-22.md` et couvre les trois
      verticaux (§3). STORY-509 et STORY-523 la citent dans leurs *Notes* **et à l'endroit même où
      elles la re-posaient** : STORY-523 M6, STORY-509 (« le fichier déposable ») et
      `README-etats-cima.md` §5 portent un renvoi daté qui **requalifie** le passage (régime ≠
      doctrine) — une annotation, pas une réécriture : le texte d'origine reste lisible, c'est la
      mesure qui a nourri la doctrine (M7).
- [x] AC-2 — Sous **voie B** : l'écran dit **explicitement** que le dépôt est à la charge du cabinet,
      partout où une liasse est figée. Doctrine FE-073 — dire ce qu'on ne fait pas est une
      information ; laisser croire qu'on le fera est une promesse.
      ***Sans objet** — la voie A a été retenue par le PO le 2026-08-28 (analyse §9, l. 320).* Ce
      critère est coché comme non applicable, et non comme réalisé : aucun écran n'a été touché. Son
      motif reste valable pour tout couple non servi (doctrine §2).
- [x] AC-3 — Sous **voie A** : chaque pays est **une story avec son jalon `format confirmé`**, et
      aucune n'est promise avant que son gabarit officiel ne soit au dépôt.
      *Preuve :* la doctrine fixe l'unité d'intégration au couple (juridiction, état) (§4, C3) et
      définit le jalon (§5). Le seul couple fiscal ouvert, Togo × DSF, est STORY-537, dont le jalon
      est l'AC-1, **non levé** (M9). UMOA × DIMF et CIMA × art. 422 ont levé leur jalon au dépôt
      (STORY-509, STORY-523). Aucun couple n'est promis : le manifeste est vide et les 23 pays sont
      `non-servi` (M4).
- [x] AC-4 — Dans les deux cas, **STORY-446** (état `DEPOSE` + accusé) est livrée : tracer un dépôt
      est utile quelle que soit la voie, et **FE-081 est bloquée dessus** depuis sa création.
      *Preuve :* STORY-446 est `done` depuis le 2026-09-03, et son code est sur `dev` dans
      `bilan-service` et `dossier-service` (M1). ⚠️ FE-081 reste marquée `blocked` sur ce bloqueur
      pourtant levé (M3). Mettre à jour son statut front sort du périmètre de cette story.

## Hors périmètre

- ⛔ **Les intégrations** : STORY-537 (e-DSF Togo), STORY-538 (transmission, accusé, rejet),
  STORY-539 (calendrier), et tout futur couple (juridiction, état). Elles se chiffrent une par une et
  n'entrent **jamais** dans ces 8 points.
- Le connecteur automatisé et son mandat : STORY-560, 561, 562 et 565.
- Le rendu imprimable signable des états DIMF et CIMA, qui a sa story de présentation dédiée
  (arbitrage PO du 2026-09-19).
- La convergence des trois formes de régime (`PaquetDepot`, `DepotDimf`, `DepotCima`) vers le contrat
  de STORY-536 : les écarts sont nommés au §7 de la doctrine, pas comblés ici.
- La mise à jour des statuts périmés : FE-081, FE-095, l'en-tête de STORY-538 et la note « jalon
  levé » des STORY-330 à 333.
- L'approbation par le client avant dépôt (FE-081).

## Notes

- Voir [[FE-081]], [[STORY-446]], [[STORY-453]] (l'échéance opposable), [[STORY-509]], [[STORY-523]].
- Doctrine écrite : [`doctrine-depot-2026-09-22.md`](../doctrine-depot-2026-09-22.md).

## Progress Tracking

- **2026-09-22 — cadrage mesuré** (M1 à M13) : lecture de STORY-446, 509, 523, 536, 537, 538, 539,
  560, 561, 565, FE-081, FE-034 (ses seules mentions du dépôt) et EPIC-032, et relecture de leurs
  statuts dans `sprint-status.yaml`.
  Le code a été vérifié sur `dev` dans six services. Constats principaux :
  - STORY-446 est livrée, mais trois documents la disent encore non livrée ;
  - le régime papier est mesuré deux fois (IMF, CIMA), et STORY-523 l'a appelé « doctrine » ;
  - le jalon togolais est annoncé levé sans pièce au dépôt ;
  - le contrat de STORY-536 ne sait encore porter aucun des deux régimes papier.
- **2026-09-22 — doctrine écrite** dans `doctrine-depot-2026-09-22.md` : la décision (voie A,
  2026-08-28, trois verticaux), ce que « déposer » recouvre selon le régime (téléservice ou dépôt
  physique signé), quatre énoncés de la doctrine d'origine corrigés sur la mesure, la définition du
  jalon `format confirmé` (avec l'évolution D-523-3), les trois conséquences reformulées, les écarts
  de contrat, le découpage avec les statuts réels, et ce que le document ne fait pas.
- **2026-09-22 — STORY-509 et STORY-523** : une ligne de renvoi ajoutée dans leurs *Notes*, et rien
  d'autre (ce sont des stories livrées).
- **Vérification docker : sans objet.** Story de cadrage : aucun code, aucune écriture en base, aucun
  événement.
- Branche `MNV-525` du dépôt `docs`.
- 2026-09-22 — **vérification par la session du travail délégué** (un rapport de sous-agent n'est pas
  une preuve) — rejoué, pas lu :
  - la DSF togolaise n'est versée dans **aucun** dépôt : `git ls-files` rend **0** `.xlsx` dans `docs`,
    `fiscal-service`, `bilan-service`, `balance-service`, `dossier-service` — la pièce est citée par
    dix documents, jamais committée (M9 tient) ;
  - la pièce ③ du jalon (parcours + accusé) n'est **pas** une invention de la doctrine : EPIC-032,
    `epics-fiscalite-2026-08-03.md` l. 270-271, exige *« pièce réelle en main (accusé, gabarit, parcours
    de dépôt) »* ;
  - le §9 de l'analyse dit bien *« son gabarit officiel n'est pas encore au dépôt »* (M9).
- 2026-09-22 — **AC-1 fermé par annotation** : les deux passages qui re-posaient la doctrine
  (STORY-523 M6, STORY-509 « le fichier déposable ») et `README-etats-cima.md` §5 portent un renvoi
  daté vers la doctrine. Rien n'est effacé. AC-1 à AC-4 cochés, chacun avec sa preuve.
- 2026-09-22 — statut `ready-for-dev` → `review`. ⚠️ **Statuts périmés relevés, non corrigés ici** (hors
  périmètre, signalés à l'utilisateur) : FE-081 et FE-095 `blocked` sur une STORY-446 livrée ; l'en-tête
  de STORY-538 ; la note « jalon levé » de STORY-330 à 333 ; STORY-539 l. 27 (« DIMF trimestriel »).
