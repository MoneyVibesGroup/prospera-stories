# STORY-446 : « Liasse déposée » est affiché pour une liasse seulement FIGÉE — et l'état DÉPOSÉ n'existe nulle part

Status: ready-for-dev

**Épic :** EPIC-012 — Validation, immutabilité, exercices, audit
**Service :** `bilan-service · dossier-service`
**Points :** 5 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-034** (cycle brouillon → validé, snapshot immuable, piste d'audit), 2026-08-27.
Relevé en lisant les contrôleurs de `bilan-service` sur `origin/dev`.

---

## Le fait

Deux constats qui se renforcent.

**① Le produit dit « déposée » là où il ne sait que « figer ».** `AvancementDossier.LIASSE_FIGEE`
est documenté dans `dossier-service` par : *« `LIASSE_FIGEE` → « Liasse déposée »»*, et la carte du
portefeuille l'affichait ainsi. Or au Togo, **déposer** est un acte devant l'**OTR**, avec un
accusé et une date d'échéance opposable. Un cabinet qui lit « Liasse 2024 déposée » sur un dossier
croit sa DSF télédéclarée alors qu'elle est seulement figée dans Prospera.

**② L'état n'existe pas.** `JeuEtatsStatut` ne compte que `BROUILLON` et `VALIDE` ;
`liasse.etat.change` ne publie que `FIGEE`/`BROUILLON` ; et `etats-amont-enveloppe.util` de
`dossier-service` **rejette explicitement** `DEPOSEE` (« *etat inconnu (DEPOSEE)* »).

## Critères d'acceptation

- [ ] AC-1 — **Correction immédiate, sans dépendance** : tout libellé « déposée » adossé à
      `LIASSE_FIGEE` devient « **figée** » (commentaire de l'énuméré, maquette, front).
- [ ] AC-2 — `JeuEtatsStatut` gagne `DEPOSE`, atteignable **uniquement** depuis `VALIDE`, et
      **jamais** rouvrable sans passer par une réouverture tracée (STORY-444).
- [ ] AC-3 — Le dépôt porte ses **faits** : date de dépôt, canal, **numéro d'accusé**,
      **identité du signataire** (nom + n° d'inscription à l'ordre), et le **`snapshotId`** de la
      version déposée — une liasse se dépose dans **une** version, pas « en général ».
- [ ] AC-4 — `liasse.etat.change` publie `DEPOSEE` ; `etats-amont-enveloppe` l'accepte ;
      `AvancementDossier` gagne `LIASSE_DEPOSEE`.
- [ ] AC-5 — `AuditType` gagne `LIASSE_DEPOSEE`, avec le `contexte` du dépôt.
- [ ] AC-6 — **Rien n'est déposé par le produit** dans cette story : la télédéclaration appartient
      à `fiscal-service`. On enregistre un dépôt **constaté**, on ne le réalise pas.

## Conséquences ailleurs

- Écran : **FE-081** (dépôt & accusé).
- L'AC-1 est appliquée **par la maquette FE-034** : la carte du portefeuille dit désormais
  « Liasse 2024 **figée** ».
- Ouvre la question de l'**approbation par le client** avant dépôt : le produit ne connaît que des
  utilisateurs du cabinet (personas du PRD Atelier). À instruire avec FE-081, pas ici.
