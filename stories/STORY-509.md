# STORY-509 : États DIMF 2000 et 2080 — et le jalon `format confirmé` avant d'écrire une ligne

Status: done

**Épic :** EPIC-127 — États périodiques et ratios prudentiels BCEAO
**Service :** `microfinance-service` + `bilan-service`
**Points :** 8 · **Sprint :** S20
**Origine :** découpage `epics-microfinance-2026-08-27.md`, **AD-10** de la spine.

---

## Le fait

`sfd-bceao@2.0` produit **déjà** la matière : ses postes de bilan (`BA1..BA4` / `BP1..BP4`, totaux
`BAT`/`BPT`) et son compte de résultat (`RC1..RC8` / `RP1..RP6`, cascade `RSA → RSG`) sont
**dérivés des états DIMF 2000 et 2080**. *(Vérifié dans l'artefact le 2026-08-27.)*

Ce qui manque n'est pas le calcul : c'est **le format de dépôt**. Un état réglementaire n'est pas un
tableau à l'écran — c'est un gabarit attendu par la Commission Bancaire, avec ses codes de ligne,
son ordre, son support et son canal.

## ⛔ Jalon `format confirmé` — même garde qu'EPIC-032 pour le dépôt fiscal

**Aucune ligne de code avant d'avoir en main le gabarit officiel.** Le programme a déjà payé cette
leçon deux fois : les échéances d'acomptes posées en trimestriel au lieu des dates réelles, et le
RSL à 10 % au lieu de 8,75 % — deux erreurs **plausibles**, donc invisibles à la relecture.
⇒ *Les chiffres et les formats d'un état réglementaire se prennent dans la source officielle, jamais
dans le vraisemblable.*

## ✅ TRANCHÉ PAR LE PO — 2026-08-28 : **VOIE A**, le produit dépose

La doctrine est posée par [[STORY-525]] et vaut pour les trois verticaux. Cette story produit donc
**le fichier déposable**, pas seulement l'état imprimable — et elle hérite du contrat commun de
[[STORY-536]] (paquet de dépôt) et de [[STORY-538]] (transmission, accusé, rejet).

⛔ **Le jalon `format confirmé` reste entier** : aucun développement avant que le gabarit officiel
de la Commission Bancaire ne soit au dépôt, sourcé et daté.

---

## Ce qui devait être tranché — conservé pour la traçabilité

**Q1 — Prospera produit-il le fichier déposable, ou l'état imprimable que l'IMF dépose elle-même ?**
La seconde réponse est parfaitement défendable et divise le coût. ⚠️ **C'est la même question que
STORY-525 pose pour le dépôt fiscal, et elle mérite la même réponse** — deux doctrines de dépôt
dans un même produit seraient incompréhensibles pour le cabinet.

## Critères d'acceptation *(applicables une fois Q1 tranchée)*

- [ ] AC-1 — Le gabarit officiel est **sourcé et référencé** (instruction, année, version) avant tout
      développement, et versé au dépôt.
- [ ] AC-2 — L'état est produit **depuis la liasse SFD déjà calculée**, jamais recalculé en parallèle.
      Deux moteurs sur le même nombre divergeraient en silence.
- [ ] AC-3 — L'état porte **sa période, sa date d'arrêté et la version du gabarit**.
- [ ] AC-4 — ⚠️ Une périodicité **infra-annuelle** (les états DIMF sont périodiques, pas seulement
      annuels) suppose des arrêtés intermédiaires : vérifier que l'exercice du dossier le permet
      **avant** de promettre le mensuel ou le trimestriel.

## Notes

- Voir [[STORY-525]] (la même question, côté fiscal), [[STORY-510]], spine AD-10.
- Doctrine de dépôt commune aux trois verticaux : [`doctrine-depot-2026-09-22.md`](../doctrine-depot-2026-09-22.md), posée par [[STORY-525]].

---

## ✅ Jalon `format confirmé` — LEVÉ le 2026-09-19 (sauf un arbitrage produit)

Le constat de blocage posé plus tôt le même jour disait vrai de l'**arbre** — zéro code de ligne
DIMF, `tmp/` suivi par aucun dépôt — mais il concluait trop vite que la matière n'existait pas. Une
recherche sur les sources officielles a trouvé l'essentiel. Tout ce qui suit a été **lu dans les PDF
primaires**, pas résumé depuis un site tiers.

📄 **Tout est consigné, sourcé et daté dans
[`referentiels/README-etats-dimf-sfd-bceao.md`](../referentiels/README-etats-dimf-sfd-bceao.md)** —
empreintes sha256, cartographie des annexes page par page, textes cités article par article.

### ⭐ Le gabarit officiel existe en accès public, et il est lisible par machine

La **version développée du RCSFD** (457 p., ISBN 978-2-916140-08-7, maquette 27/07/2009) est publiée
par la **DRSSFD du Trésor ivoirien**. Vérifié directement :

- **Annexe 2.2** — `BILAN VERSION DEVELOPPEE`, `DIMF 2000`, colonne `Code poste`, en-têtes complets ;
- **Annexe 3.3** — `DIMF 2080` développé (`D : RA0`) ;
- **Annexe 2.4** — le **hors-bilan**, dans les deux versions ;
- **Annexe 1** — la **concordance codes postes ↔ plan de comptes**, en formules directement
  transcriptibles (`A01 = + 101 + 1101 + … − 199`, `A10 = + 10`, `A11 = + 101`).

⚡ **Le tout sort de `pdftotext -layout` en texte brut** — ni image, ni OCR, ni transcription à la
main. C'est précisément ce qui manquait à **AC-2**, et le livre contient **les deux versions**.

### AC-4 est tranché : les DIMF sont ANNUELS

L'infra-annuel existe (loi-cadre **art. 55**), mais il porte sur des « **données périodiques** »
régies par l'Instruction **n°020-12-2010** — mensuelles pour les SFD de l'article 44, trimestrielles
pour les autres. **Ce ne sont pas les DIMF.** Les états de synthèse sont **arrêtés au 31 décembre**
et transmis dans les **six mois** (Instruction n°030-02-2009, art. 6 ; loi-cadre art. 51-52).

### ⚠️ Le gabarit que nous détenions est celui du cas MARGINAL

Trois textes, et la règle n'est lisible dans aucun pris isolément :

- Instruction **n°030-02-2009 art. 4** — les SFD de l'**article 44** *doivent* la version développée ;
- Instruction **n°021-12-2010 art. 2** — l'allégée est réservée aux encours **< 50 M FCFA** sur deux
  exercices, et le choix inverse est **irréversible** (art. 3) ;
- Instruction **n°007-06-2010** — l'article 44, c'est **≥ 2 Md FCFA** sur deux exercices.

⇒ La bande **entre 50 M et 2 Md FCFA** n'est ni tenue par l'article 44, ni éligible à l'allégée :
elle relève de la **développée**. **L'allégée est l'exception, pas la règle** — or c'est son gabarit
que nous avions en main.

### ⛔ Ce qui reste ouvert — un arbitrage PRODUIT, plus une incertitude documentaire

**Il n'existe aucun format de fichier normé, et ce n'est pas une lacune de nos sources : c'est le
texte qui n'en prévoit aucun.** Instruction n°030-02-2009, art. 7 :

> « Les états financiers ou documents de synthèse sont communiqués **sur support papier** […]
> revêtus de la **signature** d'une personne dûment accréditée […]. Ils **peuvent également** être
> transmis […] **sur support électronique, en complément** des documents sur support papier. »

Cinq exemplaires au Ministre, plus deux à la BCEAO et deux à la Commission Bancaire pour les SFD de
l'article 44. Aucun XML, aucun schéma, aucune plateforme régionale de télétransmission.

⇒ **Question au PO, et elle seule reste bloquante** : la voie A ([[STORY-525]]) engage le produit à
« produire le fichier déposable ». Puisque le dépôt légal est **papier signé**, cela signifie
produire un **document imprimable conforme au gabarit** (PDF/A prêt à signer), et non un flux de
télétransmission. **Confirmer cette lecture avant d'écrire le générateur.**

Piste non vérifiée, à ne pas confondre avec une source : des canevas électroniques nationaux sont
rapportés par des communiqués et la presse (DRSSFD Côte d'Ivoire, e-Contrôle au Bénin, « Espace Pro »
au Sénégal). **Aucun fichier téléchargé, aucun texte fondateur trouvé.**

### Ce que la story peut faire dès maintenant

- [x] AC-1 — gabarit officiel **sourcé et référencé** (instruction, année, version) et versé au
      dépôt sous forme de fiche de référence avec empreintes sha256 et cartographie des annexes.
      ⚠️ Les PDF eux-mêmes ne sont pas committés (23,5 Mo) : patron du dépôt, URL + sha256.
- [ ] AC-2 — produire l'état depuis la liasse déjà calculée, via l'annexe 1 de concordance.
- [ ] AC-3 — période, date d'arrêté et **version du gabarit** portées par l'état.
- [x] AC-4 — périodicité **annuelle** établie ; l'infra-annuel relève d'un autre livrable.
- [ ] ⛔ **Préalable** : arbitrage PO sur la forme du livrable (document imprimable signable).

### Rattachement à l'existant

[[STORY-536]] est **livrée** (2026-09-19) : le contrat de paquet de dépôt que cette story consommera
existe — `format` + `schema`, `gabarit` poste → case **sourcé case par case**, `canal`, `calendrier`,
`penalites`, vérifié par checksum. ⚠️ Son alphabet d'`etat` (`^[A-Z][A-Z0-9-]{1,39}$`) n'accepte ni
espace ni minuscule : les états devront être codifiés **`DIMF-2000`** et **`DIMF-2080`**.

⚠️ Le `canal` du paquet devra déclarer un dépôt **papier** (`DEPOT_PHYSIQUE`), pas un téléservice —
le vocabulaire du contrat le prévoit déjà.

---

## ✅ Arbitrage PO du 2026-09-19 — le préalable est levé

**Livrable retenu : les états codés + le régime de dépôt**, `canal` = `DEPOT_PHYSIQUE`. Le rendu
imprimable signable (PDF/A prêt à signer) part en **story de présentation dédiée** : il ne change
rien aux nombres, seulement à leur mise en page.

**Périmètre de gabarit : la version DÉVELOPPÉE seule.** C'est la règle et non le cas marginal —
l'allégée est réservée aux encours < 50 M FCFA quand l'article 44 commence à 2 Md, si bien que toute
la bande intermédiaire relève de la développée. L'allégée reste un hook inerte.

## Implémentation — `bilan-service`, branche `MNV-509`

⚠️ **Pas dans `microfinance-service`.** Ce service ne détient aucun grand livre, et son chargeur de
référentiel **ampute volontairement** `postes` / `tableDePassage` (« ils produisent la liasse, que ce
service ne produit pas »). Le moteur, les soldes et le générateur d'artefacts vivent dans
`bilan-service`.

Artefact **`etats-dimf-sfd-bceao@1.0`**, manifeste **disjoint** du comptable (un gabarit se révise
sans faire bouger l'octet d'un référentiel servi) :

| | postes | intercalaires | termes de concordance |
|---|---|---|---|
| **DIMF 2000** (bilan, `D : AA0`) | 140 | 2 | 582 |
| **DIMF 2080** (compte de résultat, `D : RA0`) | 242 | 19 | 457 |

Plus la concordance officielle de l'annexe 1.1 (1 039 termes signés, avec le mode `extrait` de la
mention « ex ») et le régime de dépôt de l'Instruction n°030-02-2009 article par article.

### ⚡ Le document officiel se contredit — le recoupement l'a révélé

Le RCSFD présente **chaque état deux fois**, en vis-à-vis (annexes 2.2 / 3.3) et en liste (2.3 / 3.4).
**Les deux ne coïncident pas, et aucune n'est complète seule** :

| Défaut | Présentation fautive | Ce qui tranche |
|---|---|---|
| `C32` **omis**, son libellé décalé sur `C31` | liste (p. 393) | vis-à-vis + concordance + plan de comptes (`321` biens meubles / `322` marchandises) |
| `T54`→`T58`, `T6B`, `T6C` **sautés** | liste (p. 419) | vis-à-vis (p. 415-416) + concordance |
| `R5Y`→`R7D`, `V6A`→`V7D` **absents** | vis-à-vis — **la page 413 du PDF est BLANCHE** | liste (p. 418, 421) + concordance |
| `1146` **coupé** en `114` + `6` par le crénage | extraction | un compte à un chiffre aurait rattaché toute la classe 6 à `F60` |

Les quatre arbitrages sont dans le bloc `corrections` de l'artefact, avec leurs sources, et
**verrouillés par des tests** — sans eux, un relecteur de bonne foi « corrigerait » vers la version
fautive.

### Critères d'acceptation

- [x] **AC-1** — gabarit officiel sourcé, référencé et **en machine**, vérifié par sha256.
- [x] **AC-2** — *relu, car infaisable au pied de la lettre* : `sfd-bceao@2.0` porte **31 postes**
      (4 à l'actif) quand le DIMF 2000 développé en compte **140**. La liasse est **dérivée** des
      DIMF, donc plus grossière : on ne désagrège pas. L'état est produit depuis **les mêmes
      soldes**, par la concordance officielle, en **un seul** chemin de calcul — l'esprit de l'AC
      (jamais deux moteurs sur le même nombre) est tenu, sans une correspondance inventée.
- [x] **AC-3** — l'état porte sa période, sa date d'arrêté, la version du gabarit, le paquet et son
      checksum vérifié.
- [x] **AC-4** — périodicité **annuelle** établie et portée par l'artefact.

### ⛔ Aucun total n'est supposé

`E90` et `L90` figurent à l'annexe 1.1 **sans aucune formule**, et la hiérarchie des rubriques n'est
**pas déductible** de la concordance (`A10 = + 10` est plus large que les comptes qu'énumère `A01` :
ni l'un ni l'autre ne contient l'autre). Ils sortent à `null` avec leur motif plutôt qu'à une somme
vraisemblable — un total plausible est précisément ce que le jalon interdit. `T84` et `X84`, qui ont
une formule officielle, la gardent.

### ⚠️ Écart de plan de comptes — publié, pas comblé

La concordance cite **44 comptes** que `sfd-bceao@2.0` ne porte pas (racines **39, 45, 46, 47, 49,
73**). La classe 9 est hors périmètre assumé, mais **ces six-là sont des comptes de bilan et de
résultat** — et `X84` (TOTAL PRODUITS) cite `73`. Chaque ligne produite publie ses `comptesAbsents`,
et un test fige la mesure. **Sa résorption appartient au référentiel comptable, pas à cette story.**

🪝 **Hooks inertes documentés** — posés, câblés, testés, mais **sans appelant en production** :
le chargeur, le service de production et le pont `sfd-bceao@2.0 → etats-dimf-sfd-bceao@1.0`. Aucun
endpoint n'est exposé : la story livre le gabarit et la capacité, son exposition HTTP et le rendu
imprimable relèvent des stories suivantes.

## Progress Tracking

- **Lint** 0 warning · **build** OK.
- **Tests** : 2 842 unitaires (178 suites) + 822 e2e, tous verts.
- **Couverture** : 99,18 statements / 95,44 branches / 99,39 fonctions / 99,24 lignes
  (seuils 65/90/90/90).
- **Table de mutations** — chaque garde a été vérifiée mordante :

| Mutation | Effet attendu | Mesuré |
|---|---|---|
| Le mode `extrait` traité comme un solde | les comptes « ex » cessent de basculer selon la côte | **3 rouges** |
| Contrôle d'identité de l'artefact retiré | un autre paquet servi sous la bonne clé | **1 rouge** |
| `C31` reprend le libellé fautif de la liste | la transcription régresse vers le défaut du document | **2 rouges** (checksum + libellé) |
| Fichier orphelin ajouté aux assets | la garde manifeste ↔ assets cesse de couvrir | **1 rouge** |

⚠️ Une cinquième tentative (`if (false)`) a été écartée : elle **ne compilait pas**, et « 0 test »
n'est pas un rouge.

- **Vérification docker** : **sans objet** — la story n'écrit rien en base (artefact embarqué,
  registre en mémoire, service de calcul pur). Aucune collection touchée, aucun événement publié.
- Deux gardes d'assets existantes élargies à la seconde famille d'artefacts **sans être
  affaiblies** (mutation ci-dessus).

## Revues ⑥ et ⑦ — ce qu'elles ont trouvé

**Revue de sécurité : aucune vulnérabilité** (confiance ≥ 80). Intégrité vérifiée avant parse, cache à
clé fermée, traversée de chemin impossible (manifeste codé en dur + confinement du locator), pas de
pollution de prototype, aucune fuite dans les journaux ni les erreurs. Le générateur n'est exécuté ni
par `npm run build` ni par le Dockerfile.

**Revue de code : cinq défauts de correctness sur le seul chemin de calcul** — le socle était sain,
les quinze lignes du calcul portaient tout le mal.

⚡⚡ **Le signe de la concordance n'est pas un multiplicateur.** Le `+`/`−` de l'annexe 1.1 dit dans
quel **sens** le compte se lit, puis s'il s'ajoute ou se retranche : `+` désigne un compte du sens
naturel de sa côte, `−` sa **contrepartie**, de sens inverse. Le multiplier par `−1` sur un
`débit − crédit` **déjà signé** nie deux fois.

| Mesuré sur l'artefact réel | Avant | Après |
|---|---|---|
| `A70` — brut 10 M, provision 2 M | 12 000 000 | **8 000 000** |
| `A71` — la provision SEULE | +2 000 000 *(un actif né de rien)* | **−2 000 000** |
| `D1S` — `+ 42 − 429` | 1 000 000 | **800 000** |
| `L10` — subvention créditrice | −3 000 000 | **+3 000 000** |
| `X84` — TOTAL PRODUITS | −10 000 000 | **+10 000 000** |
| lignes de passif négatives | 169 sur 380 | **0** |

⛔ **Et mon propre test verrouillait l'erreur** : intitulé « la provision se DÉDUIT », il affirmait
`6 200` sur 5 000 de brut et 1 200 de provision — la provision **ajoutée** — et son commentaire se
contredisait dans la même phrase. C'est lui qui faisait passer le défaut au vert, et il aurait fait
rougir le correctif. Même patron qu'en [[STORY-498]].

Trois autres : le mode `extrait` **compensait** le sous-arbre avant de choisir le sens (la mention
« ex » parle des comptes **au pluriel**) ; `D1S` cite une racine **et** son descendant, si bien que la
déduction de la provision s'annulait ; et le libellé de `F01` avait absorbé le fragment d'en-tête
« A NETS N NETS N-1 » — défaut de **donnée**, scellé par checksum, destiné à l'état imprimé.

Enfin, plusieurs gardes n'en étaient pas : `classe` n'était validée nulle part, la « garde » annoncée
sur les documents **créait** l'entrée manquante (d'où deux orthographes du même RCSFD dans l'artefact
livré), et quatre mutations du régime de dépôt passaient au vert.

### Table de mutations — seconde passe

| Mutation | Mesuré |
|---|---|
| Le signe redevient un multiplicateur | **8 rouges** |
| Terme le plus spécifique retiré | **1 rouge** |
| Mode `extrait` compensé avant orientation | **4 rouges** |
| Garde des lignes du chargeur retirée | **2 rouges** |
| Bruit d'en-tête réintroduit dans un libellé | **build rouge nommé** |
| `classe: 'trois'` · rythme inconnu · années négatives · clé surnuméraire | **4 builds rouges nommés** |
| Garde d'état par vérité de valeur | **4 rouges** |
| Borne d'entier sûr neutralisée | **2 rouges** |

**Portes finales** : lint 0 warning · build OK · **2 859 unitaires + 822 e2e** verts · couverture
**99,18 / 95,41 / 99,39 / 99,25**. Artefact `sha256 6e958cf4…5822`.
