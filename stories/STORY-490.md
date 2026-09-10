# STORY-490 : La devise s'arrête à la balance — la liasse, le prévisionnel, le fiscal et l'export la perdent

Status: done

**Épic :** EPIC-107 — Devise, unités et arrondis (socle d'internationalisation)
**Service :** `bilan-service` + `balance-service` (`modules/fiscal`)
**Points :** 5 · **Complexité :** high · **Assigné à :** vivianMoneyVibesGroupes · **Sprint :** S20
**Prérequis :** **STORY-489** (la devise entre au contrat canonique).
**Origine :** revue **expert-comptable** de la maquette cumulative, 2026-08-27.

---

## Le fait

Une fois la devise portée par la balance, elle doit **traverser** tout ce qui en descend. Aujourd'hui
aucun des quatre consommateurs ne la porte :

| Consommateur | Ce qu'il rend | Ce qui manque |
|---|---|---|
| Liasse (`JeuEtats`) | postes, totaux, cascade | la devise du jeu d'états |
| Prévisionnel / projection | 3 exercices, plan 12 mois | la devise des hypothèses **et** des résultats |
| Fiscal (IS, MFP, TVA, TPU, taxes) | montants et formules | la devise des **seuils du paquet fiscal** |
| Export (FE-038) | PDF / Excel | l'en-tête de devise, obligatoire sur un état financier |

⚡ **Le cas qui rend l'omission grave n'est pas l'affichage, c'est le fiscal.** Un plancher de MFP ou
un plafond de TPU sont des **montants libellés dans la monnaie du pays**. Comparer un chiffre
d'affaires exprimé dans une devise à un seuil exprimé dans une autre ne produit pas une erreur : ça
produit un régime fiscal faux, avec une formule juste et une provenance impeccable. C'est
exactement le patron de STORY-412 (« la provenance rend l'erreur plus difficile à mettre en doute
qu'un chiffre sans provenance »).

## Critères d'acceptation

- [x] AC-1 — `JeuEtats` porte la devise de sa balance source et la rend à chaque lecture, versions
      figées comprises. Une version figée rend **la devise qui était la sienne**, jamais celle du
      dossier à l'instant de la lecture.
- [x] AC-2 — Les hypothèses de prévisionnel et la projection portent la devise ; elle est **héritée**
      de la balance d'ancrage, non saisie. Un plan à trois ans dans une monnaie autre que la balance
      qui l'ancre n'a pas de sens et doit être impossible à exprimer.
- [x] AC-3 — Le moteur fiscal **refuse** (`409 DEVISE_PAQUET_INCOHERENTE`) quand la devise de la
      balance diffère de celle du paquet fiscal appliqué. ⛔ **Il ne convertit pas** : convertir
      demanderait un taux, un taux demande une date et une source, et aucune des deux n'est décidée.
      Refuser est la seule conduite honnête tant que STORY-495 n'est pas rendue.
- [x] AC-4 — L'export porte la devise **en en-tête de chaque état**, comme l'exige la présentation
      d'états financiers. Un bilan sans mention de monnaie n'est pas un bilan opposable.
- [x] AC-5 — Aucune conversion nulle part dans cette story. Un test le prouve : aucun taux, aucun
      arrondi de change, aucune multiplication entre deux montants de devises différentes.

## Conséquences ailleurs

- **FE-082** consomme la devise servie plutôt que d'écrire « F CFA ».
- ⚠️ Le prototype affiche « F CFA » 60 fois et « unités mineures XOF » dans son texte de contrat :
  les deux doivent tomber en même temps que cette story, sinon l'écran contredit le service.

## Notes

- Voir [[STORY-489]], [[STORY-493]] (les montants du paquet fiscal), [[STORY-495]] (le change).

---

## Requalification (2026-09-10, avant la première ligne de code)

### R-490-1 — ⚡⚡ AC-3 est une garde **LATENTE** aujourd'hui, et ce fait doit être écrit, pas caché

`DEVISES_SUPPORTEES = ['XOF']` (`profil-societe/types/profil-societe.ts`) : la comptabilité d'un
dossier **ne peut être tenue qu'en francs CFA**. STORY-489 a fermé la porte d'écriture des deux
côtés — une balance qui déclare sa devise doit coïncider avec celle du dossier (`DEVISE_INCOHERENTE`),
et la devise du dossier doit être tenue (`DEVISE_DOSSIER_NON_TENUE`). Côté paquet fiscal, la seule
source est `BundledArtifactSource` : les artefacts sont **embarqués dans l'image**, et le seul paquet
packagé (`togo@2026`) déclare `_meta.devise = "XOF"`.

⇒ **Aucune requête HTTP ne peut aujourd'hui faire diverger les deux devises.** Le refus d'AC-3 est
donc **inatteignable par l'API** : c'est un filet posé pour le jour où l'une des deux portes s'ouvre
(STORY-492/493 packagent un pays hors zone franc, ou `DEVISES_SUPPORTEES` s'élargit).

⛔ **Conséquence sur la preuve** : la garde se prouve par **test unitaire et test de service**, sur
une balance et un paquet fabriqués divergents — **jamais** par un e2e ni par la vérification docker,
qui ne peuvent pas l'atteindre. Écrire « vérifié en docker » sur cette garde serait une fausse
assurance (patron **STORY-426** : un statut documenté « jamais bloquant » qui bloquait en code depuis
trois mois, parce qu'aucun cas ne le produisait).

### R-490-2 — la devise est déjà nommée à l'export **CSV** de `balance-service`, et elle y vient du **PAQUET**

`fiscal/export-liasse.regles.ts` (STORY-416) titre déjà sa colonne `Montant (${empreinte.devise})`,
où `empreinte.devise` est **`paquetFiscal.meta.devise`**. Les montants de cette colonne, eux, viennent
de la **balance**.

⇒ Ce fichier est la démonstration concrète du défaut qu'AC-3 ferme : le jour où les deux devises
divergent, il **étiquette des montants de la balance avec la monnaie du paquet**, sans une ligne
d'erreur. Ce n'est pas l'export d'AC-4 (celui-ci est FE-038, le PDF/Excel de `bilan-service`) : les
deux exports restent distincts, et cette story ne touche pas le CSV.

### R-490-3 — le sixième chemin balance × paquet est **hors du module `fiscal`**

L'en-tête de la fiche dit « `balance-service` (`modules/fiscal`) ». C'est **incomplet**.
`profil-societe/regime/regime.service.ts` compare le **chiffre d'affaires d'une balance** aux
**seuils du paquet fiscal** (`plafondCA`, `smtCaMax`, via `montantPositifDuPaquet`) pour **proposer
le régime** — donc pour décider entre TPU et IS. C'est le chemin dont l'erreur est la plus grave, et
c'est exactement le mot de la fiche : *« ça produit un régime fiscal faux »*.

⇒ Périmètre d'AC-3 élargi à **six** sites d'appel, dans **deux** modules. Cf. D-490-3.

### R-490-4 — AC-2 a un précédent exact, et il est bon : `HypothesesBase.dureeMois`

STORY-468 a posé le patron demandé par AC-2 (« héritée de la base d'ancrage, **non saisie** ») :
`HypothesesBase` **capture** la valeur à la création du jeu d'hypothèses au lieu de la relire à
chaque projection, « c'est ce qui rend une projection reproductible ». `devise` suit le même chemin,
et pour la même raison.

---

## Arbitrages de cadrage

### D-490-1 — ⚡⚡ la devise voyage par **KAFKA**, pas par le corps de `POST /bilan/etats`

`bilan-service` ne lit jamais la balance de `balance-service` : il en tient un **read-model de
métadonnées** (`balances_balance`, STORY-381 voie A′) alimenté par `balance.created` et
`balance.etat.document.change`, et les **soldes** arrivent par le corps du POST. La devise est une
**métadonnée**, pas un solde : elle passe donc par le read-model, comme `checksum`, `exerciceId` et
l'échéance de dépôt.

⛔ **Elle ne peut PAS venir du corps du POST.** Un client qui enverrait la devise avec ses soldes
choisirait l'unité de sa propre liasse — c'est exactement l'inverse d'AC-1 (« la devise **de sa
balance source** »), et c'est le raisonnement qui a fait dériver `exposant` du registre en AC-1 de
STORY-489.

⇒ **Changement de contrat d'événement : 2 dépôts, 2 branches `MNV-490`, 2 PR, intégrées ensemble.**

### D-490-2 — l'événement publie la devise **EFFECTIVE** + `deviseDeclaree`, par la même fonction que la réponse REST

`BalanceCanonique.devise` est **facultative** (D-489-4 : aucune écriture ne va la poser sur les
balances antérieures). Publier ce champ tel quel forcerait le consommateur à inventer un repli —
donc à recopier une règle. L'événement publie ce que publie déjà l'enveloppe REST :
`devise`, `exposant`, `deviseDeclaree`, produits par **une seule fonction** (`projeterDevise`,
extraite de `balance-response.dto.ts` vers `types/devise.ts`).

⚠️ **`exposantIso` / `exposantDivergeDeLIso` ne voyagent pas** : ce sont des champs de **contrat
d'API**, destinés à un intégrateur qui lit l'enveloppe REST. Un read-model n'en fait rien, et un
champ répliqué que personne ne lit est une divergence en attente.

### D-490-3 — la garde d'AC-3 est posée sur les **six** chemins, et son exhaustivité est **gardée par un test**

Six sites font se rencontrer une balance et un paquet fiscal :

| # | Site | Ce qui se compare |
|---|---|---|
| 1 | `ResultatFiscalService.calculer` | assiette de la balance × rubriques du paquet |
| 2 | `LiquidationService.liquider` | CA de la balance × MFP/IS du paquet |
| 3 | `LiquidationService` (acompte théorique N-1) | idem, sur l'exercice précédent |
| 4 | `TpuService.calculer` | CA de la balance × plafond TPU du paquet |
| 5 | `RegimeService.proposer` | CA de la balance × `plafondCA` / `smtCaMax` |
| 6 | `RegimeService.vue` | idem |

⛔ **Une garde posée sur cinq des six ne garde rien** — c'est le défaut constaté en STORY-445 (un
seul des quatre chemins d'écriture) et en STORY-457 (deux des trois). Un **test d'exhaustivité**
balaie donc les sources : tout site qui charge une base fiscale (`trouverDerniereBaseFiscale`,
`trouverBaseFiscaleParId`) ou qui résout un CA de balance à côté d'un paquet **doit** appeler
`exigerDeviseCoherente`. Le septième site écrit demain fait rougir la suite.

### D-490-4 — ⛔ `devise` **n'entre pas** dans le contenu scellé du snapshot

`empreinteSnapshot` scelle **sept** champs, et son docstring est explicite : *« cette liste est le
contrat : la changer change toutes les empreintes futures et rend incomparables celles d'avant »*
(STORY-452). La devise est donc portée par le document `SnapshotLiasse` **à côté** du sceau, comme
`balanceChecksum` — qui n'y est pas non plus, et pour la même raison.

⚠️ Ce que cela coûte, déclaré : l'empreinte ne détecte pas l'altération de la seule `devise` d'une
version figée. Elle scelle les **chiffres** ; la devise est une métadonnée de provenance, recopiée
de la balance dont le `balanceChecksum` est lui-même hors sceau.

### D-490-5 — l'échelle de rendu de l'export **ne devient pas** paramétrable, et un test la garde

`export/montant.ts` divise par `100` en dur. Aujourd'hui les **six** devises du registre ont la même
échelle appliquée (`EXPOSANT_APPLIQUE` vaut 2 partout, D-489-1) : rendre la division paramétrable
serait de la flexibilité morte, et AC-5 interdit d'ailleurs toute arithmétique de change.

⇒ La dépendance est rendue **visible** : un test refuse un `exposant` autre que 2 dans un jeu
d'états ou un snapshot. Le jour où une devise d'échelle 0 (GNF, RWF) entre au registre, la suite
rougit **ici**, au lieu d'imprimer des montants cent fois trop grands sous un en-tête juste.

### D-490-6 — AC-4 : la mention est portée par **chaque section**, pas seulement par l'en-tête du document

`DocumentExport.metadonnees` est **global au document** ; une section (`SectionExport`) est un
**état** (Bilan actif, Bilan passif, Compte de résultat, TFT, notes…). AC-4 dit « en en-tête de
**chaque état** » : la mention descend donc sur `SectionExport`, et les deux rendus (PDF et Excel,
qui itèrent sur les sections) la portent. La métadonnée globale reste, elle ne se remplace pas.

### Hors périmètre, nommé

- **Aucune conversion, aucun taux de change** (AC-5) — c'est STORY-495.
- **Les montants du paquet fiscal** et leur devise déclarée par rubrique — c'est STORY-493.
- **`_meta` des paquets référentiels** (zone, pays, `devisePresentation`) — c'est STORY-491 ; le champ
  existe déjà comme **hook inerte** dans `referentiel-package.interface.ts` et les trois artefacts
  ont un `_meta` vide. Cette story ne le renseigne pas et ne s'en sert pas.
- **FE-082** (le prototype qui écrit « F CFA » 60 fois) — front, hors dépôt.
- **Reprise de données** : aucun jeu d'états, snapshot ou jeu d'hypothèses existant n'est réécrit.
  L'absence de `devise` sur un document antérieur se lit telle quelle et retombe sur la devise par
  défaut **au service**, jamais par écriture (même parti pris que D-489-4).

---

## Progress Tracking

### Ce que le développement a appris, et que la fiche ne disait pas

**① ⚡⚡ Le test d'exhaustivité a trouvé HUIT sites, là où l'inventaire manuel en
avait trouvé six.** Les deux manquants sont dans `ProvisionsFiscalesService` — et
`appliquerTpu` est le plus instructif : elle ne **charge** pas la balance, elle la
**reçoit en paramètre**. Un filet qui cherche les lectures de dépôt
(`trouverDerniereBaseFiscale`, `trouverBaseFiscaleParId`) la manque par construction. Le
marqueur qui l'a rattrapée est `lignesNormalisees(` — le passage obligé des montants
d'une balance vers le calcul, quelle que soit la façon dont elle est arrivée. Et c'est un
chemin d'**écriture** : il inscrit la charge d'impôt dans la balance.

⇒ **Un inventaire manuel de chemins n'est pas un filet.** Les deux batteries écrites ici
(`devise-paquet.exhaustivite.spec.ts` et son assertion de **compte**) rougissent au
neuvième site écrit demain.

**② ⚡⚡ La vérification docker a montré DEUX sources pour un seul fait.** L'export d'une
liasse figée lit la devise **du snapshot** ; `GET /bilan/etats/:id` lit celle **du jeu**.
Deux surfaces du même document, deux lectures — le patron exact qui a produit « deux dates
légales pour le même exercice » en STORY-453.

Elles ne peuvent **pas** diverger, et c'est démontrable : un jeu est lié à **une** balance
pour sa vie entière (`refuserSiAutreBalance` refuse tout recalcul nommant une autre), une
balance `VALIDÉE` est terminale (son événement n'est jamais ré-émis), et le gel recopie.
Ce dernier maillon n'était gardé par **rien** — il l'est désormais (M12). ⇒ **Aucun
paramètre ajouté** aux sept sites d'appel du DTO pour fermer une divergence inatteignable :
l'invariant est **prouvé**, la flexibilité n'est pas construite.

**③ ⚠️ Le refus d'échelle non rendable plantait au lieu de refuser.** Première passe e2e :
`500` anonyme sur l'export du prévisionnel, parce qu'un harnais passait une base sans
devise à un module **pur** dont le type la déclare pourtant requise. Un `TypeError` se
cherche, un refus nommé se diagnostique.

**④ ⚠️ `taux de change` est écrit six fois dans `balance-service`** — dans des messages de
refus (`tresorerie`, `rapprochement`, `imports`) qui disent précisément qu'on ne convertit
pas. Le test d'AC-5 vise donc des **identifiants**, jamais de la prose : bannir la phrase
interdirait d'expliquer la règle, bannir l'identifiant interdit de l'enfreindre. Cette
famille de refus est aussi le **précédent maison** dont la garde d'AC-3 est la transposition
au fiscal.

### Table de mutations — 12 sur 12 ROUGES par assertion

⚠️ Chaque ligne a été vérifiée **rouge par ASSERTION**, jamais par erreur de compilation
(une mutation qui ne compile pas ne prouve rien), et le nombre de tests exécutés est
relevé à chaque tour (une commande qui n'exécute **aucun** test rend « 0 total » sans
erreur — le faux vert de STORY-489).

| # | Mutation | Batterie | Verdict |
|---|---|---|---|
| M1 | retirer `devise: updated.devise` de `marquerEtat` | `balance.service.spec` | ROUGE (1/105) |
| M2 | `...projection` au lieu des 3 champs énumérés | `balance-events.spec` | ROUGE (1/4) |
| M3 | retirer la garde de `RegimeService.vue` | `regime.service.spec` | ROUGE (1/14) |
| M4 | retirer la garde de `provisions.appliquer` | `devise-paquet.exhaustivite.spec` | ROUGE (1/2) |
| M5 | exempter une balance **sans** devise déclarée | `devise-paquet.spec` | ROUGE (2/6) |
| M6 | **sceller** la devise dans l'empreinte du snapshot | `empreinte-snapshot.spec` | ROUGE (1/14) |
| M7 | servir une version figée sans **sa** devise | `export.service.spec` | ROUGE (1/16) |
| M8 | ne poser la mention que sur la 1re section | `modele-liasse.spec` | ROUGE (1/20) |
| M9 | drapeau absent ⇒ `BALANCE_DECLAREE` | `devise-liasse.spec` | ROUGE (1/12) |
| M10 | accepter un triplet **partiel** au read-model | `balance-payload.util.spec` | ROUGE (1/43) |
| M11 | rebasage qui **reporte** la devise au lieu de la relire | `hypotheses.service.spec` | ROUGE (1/99) |
| M12 | le gel ne recopie plus la devise du jeu | `jeu-etats.service.spec` | ROUGE (1/117) |
| M13 | devise **effective** câblée en dur sur le repli (⑥ F1) | `balance-events.spec` | ROUGE (1/4) |
| M14 | mention posée sur la seule 1re section du **prévisionnel** (⑥ F3) | `modele-previsionnel.spec` | ROUGE (1/32) |
| M15 | paquet fiscal sans devise ⇒ `XOF` fabriqué (⑦ F-3) | `referentiel-loader.service.spec` | ROUGE (1/43) |
| M16 | forme du code devise non bornée (⑦ F-2) | `balance-payload.util.spec` | **VERT ⚠️ puis ROUGE (5/48)** |

⛔ **Cinq mutations ont dû être RÉÉCRITES** parce que leur première forme ne compilait pas
(paramètre devenu inutilisé, champ devenu non assignable) : elles rendaient « 0 test
exécuté », que la première lecture prend pour un rouge. Les formes retenues compilent et
échouent sur une **assertion**.

⛔⛔ **M16 EST SORTIE VERTE, ET C'ÉTAIT MA PROPRE CORRECTION DE REVUE.** J'avais ajouté la
garde de forme du code devise (constat ⑦ F-2) **sans le test qui la mesure** : la desserrer
en `/^.+$/` laissait les 43 tests verts. C'est exactement le défaut que la table existe pour
attraper, commis dans le geste censé fermer un défaut. Cinq cas ajoutés (minuscules, quatre
lettres, chiffre, 5 000 caractères, glyphe de contrôle bidi) — M16 rougit désormais sur les
cinq.

### ⑥ Revue de code — 4 constats, aucun bloquant, tous des **filets qui ne gardent pas**

Scan délégué à un sous-agent `opus`, plus une seconde lentille sur l'over-engineering.
Chaque constat a été **vérifié dans le code** avant d'être corrigé.

**F1 — les deux fixtures « devise DÉCLARÉE » valaient `XOF`, c'est-à-dire le REPLI.**
`projeterDevise(undefined)` rend `XOF` : une fixture déclarée en `XOF` ne peut donc pas
distinguer `devise: projection.devise` d'un `devise: DEVISE_PAR_DEFAUT` câblé en dur. Mesuré :
la mutation laissait vertes les deux specs, le `toEqual` du contrat complet **et** le spec
d'outbox. `bilan-service` aurait figé **toutes** ses liasses sur la convention — et aucun e2e
ni docker ne pouvait rattraper, `DEVISES_SUPPORTEES` interdisant à l'API de produire une autre
monnaie. Fixtures passées à `GHS` (M13).

**F2 — deux docstrings nommaient un filet qui n'existe pas.** `devise-liasse.ts` citait
`montant.exposant-attendu.spec.ts` : **ce fichier n'a jamais existé**. `export.types.ts`
affirmait que `export-agnosticisme.spec.ts` vérifie la mention sur toutes les sections : ce
spec ne garde que les imports interdits et ne contient pas une occurrence de `unite`. Patron
STORY-402/437 — un commentaire périmé qui porte une instruction est un piège armé.

**F3 — AC-4 n'était tenu que du côté liasse.** Le seul `expect` sur `section.unite` du dépôt
vivait dans `modele-liasse.spec.ts` ; retirer `avecUnite(…)` de `modelePrevisionnel` laissait
la suite verte (le test de métadonnée **globale** reste vert sans lui). Un plan à trois ans
remis à un banquier serait sorti sans mention de monnaie sur chaque état (M14).

**F4 — le filet d'exhaustivité balayait une LISTE FERMÉE de neuf fichiers.** Il ne rougissait
que sur une nouvelle **méthode** dans l'un d'eux ; un **nouveau fichier** serait passé sans un
mot — le geste même que la garde existe pour empêcher. Les fichiers sont désormais
**découverts** par balayage de `src/` sur le critère « lit un paquet fiscal », avec une garde
de non-vacance sur le balayage lui-même.

**Lentille over-engineering** : `UNITES_MINEURES_PAR_UNITE` cesse d'être exporté (trois usages,
tous dans son fichier). Rien d'autre à retrancher.

### ⑦ Revue de sécurité — 3 constats, aucun bloquant

**F-3 (le plus grave) — deux replis vers la même valeur font une garde qui passe toujours.**
`PaquetFiscalLoader` posait `devise: meta.devise ?? 'XOF'` : la devise était le **seul** champ
de `_meta` à se donner un défaut, là où `pays` et `annee` lèvent deux lignes plus haut. Tant
qu'elle n'était qu'un libellé, c'était défendable ; depuis cette story c'est l'**opérande de
référence** d'AC-3, et l'autre opérande retombe lui aussi sur `XOF`. ⇒ Le jour où un paquet
hors zone franc est packagé — **exactement le jour où la garde doit servir** — un artefact qui
oublie `_meta.devise`, ou l'écrit sous une autre casse, aurait été réputé `XOF`, et les huit
sites d'appel n'y auraient rien changé. Refus explicite désormais ; le test qui **verrouillait
l'affirmation inverse** a été réécrit (M15). `statut` garde son défaut : c'est un libellé.

**F-2 — l'asymétrie de bornage était le signal.** Dans la même fonction, `lireDevise` bornait
l'exposant (entier 0..8) et le drapeau (booléen), mais acceptait le **code** dès lors que la
chaîne était non vide. Une chaîne arbitraire venue d'un message était persistée, recopiée sur
le jeu d'états, **scellée dans un snapshot append-only** et imprimée en tête de chaque état
d'un PDF/XLSX opposable. Garde de **forme** ISO 4217 alphabétique ajoutée — pas un vocabulaire
fermé, donc l'objection D-490-2 ne s'y applique pas. ⚠️ **L'injection de formule Excel était
déjà fermée** par le préfixe « Montants en » : cette garde ferme la longueur et les glyphes,
pas une injection.

**F-1 — une justification devenue fausse.** Le docstring de `balance.schema.ts` justifiait
l'exclusion de `devise` du checksum par « la devise ne franchit pas la frontière vers
`bilan-service` ». Cette story fait exactement l'inverse. Corrigé, avec le coût déclaré : la
devise n'est scellée **nulle part** sur toute la chaîne — ni au checksum de balance, ni à
l'empreinte du snapshot (D-490-4). Non atteignable depuis l'API (aucun chemin d'écriture sur
les snapshots), mais c'est le seul champ figé dont c'est vrai. 🪝 L'inclure aux deux sceaux
est une story à part : elle rendrait incomparables toutes les empreintes déjà scellées.

**Vérifiés fermés, et nommés pour que la revue suivante ne les refasse pas** : injection NoSQL
(aucune valeur de message n'entre dans un filtre Mongo), mass-assignment (les écritures
énumèrent leurs champs), IDOR / multi-tenant (aucun endpoint ni guard ajouté), poison-pill (un
triplet malformé n'a jamais fait rejeter un message), idempotence du consommateur (inchangée),
DoS (`10 ** exposant` borné avant écriture), fuite d'information dans les refus (les deux
devises et le paquet appartiennent au tenant appelant).

### ⑧ Vérification docker REJOUÉE sur l'état final

Deux correctifs touchaient des chemins déjà vérifiés (le chargeur de paquet fiscal en F-3,
l'acceptation du triplet en F-2) : la vérification a été **rejouée**, jamais reportée.

```
chargeur DURCI, paquet togo@2026        : resultat-fiscal 200 · liquidation 200 · regime 200 (SYNTHETIQUE)
round-trip Kafka COMPLET (balance v2)   : read-model = {etat:VALIDÉE, devise:XOF, exposant:2, deviseDeclaree:true}
GET etats/:id · versions/1 · hypotheses : {code:XOF, exposant:2, source:BALANCE_DECLAREE}
```

⚠️ **Trois échecs e2e écartés APRÈS mesure, pas après supposition.** Trois exécutions
successives de la suite e2e de `balance-service` ont rendu **trois ensembles différents** de
tests en timeout à 5 s (`suggestion`, `pieces-ocr`, puis `rapprochement`/`tresorerie`), tous
sans rapport avec la devise. Cause : neuf conteneurs docker en concurrence sur le CPU.
**Vérifié** : conteneurs arrêtés, la suite rend **904/904 verts**.

### Vérification docker — sur la stack réelle

⚠️ La stack était détruite (WiredTiger en panne après un arrêt non propre) : `mongod
--repair`, puis suppression de la base `local` en mode autonome et ré-init du replica set —
**les données métier ont été préservées**, et la vérification s'appuie dessus.

**① Le round-trip Kafka porte le triplet, sur les DEUX topics** — outbox réelle, après
soumission puis validation d'une balance déclarant `XOF` :

```
balance.created              -> {"devise":"XOF","exposant":2,"deviseDeclaree":true}
balance.etat.document.change -> {"devise":"XOF","exposant":2,"deviseDeclaree":true}
balance.etat.change          -> {}            (topic d'EXERCICE : hors périmètre)
```

⛔ **`exposantIso` et `exposantDivergeDeLIso` sont absents des deux payloads** — D-490-2
vérifié sur des messages réels, pas sur un mock.

Read-model de `bilan-service` après chaque message :

```
après balance.created   : etat=BROUILLON  devise=XOF exposant=2 deviseDeclaree=true
après etat.document.change : etat=VALIDÉE devise=XOF exposant=2 deviseDeclaree=true
```

**② Persistance réelle de la liasse et de sa version figée** (`mongosh`, documents bruts) :

```
jeux_etats        : {exercice:"2026", statut:"BROUILLON", devise:"XOF", exposant:2, deviseDeclaree:true}
snapshots_liasse  : {version:1, devise:"XOF", exposant:2, deviseDeclaree:true, empreinte:"d7dd48cf…"}
jeux_hypotheses   : base = {…, dureeMois:12, devise:"XOF", exposant:2, deviseDeclaree:true}
```

**③ D-490-4 — l'empreinte du snapshot est bien celle des SEPT champs**, recalculée depuis
le document en base avec la fonction du service :

```
empreinte en base       : d7dd48cf9328f7425a6e6d5975d07be777a5331175a0d7935910ea00cb353fcf
recalcul SANS la devise : d7dd48cf9328f7425a6e6d5975d07be777a5331175a0d7935910ea00cb353fcf  IDENTIQUE
```

⚠️ **Ce que cette mesure prouve, et ce qu'elle ne prouve pas** : elle établit que le sceau
stocké est celui des sept champs et qu'ajouter la devise **à l'entrée** ne le change pas.
Elle ne prouve **pas** qu'un développeur ajoutant la devise **au corps** de
`empreinteSnapshot` serait arrêté — c'est M6 qui le prouve.

**④ AC-1 — une version figée rend LA DEVISE QUI ÉTAIT LA SIENNE.** Mesure
**discriminante** : le snapshot est forcé à `GHS` en base pendant que le jeu reste `XOF`.

```
GET …/etats/{id}/versions/1  -> {"code":"GHS", …}   (lit SON snapshot)
GET …/etats/{id}             -> {"code":"XOF", …}   (lit le jeu)
export ?version=1 (XLSX)     -> « Montants en GHS » (suit le snapshot)
export sans ?version (XLSX)  -> « Montants en GHS » (STORY-449 : un jeu figé s'exporte figé)
```

C'est cette mesure qui a révélé le point ② ci-dessus. État restauré à `XOF` ensuite.

**⑤ AC-4 — la mention en en-tête de CHAQUE état**, classeur réellement produit puis
**rouvert** (un `.xlsx` est un ZIP : lire ses octets ne prouve rien) :

```
liasse figée   : 8 mentions « Montants en XOF » + la métadonnée « Unité : Montants en XOF »
prévisionnel   : 8 mentions « Montants en XOF » + la métadonnée
```

**⑥ Le parc EXISTANT, sans une seule écriture** — un jeu figé avant la story, réellement
en base :

```
document en base : devise=undefined exposant=undefined
réponse servie   : {"code":"XOF","exposant":2,"source":"CONVENTION_HISTORIQUE"}
après lecture    : devise=undefined            (AUCUNE écriture)
```

**⑦ R-490-1 vérifiée, pas supposée — la divergence d'AC-3 est INATTEIGNABLE** :

```
POST …/balances {"devise":"EUR"} -> 400 ['devise must be one of the following values: XOF']
paquet togo@2026                 -> _meta.devise = XOF
```

⇒ La porte se referme **avant même** `exigerDeviseCoherente`, sur la liste fermée du DTO
(`DEVISES_SUPPORTEES`). Le refus `409 DEVISE_PAQUET_INCOHERENTE` est donc prouvé en
unitaire et en test de service uniquement — **et c'est écrit dans le code, à la ligne
concernée**.

**⑧ Non-régression du moteur fiscal, garde en place** :

```
GET …/fiscal/resultat-fiscal?exercice=2026        -> 200
GET …/fiscal/liquidation?exercice=2026            -> 200
GET …/profil-societe/regime?debut=…&fin=…         -> 200
   regimeFiscal = SYNTHETIQUE — « CA 120 000 ≤ plafond TPU 60 000 000 »
```

La dernière ligne est **le sixième chemin** : la comparaison que la garde protège s'exécute
bien, après le contrôle de devise.

⚠️ **Données créées pour la vérification** (dev, jetables) : un dossier `Verif 490 devise`
avec son exercice 2026, sa balance, sa liasse et son jeu d'hypothèses ; et un
`profil-societe` sur l'organisation d'essai, qui n'en avait pas — nécessaire pour atteindre
la route de régime.

### Clôture — 2026-09-10

PR `MNV-490(balance)` #99 et `MNV-490(bilan)` #120 **rebase-mergées ensemble** sur `dev`,
branches supprimées — un changement de contrat d'événement touche 2 dépôts, et les intégrer
séparément aurait laissé le read-model de la relying party diverger en silence. Les deux
ordres d'intégration étaient sûrs : le producteur publie les trois champs en **requis**, le
consommateur les déclare **optionnels**.

PR `docs/` mergée sur `main`. Assigné à : `vivianMoneyVibesGroupes`.
