# STORY-490 : La devise s'arrête à la balance — la liasse, le prévisionnel, le fiscal et l'export la perdent

Status: in_progress

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

- [ ] AC-1 — `JeuEtats` porte la devise de sa balance source et la rend à chaque lecture, versions
      figées comprises. Une version figée rend **la devise qui était la sienne**, jamais celle du
      dossier à l'instant de la lecture.
- [ ] AC-2 — Les hypothèses de prévisionnel et la projection portent la devise ; elle est **héritée**
      de la balance d'ancrage, non saisie. Un plan à trois ans dans une monnaie autre que la balance
      qui l'ancre n'a pas de sens et doit être impossible à exprimer.
- [ ] AC-3 — Le moteur fiscal **refuse** (`409 DEVISE_PAQUET_INCOHERENTE`) quand la devise de la
      balance diffère de celle du paquet fiscal appliqué. ⛔ **Il ne convertit pas** : convertir
      demanderait un taux, un taux demande une date et une source, et aucune des deux n'est décidée.
      Refuser est la seule conduite honnête tant que STORY-495 n'est pas rendue.
- [ ] AC-4 — L'export porte la devise **en en-tête de chaque état**, comme l'exige la présentation
      d'états financiers. Un bilan sans mention de monnaie n'est pas un bilan opposable.
- [ ] AC-5 — Aucune conversion nulle part dans cette story. Un test le prouve : aucun taux, aucun
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

_(en cours)_
