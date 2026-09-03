# STORY-440 : La batterie ne porte ni sévérité ni cible adressable, et son drapeau `valide` repose sur deux contrôles dont l'un est tautologique

Status: done

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — `etats/controles-coherence.types.ts`, `etats/controles-coherence-production.service.ts`
**Points :** 3 · **Complexité :** medium · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-033** (TFT/TAFIRE, notes annexes, contrôles de cohérence), 2026-08-27.
Vérifié contre la DSF déposée `1000745307_2025_Definitif (1).xlsx`, feuille *« Type de Contôles »*.

---

## ✅ Arbitrage (2026-08-27)

**AC-4 tranché : au contrat.** Voir l'AC lui-même. Le reste de la fiche est inchangé —
AC-1 (sévérité), AC-2 (cible adressable) et AC-6 (le verdict ne bouge pas) ne demandaient
pas d'arbitrage.

## Le fait — trois manques, une même conséquence

### ① Il n'y a pas de sévérité

L'AC-3 de **FE-033** demande « anomalies listées avec **cible, sévérité, bloquant** ».
`ControleArticulation` porte `categorie: 'BLOQUANT' | 'INFORMATIF'` et `elements[]`. **La
sévérité n'existe pas** — et ce n'est pas la catégorie : un écart de 905 000 sur le TFT et un
écart de 1 franc sur une note sont tous deux `INFORMATIF`.

### ② La « cible » n'est pas adressable

`ControleElement.ref` est une **chaîne libre** : `'totalActifN'`, `'note 7'`, `'variationTft'`,
`'BZ'`. Le front peut l'**afficher** ; il ne peut pas y **renvoyer** sans câbler sa propre table
de correspondance — c'est-à-dire sans devenir le **second arbitre** que FE-030 puis FE-031 ont
explicitement refusé.

### ③ `valide` repose sur deux contrôles, dont un qui ne peut pas échouer

`valide = tous les BLOQUANT sont OK`. Il y en a **deux** : `EQUILIBRE_BILAN` (vrai contrôle) et
`COHERENCE_RESULTAT` — dont le volet `CR = passif` est **nul par construction** (STORY-426).
En pratique : **un contrôle bloquant réellement faillible**. Sur un référentiel réduit
(SFD-BCEAO), les deux autres passent `NON_APPLICABLE` avec `coherent: true` — et le vert final
est **le même à l'écran** que celui d'une liasse SYSCOHADA complète.

Mesuré contre les **8 contrôles intermontants** que l'administration applique au dépôt
(feuille *« Type de Contôles »*) : **1 réellement calculé sur 8**.

## Critères d'acceptation

- [x] AC-1 — `ControleArticulation` porte `severite: 'CRITIQUE' | 'MAJEURE' | 'MINEURE' | 'AUCUNE'`,
      dérivée de l'écart **relatif** à la grandeur contrôlée (seuils déclarés par le référentiel,
      pas codés en dur — patron `regles.toleranceTresorerie`).
- [x] AC-2 — `ControleElement` devient adressable : `{etat, poste, ref, valeur}` — `etat`/`poste`
      `null` quand l'élément est un total global (`totalActifN`). Le champ `ref` reste, pour
      compatibilité.
- [x] AC-3 — `ControlesCoherenceProduit` porte un **récapitulatif** : nombre de contrôles
      `CALCULE` / `NON_APPLICABLE` / `INDETERMINABLE`, pour qu'un `valide: true` obtenu sur deux
      contrôles applicables ne se lise pas comme un `valide: true` obtenu sur quatre.
- [x] AC-4 — La **liste des contrôles non couverts** est publiée **au contrat** (comptes écartés,
      identité des exercices comparés, balance après clôture, articulation note ↔ poste,
      articulation comptable ↔ fiscal), chacun avec son ticket. ✅ **Arbitré le 2026-08-27 : le
      contrat, pas la documentation.** Devant un voyant vert, la première question d'un réviseur
      est « *qu'est-ce que vous n'avez pas vérifié ?* ». Une note d'`@ApiOperation` ne lui parvient
      jamais ; et laissée au front, la liste est **codée en dur** — c'est ce que fait la maquette
      FE-033 aujourd'hui, et elle périmera en silence au premier contrôle ajouté.
- [x] AC-5 — Agnosticisme P7 : rien de tout ceci n'ajoute de structure OHADA au moteur.
- [x] AC-6 — Non-régression : `valide` garde **exactement** sa sémantique actuelle. Cette story
      **décrit** mieux, elle ne change pas le verdict — le gate reste STORY-064.

## Conséquences ailleurs

- ⛔ **FE-033** ne peut pas servir son AC-3 à la lettre sans AC-1/AC-2 : la maquette affiche les
  `elements[]` bruts et le dit à l'écran.
- **FE-034** lit ce drapeau pour autoriser la validation : AC-3 est ce qui l'empêchera d'annoncer
  « tout est vert » sur une liasse où deux contrôles sur quatre n'ont pas eu lieu.
- **FE-078** porte la moitié « comptable ↔ fiscal » des 8 contrôles de l'administration.


## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité), **vérification docker rejouée sur
l'état final**, PR `bilan-service` **#72** (2 commits) rebase-mergée sur `dev` le 2026-09-03.

Branches créées **avant** la première ligne de code :

```
docs             MNV-440
bilan-service    MNV-440
```

⚠️ **Un seul dépôt de module** : aucun artefact de référentiel n'est régénéré.

### Ce qui est livré

| AC | Livré |
|---|---|
| AC-1 | `severite` sur chaque contrôle, dérivée de l'écart **relatif** à la grandeur contrôlée. Seuils **déclarés par le référentiel** (`regles.severiteCritique` / `severiteMajeure`, patron `toleranceTresorerie`), défauts 5 % et 1 %. Une anomalie **sans écart mesurable** est `CRITIQUE`. |
| AC-2 | `ControleElement` porte `etat`/`poste` — le couple que le reste du contrat emploie déjà. `null` quand l'élément ne désigne aucun poste : un total global, un **compte**, une **note**. `ref` reste. |
| AC-3 | `recapitulatif` : `calcules` / `indeterminables` / `nonApplicables`, dérivé de la liste rendue. |
| AC-4 | `nonCouverts` **au contrat**, chacun avec son ticket — ou `null` quand le trou n'est pas fiché. |
| AC-5 | Aucune structure OHADA ajoutée — et un code OHADA **retiré**, voir le bloquant ci-dessous. |
| AC-6 | `valide` inchangé : `bloquantSatisfait` n'est pas touché, et `severite` n'est lu **nulle part** hors du contrat. |

`MOTEUR_VERSION` 1.12.0 → **1.13.0** : quatre formes changent, dont la plus répandue —
`ControleElement`, présent sur chaque anomalie de chaque snapshot opposable.

### ⛔ Revue de code — deux bloquants, dont un code OHADA dans un moteur agnostique

**① `poste: 'BZ'` / `'DZ'` étaient ÉCRITS EN DUR.** Les grands totaux sont résolus **par rôle**
(`TOTAL_ACTIF` / `TOTAL_PASSIF`) précisément pour rester agnostiques ; seuls les **noms de champ**
`bz`/`dz` sont SYSCOHADA. Tant qu'ils ne portaient qu'une **valeur**, c'était sans conséquence.
En faire une **adresse** a changé cela.

| paquet | poste réel | ce que la batterie publiait |
|---|---|---|
| `syscohada-revise@2.1` | `BZ` / `DZ` | `BZ` / `DZ` ✔ |
| `sfd-bceao@2.0` | **`BAT` / `BPT`** | `BZ` / `DZ` ✘ |
| `cima-assurances@1.0` | **`CAT` / `CPT`** | `BZ` / `DZ` ✘ |

L'écran aurait suivi la promesse littérale de l'AC-2 — « renvoyer sans câbler sa propre table de
correspondance » — vers un poste **inexistant** sur deux des trois paquets embarqués.
`CoherenceSousTotaux` remonte désormais `posteTotalActif`/`posteTotalPassif`.

**② `ARTICULATION_NOTE_A_TRAME` pointait `STORY-439`**, une story **`done`** — celle-là même qui a
**ouvert** ce manque et l'a laissé hors périmètre. Un réviseur y aurait lu un trou refermé.
`ticket: null` dit ce qui est vrai ; la story de suivi reste à ficher.

### ⚡⚡ Sept gardes qui ne gardaient rien, chacune mesurée par mutation

- **Le CHOIX DE LA GRANDEUR — le cœur de l'AC-1 — n'était gardé sur aucun contrôle sauf
  l'équilibre** : remplacer cinq grandeurs d'un coup laissait **1 537 tests VERTS**, dont deux
  remplacements par `null` qui rendaient **toute** anomalie de notes `CRITIQUE`.
- **Le CONTENU de `nonCouverts` n'était gardé par rien** : supprimer une entrée ou pointer un
  ticket inexistant laissait 1 537 unitaires **et** 85 e2e verts — c'est exactement le bloquant ②
  qui a franchi la suite.
- **Le test du seuil NÉGATIF était vacant** : écrit avec un écart de 50 %, les deux branches
  rendaient `CRITIQUE`. Reposé sous le seuil majeur, il discrimine.
- **La sonde ne figeait ni la forme du récapitulatif ni celle d'un non-couvert**, ni le **contenu**
  de la liste — qui part pourtant dans chaque snapshot **opposable**.
- **La ligne `999999` ajoutée à la sonde était INERTE et son commentaire faux** : le compte
  `281000` du paquet de test produisait déjà l'anomalie. Retirée.
- **Le cartouche de `ControlesCoherenceDto` s'était détaché de sa classe** — **8ᵉ récidive** du
  motif, l'insertion des deux DTO neufs l'ayant laissé au-dessus de `RecapitulatifControlesDto`.
- Une assertion `toBeGreaterThanOrEqual(1)` là où le critère est une **égalité**.

### ⚡ Revue de sécurité — aucune vulnérabilité, deux constats LOW traités

**① `/api/docs-json` est servi SANS jeton**, et l'`example` de `nonCouverts` y recopiait la prose
intégrale **et les identifiants de tickets internes**. L'exemple devient illustratif ; un e2e le
garde (`not.toMatch(/STORY-\d+/)`). ⚠️ La liste **réelle** reste servie dans la réponse, derrière
la chaîne de gardes : c'est une information de conformité, et la revue a tranché en ce sens — la
route est authentifiée, la liste est identique pour tous les tenants, et l'endpoint `dry-run` est
de toute façon un oracle.

**② `nonCouverts` entre dans le snapshot opposable** alors que son contenu est de la prose éditée
à la main. Sans garde, remplir un `ticket: null` ferait porter le **même** `moteurVersion` à deux
documents différents — le motif exact des précédents STORY-401 et STORY-434. La sonde fige
désormais le **contenu** (codes + tickets) : toute édition oblige à rouvrir `moteur-version.ts`.

Écartés par la mesure : les seuils hostiles dans `pkg.regles` (`'0'` sur-signale, `'1e400'`/`'NaN'`
replient sur le défaut, et le paquet est un asset **embarqué** vérifié par sha256, sans voie
d'écriture) ; la fuite par `etat`/`poste` (tous issus du paquet, jamais d'une saisie du cabinet) ;
l'épuisement de ressources (aucun élément de plus, deux champs constants) ; et le gate `valide`,
que `severite` ne touche nulle part.

### Vérification

Lint 0 warning · build OK · **1 544** unitaires + **411** e2e verts · couverture
**98,76 / 93,74 / 98,71 / 98,76** · **12 mutations rouges par assertion**.

**Vérification docker — rejouée sur l'état FINAL**, par la route réelle, après `docker restart` :

| référentiel | `recapitulatif` | adresse publiée par `EQUILIBRE_BILAN` |
|---|---|---|
| `syscohada-revise@2.1` | `{calcules: 7, indeterminables: 0, nonApplicables: 0}` | `BILAN|BZ` et `BILAN|DZ` |
| `sfd-bceao@2.0` | `{calcules: 3, indeterminables: 0, nonApplicables: 4}` | **`BILAN|BAT` et `BILAN|BPT`** |

La seconde ligne **est** le correctif du bloquant ①, mesuré de bout en bout ; et le contraste des
deux récapitulatifs est exactement ce que l'AC-3 existe pour rendre visible. Les cinq
`nonCouverts` sont servis avec leurs tickets, et le `/api/docs-json` du conteneur ne publie plus
aucun identifiant interne dans son exemple.

⚠️ **Flake e2e pré-existant** (fiche `flake-e2e-bilan-service`) : une suite est tombée sur une
exécution complète, verte à la relance. Sans rapport avec ce diff.
