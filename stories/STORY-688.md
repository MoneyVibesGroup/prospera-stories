# STORY-688 : Un compte à solde inversé refuse le livrable e-DSF entier — 411 créditeur sous BI, 47 qui change de sens

Status: done

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` (garde AC-3 de STORY-680, décompte de complétude de STORY-556)
**Points :** 3 · **Complexité :** medium · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** revue de code de STORY-680 (2026-10-01) — constat C2, laissé conforme à l'AC-3.

---

## Le fait, mesuré

`ventilerParCompte` (bilan-service) pose `brut = Σ débit`, `amort = Σ crédit` par compte. Un compte au solde
inversé porte donc un montant dans une colonne de dépréciation que la note ne prévoit pas pour lui, et la
garde `LIASSE_NON_TRANSCRIPTIBLE` de 680 refuse **tout le classeur**, états compris — là où la v1.0 le produisait.

| Ventilation ajoutée | Refus |
|---|---|
| sous BI : `411100` `amortN = 20000` | `{note: '7', poste: 'BILAN_ACTIF\|BI', compte: '411100', champ: 'amortN'}` |
| sous BJ : `471000` `brutN = 100000`, `amortN1 = 30000` | `{note: '8', poste: 'BILAN_ACTIF\|BJ', compte: '471000', champ: 'amortN1'}` |

Le cas 47 est documenté par bilan-service comme « réellement atteignable » (STORY-439).

## Critères d'acceptation

- [x] AC-1 — Trancher (PO) : la note concernée sort **vierge et tracée** (le reste du classeur est produit), ou
      le montant se reclasse sur une ligne sourcée. → **tranché le 2026-10-07 : note vierge tracée** (D-688-1).
- [x] AC-2 — Aucun montant perdu sans bruit : la trace et la complétude le disent.
- [x] AC-3 — Les deux exemples ci-dessus en tests, mutation à l'appui.

## Cadrage (2026-10-07)

### Constats

- **C1 — La cause ne se lit pas dans la donnée.** Un compte sans ligne dans sa colonne est soit un solde
  inversé (411 créditeur, 47 qui change de sens), soit un compte que la feuille ne prévoit pas du tout (le
  `278400` de l'AC-3 de 680). fiscal-service ne sait pas les distinguer sans règle comptable — et la
  conséquence est la même : la note ne peut pas être transcrite fidèlement.
- **C2 — Deux gardes dans `verifierPoste`, de natures différentes.** « Un compte sans ligne » est une limite
  du **formulaire** ; « la ventilation ne fait pas le poste » (`ecart`) est une incohérence de la **donnée
  amont**. Seule la première est en cause ici.
- **C3 — Une note à moitié remplie ment.** Le formulaire totalise la note par `SOMME` : vider la seule
  colonne fautive laisserait les autres colonnes écrites et un total qui ne rejoint pas l'état sans le dire.
- **C4 — Le décompte de complétude ne voit pas les montants.** Il lit `GET …/versions/:version/contenu`, qui
  ne porte ni postes ventilés ni comptes : il dirait « produite » une feuille que le livrable laisse vierge.

### Décisions

- **D-688-1 (PO, 2026-10-07) — La note sort vierge et tracée.** Le reste du classeur, états compris, est
  produit. Aucune règle de reclassement n'est inventée : le cabinet saisit la note.
- **D-688-2 — Tout compte sans ligne, pas seulement les soldes inversés** (C1) : le `278400` de 680 suit la
  même règle — son test passe d'un refus à une note vierge tracée.
- **D-688-3 — L'écart ventilation ≠ poste reste un refus** `LIASSE_NON_TRANSCRIPTIBLE` (C2) : c'est la donnée
  amont qui est fausse, pas le formulaire qui est trop étroit.
- **D-688-4 — Toutes les cases MONTANT de la note** (tous états, toutes colonnes, totaux compris) restent
  `NON_PRODUIT` avec le motif (C3). Les cellules de trame d'une note `MIXTE` restent écrites : elles ne
  dépendent pas de la ventilation.
- **D-688-5 — Le motif nomme** la note, puis chaque compte en cause (poste, compte, champ, montant), trois au
  plus, suivis du nombre des autres. Il prime sur le motif « balance N-1 après détermination ».
- **D-688-6 — La complétude relit la liasse figée** (`GET …/versions/:version`, même jeton, même plafond)
  **seulement** si la liasse est du référentiel des notes du paquet — sinon le livrable n'écrit aucune note
  et rien ne change. La feuille qui porte une note non transcrite va dans `produitesNonTranscrites`, motif
  à l'appui ; `aCompleter` garde la priorité (l'action du cabinet prime). Le calcul est **celui du livrable**
  (même fonction pure) — jamais une seconde règle.

### Hors périmètre

- Une ligne de reclassement sourcée (option écartée par le PO) et toute règle comptable de solde inversé.
- Le sens de `ventilerParCompte` côté bilan-service (STORY-439) : inchangé.
- STORY-689 (version de paquet du dépôt transmis).

## Notes

- Voir [[STORY-680]], [[STORY-439]], [[STORY-556]].

## Progress Tracking

**Statut : `done` (2026-10-07).** `prospera-fiscal-service#14` rebase-mergée sur `dev` (`7e2c450` + revue `58d5b72`).

- 2026-10-01 — créée par la revue de STORY-680 (`ready-for-dev`).
- 2026-10-07 — cadrage : 4 constats, 6 décisions ; AC-1 tranché par le PO (note vierge tracée).
- 2026-10-07 — dev : `preparerNotes` calcule `nonTranscrites` (par note, comptes non nuls sans ligne dans leur
  colonne) ; `resoudreCaseNote` laisse toutes les cases montant de la note `NON_PRODUIT` avec ce motif (avant le
  motif N-1, après les trames) ; `verifierPoste` ne garde que l'écart ; la complétude relit la liasse figée sous
  le référentiel des notes et passe par la même fonction.
- **Portes** (état final) : lint 0 · build OK · 1 615 unit (99,29 / 96,47 / 99,03 / 99,64) · 119 e2e. Un échec
  de chronométrage sur `balayage-lineaire.spec.ts` (521 ms pour 500, fichier non touché) : 3/3 vert rejoué seul.
- **Tests des exemples (AC-3)**, sur le vrai paquet TG×DSF v1.1 : `411100` `amortN` sous BI ⇒ note 7 vierge,
  motif nommé, reste produit ; `471000` `brutN` + `amortN1` sous BJ ⇒ note 8 vierge, fichier PRODUIT et relu
  (cases de la note 8 vides, note 6 écrite) ; `278400` ⇒ note 4 vierge (ancien refus de 680) ; complétude :
  `485100` au solde inversé ⇒ NOTE 5 de « produite » à « non transcrite ».
- **Mutations : 13/13 rouges**, toutes compilables (« Tests: N failed » lu, pas seulement « Suites ») :
  résolution sans vierge, colonnes amort ignorées, plafond de comptes nommés, complétude muette, priorité
  `A_COMPLETER`, carte vide, relecture hors référentiel, écart non refusé, compte à zéro compté, note vierge
  avant la trame, feuille à compléter muette, version figée hors référentiel acceptée, module sans la source.
- **Revue de code** (opus par axes : 0 constat ; lentilles ECC) — 4 constats retenus et corrigés dans `58d5b72` :
  une note vierge sur une feuille `A_COMPLETER` n'était pas dite (le motif s'y ajoute désormais) ; une version
  figée relue hors du référentiel de son contenu rendait une carte vide (⇒ 502 `LIASSE_AMONT_INVALIDE`) ; le
  câblage de la source dans le vrai module n'était éprouvé par aucun test (invariant ajouté) ; D-688-4 (trame
  d'une note vierge écrite) n'avait aucune donnée qui l'exerce (cas ajouté). **Laissés** : exposer les notes
  vierges en champ structuré plutôt qu'en motif (évolution de contrat, hors périmètre — le motif est la
  décision D-688-5) ; `ContexteNotes` discriminé sur `actif` (aucun défaut aujourd'hui) ; ponytail : −4 lignes
  cosmétiques.
- **Revue de sécurité** (opus) : **0 constat** — seconde lecture sous la même portée dossier côté bilan-service
  (`@RequiresDossierScope`, 404 hors portée), même jeton, même plafond ; le motif ne sort qu'en JSON, jamais
  dans le classeur.
- **Vérification docker : sans objet** — la story n'écrit rien en base ; la lecture relue passe par
  l'adaptateur `HttpSourceLiasseFigee` déjà éprouvé sur stack réelle par STORY-680/682 ; son câblage est tenu
  par l'invariant de module.
