# STORY-461 : Le BFR réel de la base n'est publié nulle part — on saisit un délai clients sans connaître le délai constaté

Status: ready-for-dev

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé en lisant `AncresProjection` : ni créances, ni stocks, ni dettes fournisseurs.

---

## Le fait

Le premier geste d'un comptable qui prépare un prévisionnel est de **calculer les délais constatés** de
l'exercice écoulé : `créances / CA × 360`, `stocks / achats × 360`, `dettes fournisseurs / achats × 360`.
Il part de là, puis décide s'il les améliore ou les dégrade.

`AncresProjection` publie cinq nombres — produits, charges, résultat, total actif, trésorerie — et
**aucun poste de BFR**. L'écran de saisie ne peut donc afficher **aucun** délai constaté. Le comptable
saisit à l'aveugle.

Pire : `bfrNormatif` est appliqué **aussi à l'exercice de base** (délibérément, pour que la variation de
la 1ʳᵉ année soit homogène). Le BFR réel du bilan est donc **remplacé** par un BFR normatif dès le
départ, sans que l'écart entre les deux soit jamais montré. Sur le dossier de démonstration, le BFR
normatif de base vaut **2 606 354** — soit **57 jours** de produits, et **46 % du total actif** — sans
qu'on sache s'il ressemble au BFR réel.

## Critères d'acceptation

- [ ] AC-1 — `AncresProjection` gagne `bfrReelBase: { stocks, creancesClients, dettesFournisseurs,
      montant } | null`, alimenté par des **marqueurs** de paquet référentiel (patron `tresorerie?`),
      jamais par des codes de poste — l'invariant P7 tient.
- [ ] AC-2 — La réponse expose les **délais constatés** correspondants (base 360, mêmes assiettes que
      `bfrNormatif`), pour que la comparaison soit une identité et non un rapprochement.
- [ ] AC-3 — `bfrReelBase: null` quand le référentiel ne publie pas les marqueurs — signalé, jamais
      remplacé par un zéro.
- [ ] AC-4 — L'écart `bfrNormatif(base) − bfrReelBase` est publié : c'est la mesure du saut que le
      modèle fait à l'exercice 0, et il doit être visible.

## Conséquences ailleurs

- Sans ces valeurs, l'écran FE-035 ne peut proposer **aucune** valeur de départ crédible pour les trois
  délais ; il affiche donc des valeurs choisies par l'écran, et le dit.
- Voir **STORY-469** : les délais du métier se calculent TTC.
