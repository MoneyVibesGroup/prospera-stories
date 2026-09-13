# STORY-498 : Le paquet prudentiel BCEAO devient un artefact packagé, séparé du paquet comptable

Status: ready-for-dev

**Épic :** EPIC-121 — Socle vertical SFD
**Service :** `microfinance-service` + `scripts/referentiels/`
**Points :** 8 · **Sprint :** S20
**Origine :** découpage `epics-microfinance-2026-08-27.md`, **AD-3** de la spine — Q2 tranchée.

---

## Le fait

Les tranches d'ancienneté de retard, les taux de provision par tranche et les seuils de ratios
prudentiels sont **du droit**, pas du code. Ils viennent des instructions de la BCEAO et de la
Commission Bancaire de l'UMOA.

**Pourquoi un paquet SÉPARÉ du paquet comptable** (AD-3) : le RCSFD et la norme prudentielle évoluent
par des **textes différents**, à des **rythmes différents**. Les fusionner obligerait à republier
`sfd-bceao@2.0` — donc à **recalculer tous les checksums de liasse et invalider les snapshots** — à
chaque instruction prudentielle nouvelle. C'est le coût que STORY-368 a déjà payé une fois.

## Critères d'acceptation

- [ ] AC-1 — Un artefact `prudentiel-sfd-bceao@1.0` : tranches d'ancienneté (bornes en jours), taux
      de provision par tranche, règles de déclassement, seuils des ratios. Versionné, **vérifié par
      checksum**, chargé par le même mécanisme que les référentiels comptables.
- [ ] AC-2 — ⛔ **Chaque valeur porte sa référence** (instruction, article, année). Une valeur sans
      référence **fait échouer le build** — même garde que STORY-493 AC-2 pour le fiscal.
- [ ] AC-3 — `_meta` renseigné comme un référentiel (STORY-491) : zone `BCEAO-SFD`, les 8 pays
      UEMOA, devise, norme source, statut. ⚠️ **Statut `a-valider-par-expert` tant qu'un praticien
      SFD ne l'a pas relu** — les taux de provision sont ce qui décide de la conformité d'une IMF.
- [ ] AC-4 — Le paquet comptable `sfd-bceao@2.0` reste **inchangé, à l'octet**. Non-régression
      prouvée sur ses 372 comptes / 31 postes / 31 mappings.
- [ ] AC-5 — Une route publie le paquet prudentiel actif, avec sa version et son checksum. C'est ce
      que l'écran affichera à côté de chaque montant provisionné.

## Mesuré le 2026-09-13 — story REPORTÉE, faute de textes opposables

⏸ **Reportée sur décision user du 2026-09-13.** Elle dépend de [[STORY-497]] (sa route AC-5 vit dans
`microfinance-service`, qui n'existe pas), et surtout : **le dépôt ne contient AUCUNE valeur
prudentielle BCEAO**. Balayage fait le 2026-09-13 — tranches d'ancienneté, taux de provision, seuils
de ratios : rien, hors mentions d'intention (spine, epics, FE-105). `docs/referentiels/README-sfd-bceao.md`
ne liste que des comptes (19x/29x en souffrance, 199/299 provisions), sans bornes ni taux.

⛔ **AC-1 et AC-2 sont donc inatteignables honnêtement en l'état** : AC-2 fait échouer le build pour
toute valeur sans référence, et inventer une tranche ou un taux « vraisemblable » est précisément ce
que la règle du projet interdit. Aucun numéro d'instruction n'est cité ici de mémoire.

**Décision user du 2026-09-13 — D-498-A, la mécanique seule.** À la reprise, la story livre le
schéma prudentiel, la garde « valeur sans source ⇒ échec », le chargement vérifié par checksum, la
route de publication et la non-régression de `sfd-bceao@2.0` — **AC-1 et AC-2 restant déclarés non
livrés** tant que les textes ne sont pas fournis. Le paquet naît donc **vide et gardé**, jamais
peuplé de valeurs plausibles.

**Mesures utiles à la reprise :**

- La garde de STORY-493 est **spécifique au fiscal** : `scripts/referentiels/valider-paquet-fiscal.mjs`
  repère les fichiers au motif `paquet-fiscal-<pays>-<annee>` et suit `paquet-fiscal.schema.json`.
  Le prudentiel demande **son propre schéma et sa propre branche de validation**.
- ⚠️ « Fait échouer le build » est **PARTIEL** : la garde tourne dans `build.mjs` (lancé à la main) et,
  en CI, dans le test jest `paquet-fiscal-schema.spec.ts` — **pas** dans `npm run build`
  (= `nest build`). Le prudentiel doit se brancher sur le **test**, sinon la garde ne garde rien en CI.
- AC-4 mesuré : l'asset `sfd-bceao@2.0` est **identique à l'octet** entre `bilan-service` et
  `balance-service`, checksum sha256 conforme au registre, 372 comptes / 31 postes / 31 mappings.
- AC-3 : `a-valider-par-expert` **est** un statut prévu du vocabulaire (`meta-vocabulaire.json`), et
  la clé de méta d'un référentiel est `meta`, **pas** `_meta` (contrairement au paquet fiscal).

## Notes

- Voir [[STORY-491]] (le manifeste déclaré), [[STORY-493]] (la même garde côté fiscal), [[STORY-368]]
  (ce que coûte une republication d'artefact).
