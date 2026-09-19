# STORY-509 : États DIMF 2000 et 2080 — et le jalon `format confirmé` avant d'écrire une ligne

Status: blocked

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

---

## ⛔ Jalon NON LEVÉ — constat daté du 2026-09-19

**Cette story ne peut pas démarrer, et c'est elle-même qui l'interdit** : « aucune ligne de code
avant d'avoir en main le gabarit officiel », AC-1 exigeant qu'il soit « sourcé et référencé
(instruction, année, version) **et versé au dépôt** ». État vérifié dans l'arbre, pas déduit :

| Vérification | Résultat |
|---|---|
| un code de ligne DIMF (`A2A`, `F2C`, `R3G`, `V4E`, `E90`, `L90`…) quelque part dans l'arbre, hors `node_modules` | **zéro occurrence** |
| `tmp/pdfs/` suivi par un dépôt git | **non** — la racine `PROSPERA/` n'est pas un dépôt, et `docs/` ne suit aucun chemin `tmp/` |
| ce que `docs/referentiels/documents-a-fournir.md` dit de lui-même, ligne **F7** | 🟡 « États réglementaires SFD — DIMF 2000 / DIMF 2080 » → **amorce** |
| `bilan-service/…/assets/sfd-bceao-2.0.json` | son `normeSource` **cite** les états DIMF, mais ses 31 postes sont des codes **internes Prospera** (`BA1..BAT`, `RC1..RSG`) — sans rapport avec `A01`/`F01`/`R08`/`V08` |

⇒ Le dépôt porte une **mention** que les postes sont « dérivés des états DIMF », jamais un
**gabarit de dépôt**.

### Ce qui existe, hors dépôt, et ce qu'il vaut

`tmp/pdfs/rcsfd-officiel.pdf` (RCSFD, 201 p.) et dix rendus d'annexes en PNG. Vérifié en lisant les
images — `pdftotext` ne rend que du charabia sur ces pages, la police n'ayant pas de table Unicode
(piège déjà consigné dans `README-prudentiel-sfd-bceao.md`) :

- **pages A23-A25** — le **DIMF 2000 « BILAN VERSION ALLEGEE » est COMPLET** : colonne `Code poste`
  (`A01, A10, A11, A12, A2A, A2H…A73` à l'actif ; `F01, F1A, F2A…F60` au passif), colonnes
  `BRUT / AMT-PROV / NET` en N et N-1, totaux `E90` / `L90`, en-tête `Etat:` + `Date d'arrêté
  AAAA/MM/JJ` + `(en Francs CFA)`. **C'est réel et réutilisable.**
- **pages A29-A30** — le **DIMF 2080 est TRONQUÉ** : les pages A31-A32 (fin du compte de résultat
  **et tout le tableau des Soldes Intermédiaires de Gestion**) ne sont pas rendues.
- **ANNEXE 1 (A5-A20)** — « nomenclature des codes postes **et concordance avec le plan de
  comptes** » : **pas rendue du tout**. C'est précisément la table sans laquelle AC-2 (« produire
  l'état depuis la liasse **déjà calculée** ») est infaisable sans inventer le mapping.

### ⚡ Ce qui bloque vraiment, et qu'aucun travail de transcription ne lèvera

Même parfaitement transcrites, ces annexes ne donnent **pas** ce que la voie A exige :

1. **Le format de fichier déposable et son canal.** Le RCSFD ne dit que « supports papier ou
   électronique », avec dossier + bordereau d'authentification + carte de spécimens de signature.
   **Aucun schéma, aucun téléservice, aucune adresse.** Or [[STORY-525]] engage le produit à
   *produire le fichier*, et [[STORY-536]] réclame un `format.schema` et un `canal` **sourcés**.
2. **La périodicité infra-annuelle d'AC-4.** Le texte dit « remise **annuelle** pour les SFD » et
   renvoie, pour les états périodiques, à « une périodicité fixée par la BCEAO » — **fixée
   ailleurs**, dans un texte que le dépôt n'a pas.

⇒ Ces deux faits ne se déduisent d'aucune source en notre possession. Les inventer, c'est
exactement la faute que cette story nomme en préambule : *deux erreurs plausibles, donc invisibles
à la relecture.*

### Ce qu'il faut pour débloquer

- [ ] **① Obtenir du PO** le format de dépôt effectif et son canal (téléservice ? gabarit tableur
      transmis ? dépôt physique ?), et la périodicité réellement exigée des SFD.
- [ ] ② Verser au dépôt le PDF RCSFD et ses rendus, avec leur `sha256` et leur date de relevé —
      `tmp/` n'appartient à aucun dépôt aujourd'hui.
- [ ] ③ Rendre les pages PDF **165-166** (fin DIMF 2080 + SIG) et **139-154** (ANNEXE 1,
      concordance codes postes ↔ plan de comptes).
- [ ] ④ Transcrire codes, ordre et colonnes en artefact machine avec sa provenance (instruction,
      page, date, `sha256`), comme `README-prudentiel-sfd-bceao.md` l'a fait pour le prudentiel.
- [ ] ⑤ Acter que le gabarit en main est la version **allégée** : `README-prudentiel-sfd-bceao.md`
      (D-659-A) note que la version développée s'impose aux SFD > 50 M FCFA et **n'a été trouvée
      publiée nulle part**. La couverture sera partielle par construction.

**① est seul bloquant** : ②③④ sont du travail que nous pouvons faire, ① dépend d'une source que
nous n'avons pas.

### Rattachement à l'existant

[[STORY-536]] est **livrée** (2026-09-19) : le contrat de paquet de dépôt que cette story
consommera existe désormais — `format` + `schema`, `gabarit` poste → case **sourcé case par case**,
`canal`, `calendrier`, `penalites`, vérifié par checksum. ⚠️ Son alphabet d'`etat`
(`^[A-Z][A-Z0-9-]{1,39}$`) n'accepte ni espace ni minuscule : les états devront être codifiés
`DIMF-2000` et `DIMF-2080`.
