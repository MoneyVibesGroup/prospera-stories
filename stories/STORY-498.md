# STORY-498 : Le paquet prudentiel BCEAO devient un artefact packagé, séparé du paquet comptable

Status: review

**Complexité :** medium

**Épic :** EPIC-121 — Socle vertical SFD
**Service :** `microfinance-service` *(y compris son propre `scripts/referentiels/`, qui n'existait pas — la fiche le citait comme un emplacement existant)*
**Points :** 5 *(ramenée de 8 le 2026-09-13 : la mécanique seule, D-498-A)* · **Sprint :** S20
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

## ▶️ Reprise le 2026-09-13 — re-mesurée sur le socle livré

Le report du matin tenait à l'absence du service. **STORY-497 est livrée** : la story reprend, sous
**D-498-A** (décision user) — la **mécanique seule**, AC-1 et AC-2 déclarés **non livrés**, aucune
valeur inventée.

| Affirmation | Verdict | Mesure |
|---|---|---|
| Le chargeur du socle accueille le prudentiel « **sans modification** » (rapport de l'agent du socle) | **PARTIEL** | la mécanique est générique (sha256, cache, single-flight), mais `nature` n'accepte que le littéral `'référentiel'` ⇒ à élargir |
| Le paquet se charge « par le même mécanisme » (AC-1) | **VRAI** | même source d'assets, même `nest-cli.json` — mais une garde exige que `assets/` contienne **exactement** l'artefact comptable : il faut séparer les artefacts **partagés** de l'artefact **propre** |
| La garde de source « fait échouer le build » (AC-2) | **PARTIEL** | elle tourne en **test jest** (`execFileSync`), jamais dans `nest build` |
| La garde R4 protège chaque valeur | **PARTIEL** | elle ne voit que nombres et booléens (une règle écrite en texte lui échappe), et une `source` posée sur une rubrique couvre tout son sous-arbre ⇒ le **schéma** doit exiger une source par tranche et par seuil |
| Statut `a-valider-par-expert` (AC-3) | **FAUX pour un paquet vide** | le vocabulaire réserve ce statut à une transcription qui **couvre** sa norme |
| `sfd-bceao@2.0` inchangé (AC-4) | **VRAI, et désormais en 3 copies** | sha256 `91ca19e2…87bf2ac` identique dans `bilan-service`, `balance-service` et `microfinance-service` ; mais aucun des deux voisins ne compare la copie de `microfinance-service` |
| ⚠️ Constat hors fiche | — | aucune `ArtefactError` n'est traduite en HTTP dans le socle : un checksum violé rend **500** au lieu de **502**, route de diagnostic existante comprise |

### Décisions du 2026-09-13

- **D-498-B — statut `amorce`, pas `a-valider-par-expert`.** Un paquet volontairement vide déclaré « à
  valider par un expert » affirmerait une couverture qui n'existe pas. `amorce` + `miseEnGarde` dit la
  vérité, ce qui est l'intention même d'AC-3 : ne jamais surévaluer la maturité d'un texte réglementaire.
- **D-498-C — la route est scopée au dossier.** L'invariant du socle impose le gate d'accès sur toute
  route nichée sous un dossier ; au niveau organisation il faudrait le poser à la main, et un oubli
  laisserait la route ouverte sans erreur.
- **D-498-D — la traduction HTTP des `ArtefactError` entre dans cette story**, route de diagnostic
  comprise : la nouvelle route en a besoin, et un 500 anonyme sur une intégrité violée n'est pas un refus.
- **D-498-E — le validateur est recopié en ADAPTANT, pas à l'octet.** Chaque service est un dépôt
  séparé et aucun mécanisme de partage n'existe ; une copie exacte créerait une quatrième identité à
  tenir entre dépôts, pour des règles (R2, R3, R5, R7, R8) purement fiscales. Coût accepté et écrit : un
  correctif futur de R4 côté fiscal ne se propagera pas tout seul.

⛔ **La preuve ne doit pas être vacante sur un paquet vide** : un validateur qui ne trouve rien à refuser
passe toujours. Elle exige une **fixture temporaire** portant une valeur sans source, qui fait échouer la
garde, et sa jumelle **avec** source, qui passe.

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

## Progress Tracking

**Statut : `review`.** PR `microfinance-service` **#2**. AC-1 et AC-2 **non livrés** par décision (D-498-A).

### Portes — rejouées en session après correctifs

lint 0 warning · build OK · **810 unitaires / 56 suites** · **38 e2e / 3 suites** · couverture
99,77 / 93,18 / 99,5 / 99,75 (seuils 65/90/90/90 inchangés). 8 mutations au développement et 5 en
revue, **toutes rouges par assertion**.

### Revue de code et de sécurité — un bloquant, deux non-bloquants, aucune faille

- ⛔ **F-1 — `normeSource` était une fausse déclaration, et un test la verrouillait.** Le paquet
  **prudentiel** citait dans ce champ les Instructions 025 et 026-02-2009, qui instituent le **plan
  comptable** RCSFD. Or `normeSource` désigne la norme que le paquet **transcrit** : un écran ou un
  contrôle qui lirait ce champ ne lirait pas la `miseEnGarde`. Pire, un test exigeait l'égalité avec la
  norme comptable — quiconque aurait voulu corriger le champ aurait vu ce test lui ordonner de remettre
  l'erreur. Valeur retenue : « **Aucune** — aucun texte prudentiel de la BCEAO ou de la Commission Bancaire
  de l'UMOA applicable aux SFD n'a été fourni au projet (D-498-A) ». Un test interdit désormais d'y citer
  la norme comptable ou le moindre numéro d'instruction.
- **F-2 — la règle « un paquet vide ne peut être qu'`amorce` » se contournait.** Un paquet vide auquel on
  ajoutait une rubrique inconnue contenant un simple nombre passait au statut **`certifie`, sans mise en
  garde** : le validateur et le service ne définissaient pas « vide » de la même façon. Corrigé en
  comptant les trois seules collections réelles, **et** en fermant le schéma
  (`additionalProperties: false`) : sans cette fermeture, une valeur transcrite hors des rubriques
  connues aurait été **packagée sans jamais être appliquée**. Une garde vérifie que validateur et service
  rendent le même verdict « vide » sur six fixtures.
- **F-3 — la liste des artefacts partagés n'était branchée sur aucune comparaison** : un second artefact
  partagé aurait passé l'exhaustivité sans être comparé à aucun amont. Chaque artefact partagé est
  maintenant confronté à chaque voisin.
- **Sécurité : aucune vulnérabilité.** Gate et portée au niveau de la classe, 404 au même corps que
  l'inexistant, messages 502/503/500 sans chemin ni empreinte, validateur absent de l'image.

### La preuve n'est pas vacante

Sur un paquet volontairement vide, un validateur qui ne trouve rien à refuser passe toujours. Vérifié
par la revue : la fixture « valeur sans source » est **acceptée par le schéma** et rend exactement une
faute R4, sa jumelle avec source passe, et retirer R4 la fait repasser au vert.

⚠️ Limite écrite : la garde prouve qu'une source est **présente**, pas qu'elle est **vraie**.

### Non livré, et dit comme tel

- **AC-1** (tranches, taux, règles de déclassement, seuils) et **AC-2** (référence opposable par valeur) :
  aucun texte prudentiel fourni. La route publie `valeursLivrees: false`.
- La recopie du validateur ne se propagera pas toute seule : un correctif futur de R4 côté fiscal devra
  être reporté ici à la main (D-498-E).

## Notes

- Voir [[STORY-491]] (le manifeste déclaré), [[STORY-493]] (la même garde côté fiscal), [[STORY-368]]
  (ce que coûte une republication d'artefact).
