# Le dépôt — une doctrine pour les trois verticaux · **document de doctrine**

> **Date :** 2026-09-22 · **Statut :** doctrine — livrable de cadrage de [[STORY-525]] ; **pas une story
> d'intégration**, pas une architecture
> **Décision appliquée :** arbitrage PO du **2026-08-28** — **VOIE A, le produit dépose**
> (`analyse-scalabilite-multireferentiel-2026-08-27.md` §9, l. 318-335 ; `stories/STORY-525.md` l. 33-53)
> **Portée :** fiscal ([[STORY-525]], EPIC-032) · microfinance ([[STORY-509]], EPIC-127) · assurance
> ([[STORY-523]], EPIC-134)
> **Pourquoi ce document :** la doctrine a été énoncée dans STORY-525 le 2026-08-28, puis **redite** par
> les deux verticaux réglementés à mesure qu'ils mesuraient leur texte. L'un d'eux l'a redite avec un
> contenu qui ne vaut que pour lui (§4, C1). L'AC-1 de STORY-525 demande de **l'écrire une fois** pour
> que les trois la citent.

---

## 1. Le constat, vérifié le 2026-09-22

Les statuts viennent de `sprint-status.yaml`. Le code a été lu sur `dev` dans chaque service ; les
arbres étaient propres et `HEAD` = `origin/dev`.

| Ce qui existe | Statut réel | Ce que ça couvre, mesuré | Source |
|---|---|---|---|
| **STORY-446** — état `DEPOSE` + accusé | `done` le 2026-09-03 | un dépôt **constaté** : date, canal en texte libre, n° d'accusé, signataire, `snapshotId`. *« Rien n'est déposé par le produit »* | `sprint-status.yaml` l. 3218-3219 · `bilan-service` `jeu-etats.enums.ts` l. 16-26, `jeu-etats.controller.ts` l. 506 · `dossier-service` `avancement.enum.ts` l. 68 |
| **STORY-536** — paquet de dépôt | `done` le 2026-09-19 | contrat + registre, **manifeste vide** : aucun pays n'est servi pour le dépôt | l. 3973-3974 · `fiscal-service` `contrat-paquet-depot.ts` l. 1-56, `assets/manifeste.json` · `dossier-service` `paquets-packages.miroir.ts` l. 221 |
| **STORY-509** — états DIMF | `done` le 2026-09-19 | gabarit DIMF + **régime de dépôt sourcé** (`DEPOT_PHYSIQUE`) ; hook inerte, aucune route | l. 3772-3773 · `bilan-service` `etats-dimf-sfd-bceao-1.0.json` l. 91-182 |
| **STORY-523** — catalogue CIMA | `done` le 2026-09-22 | 46 états + **régime de dépôt sourcé** (`DEPOT_PHYSIQUE`) | l. 3887-3888 · `bilan-service` `etats-cima-1.0.json` l. 32-96 |
| **STORY-537 / 538 / 539** | `ready-for-dev` | e-DSF Togo · cycle transmis / accepté / rejeté · calendrier | l. 3982, 3989, 3996 |
| **FE-081** — écran du dépôt | `blocked` | bloquée sur STORY-446, **qui est livrée depuis le 2026-09-03** | `frontend-sprint-status.yaml` l. 567 · `FE-081.md` l. 3, 7, 65-69 |

⇒ **Aujourd'hui, le produit trace le dépôt d'une liasse, mais il ne produit aucun livrable
déposable, dans aucun des trois verticaux.** Les deux verticaux réglementés ont livré le **régime**
(sourcé, packagé, vérifié par empreinte), mais pas le livrable.

## 2. La décision

**VOIE A : le produit dépose.** Le PO l'a arbitrée le 2026-08-28 pour les trois verticaux à la
fois. Une doctrine par vertical serait illisible pour le cabinet qui tient les trois types de
dossiers (STORY-525 l. 220-223).

La voie A ne se distingue pas de la voie B par la personne qui appuie sur le bouton. Elle s'en
distingue par deux engagements : **le livrable exact exigé par l'administration est une production
du produit** (sourcée, versionnée, opposable), et **le cycle de vie du dépôt** (transmis, accusé,
rejeté) est porté par le produit jusqu'à son terme. Sous la voie B, le produit s'arrêtait à la
liasse et à la trace (STORY-525 l. 210-218).

L'AC-2 de STORY-525, qui décrit la voie B, est donc **sans objet**. Son motif reste valable : tant
qu'un couple (juridiction, état) n'est pas servi, le produit ne dépose rien pour lui, et il faut le
dire. La donnée pour le dire existe déjà : `depot.statut` du registre pays (STORY-536 AC-4,
`dossier-service` `registre-pays.ts` l. 142-147).

## 3. Ce que « le produit dépose » recouvre, selon le régime mesuré

⛔ **Le régime de dépôt n'est pas une doctrine. C'est une donnée**, mesurée sur le texte et déclarée
**par couple (juridiction, état)** dans un paquet. La doctrine, elle, dit ce que le produit doit à
chaque régime.

Deux régimes sont mesurés à ce jour.

| | **Téléservice** | **Dépôt physique signé** |
|---|---|---|
| **Où il est mesuré** | fiscal, Togo : états financiers au **GUDEF** (LPF art. 17) ; déclarations d'impôts sur **dimana** | IMF, UMOA : Instr. BCEAO n°030-02-2009 **art. 6-7** · assurance, CIMA : Code CIMA **art. 425** |
| **Sources** | STORY-561 l. 71-79 · STORY-565 l. 47-57 · PRD fiscalité §3.2 (`prd.md` l. 89-105) | STORY-509 l. 113-126 · STORY-523 l. 115-129 · `referentiels/README-etats-dimf-sfd-bceao.md` §2 · `referentiels/README-etats-cima.md` §5 |
| **L'acte légal** | une **transmission** sur un portail authentifié | une **remise papier**, signée (SFD : personne accréditée ou commissaire aux comptes) ou certifiée (CIMA : président du CA ou DG), en plusieurs exemplaires à plusieurs destinataires |
| **Format de fichier prescrit** | celui du canal : classeur DSF de 92 feuilles (pièce réelle, STORY-537 l. 9-21) | **aucun**. SFD : l'électronique vient seulement « en complément » (art. 7). CIMA : aucun (art. 425) |
| **Ce que le produit produit** | le fichier au format exact du canal | les états **conformes au gabarit**, prêts à imprimer et à signer. Le rendu imprimable fait l'objet d'une story dédiée (arbitrage PO du 2026-09-19, STORY-509 l. 154-158) |
| **Qui accomplit l'acte** | **le cabinet, guidé** (dépôt assisté). **Ou un connecteur**, si le paquet du pays en déclare un et qu'il est utilisable ; le **repli sur l'assisté** reste toujours ouvert (décision PO du 2026-08-28, STORY-561 l. 44-54) | **toujours le signataire désigné par le texte**. Le produit ne signe pas et ne certifie pas |
| **Ce que le produit trace** | transmis, puis accusé ou rejet (STORY-538) | un dépôt **déclaré par l'utilisateur**, avec le même cycle de vie (STORY-538 AC-6, l. 44-46) |

⚡ **Le régime varie selon l'état, pas selon le vertical.** Dans le seul vertical IMF, le papier est
obligatoire pour les états DIMF, alors que l'électronique est obligatoire pour les **indicateurs
périodiques** (Instr. n°020-12-2010) des SFD de l'article 44 (`README-etats-dimf-sfd-bceao.md`
l. 84-91). Un même dossier cumule aussi des dépôts de régimes différents : le paquet fiscal togolais
publie une échéance de dépôt DSF propre aux assurances (31-05, source `A_CONFIRMER`, `balance-service`
`paquet-fiscal-togo-2026.json` l. 285-291), distincte du dossier de l'art. 425. C'est pour cela que
le régime se déclare dans le paquet `(juridiction, état)`, et jamais dans le vertical ni dans le code.

⇒ **Sous la voie A, quel que soit le régime, le produit doit deux choses et s'en interdit une :**

1. **le livrable exact** que le régime exige : le fichier du canal, ou le document conforme au
   gabarit, prêt à signer ;
2. **le cycle de vie du dépôt avec sa preuve** : accusé, rejet, retransmission, jusqu'à l'échéance ;
3. ⛔ **jamais l'acte que le texte réserve à une personne.** Le produit ne signe pas et ne certifie
   pas. Il ne transmet au nom du client que par un connecteur déclaré, sous mandat (STORY-560), avec
   un repli.

## 4. Ce que la mesure a corrigé dans la doctrine écrite le 2026-08-28

Les stories livrées après l'arbitrage ont mesuré quatre choses que le texte de STORY-525 ne pouvait
pas connaître. Une doctrine qui les ignorerait serait fausse. **La voie A reste la décision** ; ce qui
change, c'est ce que « déposer » recouvre.

**C1 — « La doctrine de dépôt unique existe déjà : `DEPOT_PHYSIQUE` »** (STORY-523 M6, l. 126-129 ;
`README-etats-cima.md` l. 93 et 111-112). C'est vrai pour l'IMF et pour l'assurance, mais **faux pour
le fiscal** : le Togo dépose sur un téléservice. Deux verticaux sur trois partagent un **régime** ; la
**doctrine**, elle, est la voie A. ⇒ Le §3 requalifie ce passage. STORY-523 est une story livrée et
n'est pas réécrite.

**C2 — « Un cabinet qui dépose par Prospera ne peut plus déposer autrement le jour de l'échéance »**
(STORY-525 l. 40-41). La décision PO du même jour sur l'automatisation l'a précisé : *« il n'existe
aucun état où déclarer devient impossible »*. Le connecteur est un accélérateur et le repli assisté
reste ouvert (STORY-561 l. 53-54). Le produit *« ne détient toujours pas le dernier maillon »*
(l. 142-144). Dans les régimes papier, l'acte appartient au signataire. ⇒ **L'engagement de
disponibilité porte sur le livrable et sur le cycle de vie.** Un cabinet qui a confié à Prospera la
production de son livrable n'en a pas d'autre de prêt le jour de l'échéance. Un livrable faux ou un
rejet non vu lui coûte la majoration.

**C3 — « Chaque pays est une intégration »** (STORY-525 l. 44). C'est vrai pour le fiscal, où
chaque administration a son portail et son classeur. **Ce n'est pas vrai pour les deux autres
verticaux** : le régime DIMF est posé par une instruction BCEAO qui vaut pour **8 pays**
(`etats-dimf-sfd-bceao-1.0.json` l. 8-18), et le régime CIMA par un Code qui vaut pour **14 pays**
(`etats-cima-1.0.json` l. 9-24). Chacun n'a donné lieu qu'à un seul relevé. ⇒ **L'unité
d'intégration est le couple (juridiction de dépôt, état)** : la juridiction est le pays pour le
fiscal, la zone pour l'UMOA et la CIMA.
⚠️ Des canevas électroniques **nationaux** sont rapportés côté SFD (Côte d'Ivoire, Bénin, Sénégal),
mais aucun fichier ni texte fondateur n'a été trouvé (`README-etats-dimf-sfd-bceao.md` l. 209-215).
Ils ne comptent pas tant qu'ils ne sont pas au dépôt. S'ils y entrent un jour, ils deviennent des
juridictions nationales qui **s'ajoutent** à la zone.

**C4 — « Aucun pays n'est promis avant que son gabarit officiel ne soit au dépôt »** (STORY-525
l. 44-46). L'état C11 de la CIMA **n'a pas de gabarit et n'en aura jamais** : *« la présentation de
l'état C11 est laissée à l'initiative de chaque entreprise »* (STORY-523 M3, l. 68-83). Appliquée à
la lettre, la garde bloquait donc pour toujours. ⇒ Le §5 la redéfinit sur la base de D-523-3.

Deux précisions de moindre portée :

- **« Au Togo, une échéance manquée coûte 40 % »** (STORY-525 l. 51-53). Le LPF art. 121 prévoit une
  majoration de **30 %** en cas de taxation d'office pour défaut de déclaration dans les délais. Elle
  est **portée à 40 %** si la situation n'est pas régularisée dans les quinze jours qui suivent la
  notification (`referentiels/corpus-justificatif-fiscal-togo.json` l. 287-290). Le chiffre de 40 %
  est donc le palier final, pas un taux unique. Le paquet de dépôt porte le barème du texte
  (`penalites[]`, contrat l. 51-55), pas un chiffre résumé.
- **Aucun des deux relevés papier ne mentionne de numéro d'accusé ni de procédure de rejet.** Les
  mots « accus » et « rejet » n'apparaissent dans aucune des deux fiches de référence. Le cycle de
  vie unique de STORY-538 (AC-6) s'applique sans supposer qu'il en existe.

## 5. Le jalon `format confirmé` : sa définition

Un couple (juridiction, état) franchit le jalon quand **les pièces qu'exige son régime sont au
dépôt**. « Au dépôt » veut dire : relevées dans une fiche de référence versionnée, sourcées (texte,
article, date de relevé) et adossées à une empreinte sha256. C'est le patron de STORY-509 AC-1 : on
committe l'URL et le sha256 quand le PDF est trop lourd pour être committé.

| Pièce | Exigée pour | Origine |
|---|---|---|
| **① la forme** : le **gabarit imposé**, **ou** la **norme de contenu identifiée** quand le régulateur a délégué la présentation | tous les régimes | EPIC-032 et PRD fiscalité §9 ; élargie par **D-523-3** (STORY-523 l. 157-158) |
| **② le régime de dépôt**, article par article : canal, destinataires et exemplaires, calendrier, signataire, majorations | tous les régimes | STORY-509 (Instr. 030-02-2009 art. 6-8) · STORY-523 (art. 425) |
| **③ le parcours réel** : captures d'écran et un **accusé** réel ; si possible une **déclaration rejetée** avec son motif | le **téléservice** seulement | PRD fiscalité §9 (`prd.md` l. 612-614) · EPIC-032 (`epics-fiscalite-2026-08-03.md` l. 270-271) |

⛔ **Un gabarit reconstitué, résumé ou « vraisemblable » ne lève rien.** Les deux erreurs déjà
payées par le programme (acomptes trimestriels, RSL à 10 %) étaient plausibles (STORY-537 l. 43-53).

### Où en est chaque couple au 2026-09-22

| Couple | ① forme | ② régime | ③ parcours | Jalon |
|---|---|---|---|---|
| UMOA × DIMF 2000 / 2080 | ✅ fiche + sha256 (STORY-509) | ✅ art. 6-8 | sans objet (papier) | **levé** le 2026-09-19 |
| CIMA × états de l'art. 422 | ✅ dont le C11 par sa norme de contenu (STORY-523) | ✅ art. 425 | sans objet (papier) | **levé** le 2026-09-22 |
| Togo × DSF (GUDEF) | ⚠️ pièce réelle **fournie** le 2026-08-28 (STORY-537 l. 9-11), mais **non versée** : aucun `.xlsx` suivi dans les dépôts `docs`, `fiscal-service`, `bilan-service`, `balance-service` et `dossier-service`, et aucune fiche e-DSF dans `referentiels/` | ⚠️ partiel : canal nommé (GUDEF, LPF art. 17), échéances publiées par le paquet fiscal (`balance-service`, l. 273-300, en partie `A_CONFIRMER`) ; adresse et écrans « se relèvent sur le portail » (STORY-561 l. 79), et aucun paquet de dépôt n'est packagé | ❌ accusé, rejet et parcours cochés `☐` (`demande-pieces-fiscales-2026-08-03.md` l. 213-217) | **non levé** : c'est l'AC-1 de STORY-537 |

⚠️ `sprint-status.yaml` annonce ce jalon **« levé le 2026-08-28 »** pour les STORY-330 à 333 (l. 4785
et suivantes). Selon la définition ci-dessus, il ne l'est pas : la pièce existe, mais elle n'est pas
au dépôt, et la pièce ③ manque. Le §9 de l'analyse (l. 334-335) et l'AC-1 non coché de STORY-537
disent la même chose que ce document.

## 6. Les trois conséquences non négociables, reformulées sur la mesure

1. ⛔ **Chaque couple (juridiction, état) est une intégration, avec son jalon `format confirmé`
   (§5).** Aucun couple n'est promis, ni déclaré `servi` pour le dépôt, avant son jalon. Le registre
   pays ne dérive la capacité de dépôt **que** des paquets réellement packagés (STORY-536 AC-4,
   `registre-pays.ts` l. 142-147).
2. ⛔ **Le régime et le format sont packagés et versionnés, jamais codés.** Un dépôt porte la
   version de format qui l'a produit (STORY-536 AC-3, `ReferenceFormatDepot`, contrat l. 1-13). C'est
   déjà vrai des trois verticaux : les régimes DIMF et CIMA sont des artefacts vérifiés par sha256.
   ⚠️ En revanche, **trois formes coexistent** : `PaquetDepot`, `DepotDimf` et `DepotCima`. Leur
   écart est détaillé au §7.
3. ⛔ **Un dépôt peut être rejeté, et un rejet ne clôt rien** (STORY-538 AC-3 et AC-4). L'échéance
   continue de courir, et le motif est conservé tel que l'administration l'a rendu.

## 7. Ce que le contrat commun ne porte pas encore : écarts mesurés, non traités ici

STORY-536 annonce un contrat qui « couvre les trois verticaux » (STORY-536 l. 78-79). Confronté aux
deux régimes papier désormais mesurés, il ne peut encore en porter **aucun** :

| Contrat `PaquetDepot` (`fiscal-service`) | Ce que les régimes mesurés exigent |
|---|---|
| `calendrier.regle.type` = `CLOTURE_PLUS_MOIS` seul (contrat l. 43-50, 138) | CIMA : **assemblée générale + 30 jours, au plus tard le 1er juin** (`ASSEMBLEE_PLUS_JOURS`, `etats-cima-1.0.json` l. 42-55). L'échéance ne se déduit pas des bornes de l'exercice, contrairement à ce que suppose STORY-539 AC-1 (l. 33-34) |
| un seul `canal`, une seule `adresse` (l. 38-42) | SFD : **3 destinataires**, avec 5, 2 et 2 exemplaires (`etats-dimf-sfd-bceao-1.0.json` l. 114-145). CIMA : le Ministre et la Commission de contrôle, 3 exemplaires chacun, plus 5 exemplaires du compte rendu annuel de l'art. 423 (source : art. 424) (`etats-cima-1.0.json` l. 56-87) |
| `gabarit` non vide, au moins une case poste → case (l. 102-104) | CIMA : C11 `LIBRE` ; G5 et G12 à G15 `NARRATIF` (`etats-cima.types.ts` l. 46-60) |
| `pays` en ISO alpha-2 (l. 72) | régimes de **zone** : 8 pays pour l'UMOA, 14 pour la CIMA (C3) |
| aucun champ pour le signataire ni pour la formule de certification | CIMA art. 425 : certification par le président du CA ou le DG, avec une formule imposée (`etats-cima-1.0.json` l. 35) |

Le fait constaté de STORY-446 a lui aussi été modélisé sur le dépôt fiscal. `numeroAccuse` y est
obligatoire (`deposer-liasse.dto.ts` l. 181), et le signataire doit être inscrit à un **ordre
professionnel** (`numeroOrdre`, l. 51-96). Or les régimes papier désignent un signataire qui peut ne
pas l'être (président du CA, DG, personne accréditée pour engager le SFD), et aucun des deux relevés
ne mentionne de numéro d'accusé (§4).

⇒ Aujourd'hui, les régimes papier vivent dans leurs propres artefacts (`bilan-service`), et **aucun
pays n'est servi pour le dépôt, dans aucun vertical**. C'est exact, puisque le produit ne produit
encore aucun livrable. **La convergence est une dette nommée**, à porter par la story qui inscrira le
premier régime papier au registre de dépôt. Ce document n'en crée aucune.

## 8. Le découpage, avec le statut réel au 2026-09-22

| Story | Objet | Statut | Remarque mesurée |
|---|---|---|---|
| **STORY-525** | la doctrine (ce document) | `ready-for-dev` | statut tenu par la session |
| **STORY-446** | état `DEPOSE` + accusé : la trace d'un dépôt constaté | ✅ `done` le 2026-09-03 | FE-081 n'a plus de bloqueur backend (446, 452 et 453 sont `done`) |
| **STORY-536** | contrat et registre du paquet de dépôt | ✅ `done` le 2026-09-19 | manifeste vide ; écarts de contrat au §7 |
| **STORY-537** | e-DSF Togo, 1ᵉʳ couple fiscal | `ready-for-dev` | jalon = son AC-1, **non levé** (§5) ; 13 points = borne, pas estimation |
| **STORY-538** | transmis, accepté, rejeté | `ready-for-dev` | son en-tête dit encore 446 « non livrée » (l. 8) : périmé |
| **STORY-539** | calendrier multi-pays et multi-état | `ready-for-dev` | prérequis STORY-532 `ready-for-dev` ; l. 27 parle d'un « état DIMF **trimestriel** », or les DIMF sont **annuels** (STORY-509 AC-4) |
| **STORY-509** | UMOA × DIMF : gabarit et régime | ✅ `done` le 2026-09-19 | régime `DEPOT_PHYSIQUE` ; rendu imprimable en story dédiée |
| **STORY-523** | CIMA × art. 422 : catalogue et régime | ✅ `done` le 2026-09-22 | régime `DEPOT_PHYSIQUE` ; garde du jalon élargie (D-523-3) |

**Nées de la voie A après le 2026-08-28** (décision PO sur l'automatisation, EPIC-032) :
STORY-560 (coffre-fort + mandat), STORY-561 (connecteur + repli), STORY-562 (suivi du parcours et
accusé), STORY-565 (les deux redevables) : toutes `ready-for-dev`.
**EPIC-032 d'origine :** STORY-330 à 339, toutes `not_started`.
**Écrans :** FE-081 `blocked` (bloqueur livré, cf. §1) ; FE-095 `blocked` sur STORY-538.

## 9. Ce que ce document ne fait PAS

- ⛔ Il **ne crée aucune story et n'attribue aucun point.** Les intégrations (537, 538, 539, et tout
  couple futur) se chiffrent une par une, **hors des 8 points de STORY-525**.
- ⛔ Il **ne modifie aucun service**, ni le contrat de STORY-536. Les écarts du §7 sont nommés, pas
  comblés.
- ⛔ Il **ne réécrit pas STORY-509 ni STORY-523**, qui sont livrées. Elles le citent ; leurs passages
  antérieurs sont requalifiés ici (§4, C1), pas effacés.
- ⛔ Il **ne lève aucun jalon.** Il ne déclare levé que ce que la pièce au dépôt prouve.
- ⛔ Il **ne tranche pas l'approbation par le client** avant le dépôt (FE-081, STORY-446 « à instruire
  avec FE-081 »), ni les conditions d'utilisation des portails (STORY-561 AC-9).
- ⛔ Il **ne met à jour aucun statut** (`sprint-status.yaml`, `frontend-sprint-status.yaml`). Les
  statuts périmés relevés ci-dessus (FE-081, FE-095, en-tête de STORY-538, note « jalon levé » des
  STORY-330 à 333) sont signalés, pas corrigés.
- ⛔ Il **ne vaut pas avis juridique.** Les articles sont cités tels qu'ils ont été relevés par les
  stories sources.

---

**Suite attendue :** STORY-537 lève son jalon en versant la DSF togolaise au dépôt (①), puis en
relevant le canal (②) et le parcours (③). La première story qui inscrira un régime papier au
registre de dépôt tranchera les écarts du §7.
