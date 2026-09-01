# STORY-428 : Deux libellés pour le même poste dans le même paquet — un état déposé sort avec des lignes sans accents

Status: done

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — paquet référentiel + `scripts/referentiels`
**Points :** 2 · **Sprint :** à slotter
**Origine :** maquette **FE-032**, 2026-08-27.

---

## Le fait

Le service sert **deux sources de libellé différentes dans la même réponse** :

| ce qui est servi | d'où il vient | forme |
|---|---|---|
| poste de **détail** (`TA`, `RH`, `RI`…) | `cible.libelle` = **table de passage** | **sans accents** |
| **SIG** (`XA`…`XI`) | `libellesPostes()` = **`pkg.postes`** | **avec accents** |

`compte-resultat-production.service.ts` :

```ts
// détail  → accu.libelle = cible.libelle              (tableDePassage)
// SIG     → libelle: libelles.get(r.poste)            (pkg.postes)
```

Les deux versions cohabitent dans `syscohada-revise-2.1.json`, à quelques lignes l'une de
l'autre :

```
tableDePassage : "Achats de matieres et fournitures liees"   ← servi
pkg.postes     : "Achats de matières et fournitures liées"   ← existe, non servi
```

Un écran qui restitue la liasse mélange donc, **ligne à ligne**, « *Impots et taxes* »,
« *Services exterieurs* », « *Reprises d'amortissements, provisions et depreciations* » avec
des paliers correctement accentués (« *VALEUR AJOUTEE* » est en capitales sur le formulaire
officiel, ce n'est pas le même cas).

Sur un état **destiné au dépôt**, ce n'est pas un détail cosmétique.

## Le même défaut frappe le Bilan

`BILAN_ACTIF` / `BILAN_PASSIF` servent aussi le libellé de `tableDePassage` — donc
« *Resultat net de l'exercice (+ benefice / - perte)* ». Corriger seulement le compte de
résultat laisserait l'incohérence d'un état à l'autre.

---

## Critères d'acceptation

- [x] AC-1 — Les libellés de `tableDePassage` du paquet `syscohada-revise@2.1` sont alignés sur
      les libellés officiels de `pkg.postes` (accents compris), pour **tous** les états.
- [x] AC-2 — Un test de cohérence de paquet (famille `*-coherence.spec.ts`, déjà 6 fichiers)
      **échoue** si un `tableDePassage[].libelle` diffère du `pkg.postes[].libelle` du même code,
      à la ponctuation de fin près (les repères `A`/`B`/`C`/`D` en queue de libellé officiel).
- [x] AC-3 — Aucun changement de code moteur : la correction est **une donnée**, pas une règle
      (invariant P7).
- [x] AC-4 — Même vérification passée sur `sfd-bceao@2.0`, `cima-assurances@1.0` et
      `zone-franche-togo@1.0` ; les écarts constatés sont corrigés ou explicitement listés.

## Vigilance

- ⚠️ Le **checksum** du paquet change ⇒ le `stamp` (`EffectiveReferentielStamp`, FR-005 AC-3)
  change avec lui. Toute liasse déjà **enregistrée** portera l'ancien tampon : c'est le
  comportement voulu (traçabilité), mais il faut que la **version** du paquet bouge
  (`2.1` → `2.2`), sinon deux contenus différents partagent une version.
- ⚠️ Ne pas régénérer le paquet depuis `scripts/referentiels/sources/*.json` sans vérifier que
  la source elle-même est accentuée : le défaut peut y être né.

## Conséquences ailleurs

- **FE-032** affiche aujourd'hui le mélange **tel quel**, volontairement : maquiller un libellé
  côté écran ferait diverger l'affichage du contenu qui sera exporté (STORY-064/065).

---

## ⛔ LA FICHE ALLAIT TROP VITE : « aligner » n'est pas « ajouter des accents »

Mesuré sur les artefacts avant correction : **97 écarts** sur les 124 règles SYSCOHADA, dont
**24 seulement** étaient un écart d'accent. Les 73 autres sont de trois natures, et deux
d'entre elles n'étaient pas anticipées :

1. la table de passage portait une **annotation de mapping du mainteneur** — « *Batiments
   (net 2831)* », « *IMMOBILISATIONS INCORPORELLES (net amort 281x, deprec 291)* » — qui
   **fuyait dans la réponse servie**. Elle est conservée **dans la source** sous
   `_libelleMapping`, que `normMapping` de `build.mjs` (liste blanche de clés) n'atteint
   jamais ;
2. le libellé officiel reprend le formulaire **tel qu'il est**, irrégularités comprises :
   `Brevets, licences,logiciels` sans espace, `Terrains (1) dont placement en Net`, et
   `AVANCES ET ACOMPTES VERSES SUR IMMOBILISATIONS` **en capitales non accentuées**. Aligner
   *retire* donc des accents sur certaines lignes. C'est voulu : la référence est l'imprimé
   officiel, pas notre idée de sa forme.

## ⛔ VERSION NON BUMPÉE — contre la Vigilance, et c'est la doctrine du dépôt

Le `ReferentielRegistry` énonce **deux fois** la règle inverse — « révision **en place**
légitime tant que la version n'est attribuée à aucune organisation » (STORY-368 sur
`sfd@1.0`, STORY-122 incr. 2 sur `cima@1.0`) — et `syscohada@2.1` a déjà subi **cinq**
révisions en place (056, 061, 111, 112, 369).

⚠️ **La revue de code a eu raison sur un point** : ces deux énoncés sont *conditionnés* à
« version non attribuée », or `@2.1` est le référentiel **par défaut du produit**. La
doctrine est donc désormais **étendue explicitement** dans le registre, avec son vrai
fondement et sa borne :

- **le fondement n'est pas le précédent, c'est le CHECKSUM** — une liasse enregistrée fige
  son `stamp` **complet** (`{code, version, checksum}`), et le snapshot avec elle. La
  version cesse d'être une clé d'identité suffisante ; l'empreinte, elle, le reste ;
- **le coût du bump** serait de garder `@2.1` packagé pour les octrois existants, donc de
  **conserver les libellés fautifs** pour toutes les organisations déjà servies — l'inverse
  de l'objet de la story ;
- **la borne** : le jour où une migration d'octrois est outillée, c'est un bump qu'il faut.

Corollaire corrigé au passage : `referentielHomogene` était publié « *false si les exercices
partagent le code mais pas la version* », alors que la déduplication porte sur
`{code, version, checksum}`. Deux entrées peuvent afficher le **même `code@version`** et
différer par leur seule empreinte — le contrat le dit maintenant.

---

## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité), **vérification docker
réelle rejouée sur l'état final**, **DEUX PR rebase-mergées ensemble** :
`bilan-service` **#58** et `balance-service` **#84**.

### Ce qui est livré

- **AC-1/AC-4** — 120 lignes réalignées **dans les 4 sources**, les 5 paquets régénérés :
  syscohada 97, `sfd@2.0` 12, `sfd@1.0` 9, cima 2. Les 5 checksums du registre et les 5
  digests épinglés bougent ensemble (`syscohada` et `zone-franche` partagent leurs sources).
- **AC-3** — **aucun code moteur touché**. Le seul `.ts` de production du premier commit est
  `referentiel-registry.ts`, et uniquement ses 5 empreintes. La correction est une **donnée**.
- **AC-2** — `libelles-coherence.spec.ts` : sur les 5 artefacts réels, aucun
  `tableDePassage[].libelle` ne peut plus diverger du libellé officiel. **Une seule**
  tolérance, celle que l'AC accorde — le repère de colonne (`A`/`B`/`C`/`D`), et le test fige
  qu'il n'y en a **exactement quatre**. Neuf témoins, dont sept **négatifs**.

### Portes DoD

Lint 0 warning · build OK · `bilan-service` **1 286 unitaires + 353 e2e**, couverture
98,60 / 93,42 / 98,31 / 98,57 · `balance-service` **3 584 unitaires + 884 e2e**, couverture
99,14 / 92,37 / 98,65 / 99,24. **5 mutations, 5 rouges**, aucune par erreur de compilation.

⚠️ **La mutation honnête a demandé un détour** : muter un artefact directement le fait
rejeter par le loader (`ReferentielIntegrityError`) — rouge pour la **mauvaise** raison. Il
faut muter la **source**, régénérer, reporter les checksums, et alors seulement la garde
rougit sur une vraie assertion.

### Vérification docker — Mongo réel, référentiels réels, rejouée après les correctifs de revue

| Mesure | Résultat |
|---|---|
| chargement des **5** paquets | tous acceptés, le loader vérifie le sha256 avant mise en cache |
| `stamp` servi | porte la nouvelle empreinte `af1a74c4…` |
| libellés du compte de résultat | « Achats de **matières** et fournitures **liées** », « Services **extérieurs** », « **Impôts** et taxes » |
| libellés du Bilan | « Frais de **développement** », et au passif « Résultat net de l'exercice (bénéfice + ou perte -) » |
| les 4 coquilles corrigées en revue | `RD` « fou**rn**itures », `RM` « assimilé**es** », `AM` « mobilier », `CM` « régle**m**entées » |
| ⚡ **les deux surfaces disent enfin la MÊME chaîne** | `GET …/referentiel/postes` et le dry-run rendent tous deux « Autres produits », « Bâtiments (1) dont placement en Net », « Matériel, mobilier et actifs biologiques » |
| agnosticisme | `sfd@1.0`, `sfd@2.0`, `cima@1.0`, `zone-franche@1.0` chargent et servent leurs libellés officiels |

### Revue de code — 7 constats, tous traités (commit dédié)

⛔ **BLOQUANT — un changement d'artefact partagé touche DEUX dépôts, et je l'avais manqué.**
Trois des cinq artefacts sont recopiés **à l'octet** dans `balance-service`, qui possède une
garde lisant réellement le dépôt voisin (`referentiel-assets-coherence.spec.ts`, née de
STORY-368/AD-6 précisément parce qu'elle était restée muette trois semaines sur ce
scénario). Mesuré : sa suite **passait au rouge**, sans qu'aucune de ses stories n'ait rien
touché. PR contrepartie ouverte et mergée avec l'autre. ⚠️ **Aucun effet fonctionnel**
là-bas — son `tableDePassage()` ne lit jamais `libelle` — c'est la **byte-identité** qui
cassait.

⚡⚡ **MAJEUR — quatre libellés SERVIS devenaient orthographiquement FAUX.** La cible
d'alignement portait quatre coquilles de transcription, jusque-là invisibles parce que ces
postes étaient servis depuis la table de passage. Toutes démenties par le **plan de comptes
du même paquet** :

| poste | ce que la story allait servir | correct | plan |
|---|---|---|---|
| `CM` | Provisions **réglé**mentées | réglementées | `15` |
| `RD` | … et **fouritures** liées | fournitures | `6032` |
| `AM` | Matériel, **mobiliers** | mobilier | `24` |
| `RM` | charges **assimilés** | assimilées | `67` |

Sans ce constat, la story aurait fait sortir « fouritures » sur une liasse **destinée au
dépôt** — l'inverse exact de son objet — et le garde-fou neuf les aurait **verrouillées**.

⚡ **MOYEN — la tolérance sur les blancs internes laissait subsister le défaut sur six
postes.** `AK`, `TH`, `TJ`, `RL`, `RN` et `TFT/FI` portaient un double espace dans `postes`
et un simple dans la table de passage : **deux libellés servis**, l'un par le TFT et
`GET …/referentiel/postes`, l'autre par le Bilan et le CR. Or l'AC-2 n'accorde qu'**une**
tolérance. Les six blancs sont corrigés dans la source, la tolérance retirée.

MINEURS — le JSDoc d'`officiel()` affirmait reproduire « exactement la résolution du
moteur » : il y en a **trois**, différentes (mutation : inverser l'ordre laissait les 18
tests verts) · la borne `\s{2,}` du repère n'était gardée par **aucun** témoin (mutation
`\s+` : verte) · deux commentaires de `DIGESTS_EPINGLES` surplombaient des valeurs d'une
autre story.

### Revue de sécurité — aucune vulnérabilité (confiance ≥ 80)

Vérifié **par calcul**, pas par lecture : la chaîne `sources → build.mjs → artefacts` est
**reproductible de bout en bout** (les 5 fichiers ressortent byte-identiques dans un arbre
isolé), les 5+3 checksums concordent dans les deux dépôts, zéro ancien checksum résiduel
dans les 7 services. **Inventaire des points de code avant/après : identique** — aucun
caractère de contrôle, invisible ou bidi introduit. Injection de formule écartée sur mesure
(32 libellés commencent par `+`/`-`, mais `bilan-service` n'exporte pas de CSV, exceljs écrit
une **chaîne** jamais une formule — vérifié empiriquement —, et le seul export CSV de la
plateforme neutralise déjà `^[=+\-@\t\r]`). Injection PDF écartée : pdfkit émet en
hexadécimal. Non-répudiation intacte : une version figée n'est **jamais** recalculée,
`empreinteDocument` ne bouge pas, et l'artefact retiré reste récupérable par
`git show dev:…`. `TftProductionService.roleAncre()` **dérive un rôle du texte du libellé** —
rejoué sur les 5 paquets avant/après : **aucun rôle ne change**.

### Bornes assumées, nommées plutôt que tues

- 🪝 **Sous le seuil de la revue de sécurité, à ficher** : `ExportService.chargerBrouillon`
  imprime `jeu.checksum` (la valeur **stockée sur le document**) sur un contenu **recalculé
  à l'instant** avec le paquet courant. Un jeu resté BROUILLON avant le merge, exporté après,
  porte donc l'ancienne empreinte sur un document produit avec la nouvelle. Le document
  affiche « BROUILLON — NON FIGÉ » sur chaque page et n'est pas opposable, le contrat HTTP
  est correct, le chemin **figé** est correct — mais c'est une dette de fidélité de tampon,
  **ouverte depuis STORY-369**, pas par celle-ci.
- Les **repères A/B/C/D** vivent toujours en queue du libellé officiel (`TA`..`TD`) : la
  Vigilance de STORY-427 proposait un champ `repere`, **non traité** ici (hors AC).
- Trois postes `RESULTAT_FISCAL` portent encore des blancs parasites et une coquille
  (`Bénéficaire`) : **hors périmètre** — aucune règle de table de passage ne les vise, donc
  ils échappent à l'AC-2. À instruire avec le paquet fiscal.
- Les 4 pseudo-postes d'en-tête `"Réf"` / `"Réf."` (lignes de titre du tableur source,
  jamais rattachées) restent dans `pkg.postes` : STORY-399 les avait fichés « à instruire
  avec 427 et 428 », ils méritent une story dédiée.
