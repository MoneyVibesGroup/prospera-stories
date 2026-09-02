# STORY-432 : Une balance après détermination du résultat produit un compte de résultat ENTIÈREMENT VIDE — et tous les contrôles restent verts

Status: done

**Épic :** EPIC-010 — États financiers (`bilan-service`)
**Service :** `bilan-service` (`:3004`) — `modules/bilan/etats`, `dto`
**Points :** 3 · **Sprint :** S20
**Origine :** arbitrage PO sur **STORY-426**, 2026-08-27. Trouvé en re-dérivant le critère de
STORY-426 contre les **trois états possibles d'une balance**.

---

## Le fait

Le comptable importe la balance qu'il considère comme la **bonne** : la *balance après
inventaire*, définitive, celle sur laquelle il arrête ses comptes. Dans cet état, l'**écriture de
détermination du résultat** est déjà passée : les classes 6, 7 et 8 sont **soldées**, et le
résultat est au compte **13**.

Le module produit alors :

| grandeur | valeur | contrôle |
|---|---|---|
| `produits[]` / `charges[]` | tous les montants à **0** | — |
| `resultatNetN` (`XI`) | **0** | — |
| `sig[]` (`XA`…`XI`) | **0** partout | `coherenceSig.coherent` = ✅ (`0 = 0`) |
| `coherenceResultat.ecart` | **0** | ✅ (`0 = 0`) |
| `controle.equilibre` | **true** | ✅ (`A = P + 0`, le compte 13 est au passif) |
| `coherenceSousTotaux` (`BZ = DZ`) | **true** | ✅ |

⇒ **Une liasse complète, équilibrée, cohérente sur les quatre contrôles — et un compte de
résultat entièrement vide.** Rien, nulle part, ne dit pourquoi.

## Pourquoi c'est le piège le plus coûteux du lot

- Il ne se manifeste **par aucun symptôme technique** : pas d'erreur, pas de 4xx, pas de drapeau.
  L'écran affiche une liasse d'apparence normale dont une moitié est à zéro.
- Le premier réflexe du comptable sera de croire à un **bug d'import** ou à un **rattachement
  raté** — et il ira chercher dans la table de passage, où il ne trouvera rien d'anormal
  (les comptes de gestion *sont* bien rattachés ; ils valent zéro).
- Le geste correctif est **immédiat une fois nommé** — reprendre la balance *avant* écritures de
  clôture — mais **impossible à deviner** depuis l'écran actuel.
- Et le produit **ne dit nulle part quelle balance il attend**. C'est une hypothèse implicite du
  module depuis STORY-059.

---

## Critères d'acceptation

- [ ] AC-1 — La réponse publie `etatBalance` (champ introduit par **STORY-426**) :
      `APRES_DETERMINATION` quand `resultatNetCR = 0` **et** `solde(poste RESULTAT_BILAN) ≠ 0`.
- [ ] AC-2 — Cet état est une **information**, pas une erreur : `200`, la liasse est produite,
      et elle reste **validable** (le Bilan, lui, est juste — c'est le CR qui est vide, et il
      l'est légitimement).
- [ ] AC-3 — ⚠️ **Ne pas confondre avec une balance creuse.** Une balance sans aucun compte de
      gestion **ni** compte 13 (dossier neuf, aucune écriture) est `AVANT_CLOTURE` avec un CR à
      zéro lui aussi — mais la cause est autre, et le geste aussi. Un test couvre les deux.
- [ ] AC-4 — La documentation du module (`@ApiOperation` du `dry-run`) **énonce l'hypothèse** :
      *la liasse se produit sur une balance **avant écritures de clôture** ; sur une balance après
      détermination du résultat, le compte de résultat est vide par construction.*
- [ ] AC-5 — Test : balance à classes 6/7/8 soldées + compte 13 alimenté ⇒ `etatBalance =
      'APRES_DETERMINATION'`, `resultatNetN = 0`, **les quatre contrôles verts**, et le champ
      présent. C'est la preuve que l'information manquante est désormais servie.

## Vigilance

- ⛔ **Ne pas refuser la production.** Un cabinet peut légitimement vouloir le **Bilan** depuis une
  balance après clôture — c'est le CR qui n'a plus rien à dire, pas la liasse entière.
- ⚠️ Le **TFT** (STORY-061) est concerné de la même façon : ses ancres de trésorerie viennent du
  Bilan, mais sa variation N/N-1 se lit sur des flux. À vérifier au passage.

## Conséquences ailleurs

- **FE-032** doit porter un **troisième état** de démonstration (« balance après clôture ») et
  l'expliquer à l'écran, à côté de « Servi » et « Résultat non affecté ».
- **STORY-426** partage le champ `etatBalance` : les deux stories se tirent ensemble.

---

## Progress Tracking

**Statut : `done`** — implémentée, validée, revue (code + sécurité), **vérification docker réelle
rejouée sur l'état final**, PR `bilan-service` **#62** (2 commits) rebase-mergée sur `dev` le
2026-09-02.

### ⚠️ AC-1 et AC-2 étaient DÉJÀ tenus — le manque réel était ailleurs

`etatBalance` existe depuis **STORY-426** et la dérivation demandée par l'AC-1 est déjà celle du
code (`resultatPorteAuPassif ≠ 0` **et** `resultatNetN = 0` ⇒ `'APRES_DETERMINATION'`). L'AC-2
aussi : `controleResultatNonAffecte` ne rend `ANOMALIE` que sur `'RESULTAT_NON_AFFECTE'`, donc la
liasse reste **validable**.

⛔ **Mais la fiche dit « la réponse publie `etatBalance` », et sur la route qui compte c'était
FAUX.** `CompteResultatDto.coherenceResultat` était typé par une **interface** : `@nestjs/swagger`
la publie en `object` **opaque, sans une seule propriété**. Les six champs partaient dans le JSON
et **aucun client généré ne pouvait en lire un** — `etatBalance` compris, c'est-à-dire la seule
grandeur qui explique un compte de résultat entièrement à zéro, **sur la route même dont l'écran
FE-032 doit expliquer le vide**. Leçon STORY-427 à l'identique : publier derrière un contrat qui ne
décrit pas, c'est ne rien publier.

### Ce qui est livré

- **AC-1 réellement tenu** — `CoherenceResultatDto` publie ses **six** propriétés, toutes
  `required`, `etatBalance` pointant sur le **type partagé nommé** `EtatBalance` (le même que le
  Bilan). `implements CoherenceResultat` fait du **compilateur** le garde-fou : un champ ajouté à
  l'interface ne compile plus tant qu'il n'est pas publié. ⚠️ **Une seule des quatre** propriétés
  opaques nommées en dette par STORY-430 est traitée — `referentiel`, `stamp` et `coherenceSig`
  **restent en dette nommée**, les toucher aurait débordé.
- **AC-4** — le contrôleur ne portait **aucun `@ApiOperation`** (mesuré : 0). Les **5 routes
  `dry-run`** énoncent maintenant la balance attendue, nomment `APRES_DETERMINATION`, distinguent
  la **balance creuse**, et **bornent la validabilité**.
- **AC-3 / AC-5** — les trois états mesurés sur la **liasse complète**, plus un témoin nominal qui
  les borne (sans lui, un moteur rendant `0` en toute circonstance passerait).
- **Vigilance respectée** — la production n'est **jamais** refusée : `200`, liasse produite,
  `valide: true`.

### La mesure qui résume la story

Réponse réelle du compte de résultat, **balance après détermination** vs **balance creuse**,
comparées champ par champ sur la stack docker :

```
.coherenceResultat.resultatPorteAuPassif : 400000 ≠ 0
.coherenceResultat.etatBalance : 'APRES_DETERMINATION' ≠ 'AVANT_CLOTURE'
TOTAL = 2 champs sur TOUTE la réponse
```

33 postes émis des deux côtés, **tous à `0`**, quatre contrôles bloquants `OK`, `valide: true` dans
les deux cas. **Ces deux champs sont la seule chose qui sépare les deux situations** — et ils
étaient tous les deux enfermés dans l'objet opaque.

### ⚡⚡ La revue de code a repris DEUX bloquants, dont une phrase publiée qui contredisait le code

1. La description servie sur les 5 routes écrivait « **seul `RESULTAT_NON_AFFECTE` bloque la
   validation** ». **Faux** : la batterie compte **quatre** contrôles `BLOQUANT`, et la phrase
   contredisait frontalement une autre description du **même document OpenAPI**
   (`BilanDto.soldesComptesNonMappes`, STORY-401 : « `COMPTES_NON_AFFECTES` **bloque la validation
   de la liasse** »). Un écran qui l'aurait crue aurait annoncé « validable » sur une balance à
   compte non affecté, puis pris un **422**. Phrase bornée aux trois états de balance, et la garde
   de contrat l'exige désormais (mutation : la retirer rougit).
2. **JSDoc détaché par insertion, deux fois** — 6ᵉ et 7ᵉ récidive du piège maison (417, 420, 423,
   425, 430). Le bloc STORY-432 s'était glissé entre le JSDoc de classe de
   `BilanDiagnosticsController` et sa classe, et `CoherenceResultatDto` entre celui de
   `CompteResultatDto` et la sienne : **les deux classes se retrouvaient sans documentation**. Le
   contrôle mécanique de la fiche mémoire n'avait toujours pas été appliqué.

### ⛔ La fiche se trompe sur un de ses quatre voyants

Le tableau de la story annonce `coherenceSousTotaux (BZ = DZ)` **vert**. **Mesuré** sur
`syscohada-revise@2.1` : `coherent` vaut `false` dans les **trois** états de balance — la cascade
packagée n'agrège pas tous les postes de détail dans `BZ` (`211000` → poste `AE`, absent des
opérandes de `AZ`). C'est une **dette d'artefact pré-existante**, et surtout ce voyant **ne
distingue rien** : l'énumérer comme vert propre à ce cas serait faux. Le texte publié dit désormais
« les quatre contrôles **BLOQUANTS** ressortent `OK` », ce qui est exact et mesuré.

### ⚡ Une garde de contrat qui ne gardait pas ce qu'elle annonçait

Le test « `etatBalance` publié en énumération nommée » ne mesurait **ni le nom ni sa propre
déclaration** : `enumName: 'EtatBalance'` n'enregistre le schéma partagé qu'à la **première**
rencontre, et les déclarations suivantes sont **ignorées en silence** — c'est celle du Bilan qui
gagne. Le test assertait donc l'enum du Bilan, en croyant asserter celle du CR. Il vérifie
maintenant le **`$ref`** (via un helper `refDe`) et **dérive** les valeurs de `ETATS_BALANCE` au
lieu de les recopier (patron STORY-375). La limite est **nommée** dans son JSDoc : les deux
déclarations peuvent diverger sans rien faire rougir — sans conséquence aujourd'hui puisqu'elles
dérivent de la même constante.

### Vigilance TFT — instruite et mesurée

Le TFT est concerné **de la même façon** : sa cascade est alimentée par les postes du CR, donc sa
variation **s'effondre à 0** sur une balance après détermination. Mesuré sur deux balances
équivalentes portant la même trésorerie (150 000 → 400 000) :

| balance | `variationTft` | `variationBilan` | `VARIATION_TRESORERIE` |
|---|---|---|---|
| après détermination | **0** | 250 000 | `ANOMALIE` (catégorie `INFORMATIF`) |
| avant clôture | 400 000 | 250 000 | `ANOMALIE` (catégorie `INFORMATIF`) |

Le contrôle **réagit** — mais il est `INFORMATIF` (`valide` reste `true`) et il **nomme la mauvaise
cause** (« la variation ne s'articule pas »), comme `EQUILIBRE_BILAN` le fait pour un compte non
rattaché. ⚠️ Sur ma fixture synthétique il rend `ANOMALIE` dans les **deux** cas : il ne
**discrimine donc pas** l'état de la balance. ⛔ **Écart distinct, non traité ici** — le périmètre
de la story est `etatBalance`, pas l'articulation du TFT.

### Écart nommé, laissé au PO

L'AC-4 vise l'`@ApiOperation` du **`dry-run`** : c'est ce qui a été fait, à la lettre. Mais
`POST …/bilan/etats` (création d'un jeu d'états) — **la route qui produit la liasse opposable** —
ne porte, elle non plus, **aucun `@ApiOperation`**, et reste donc muette sur la balance attendue.
Étendre l'énoncé à cette route aurait débordé le périmètre ; c'est signalé plutôt que fait en
silence.

### Vérification docker réelle — rejouée sur l'état FINAL

Un correctif de revue touchait une **description servie** : la vérification a été rejouée après
correction, jamais rapportée depuis la mesure d'avant.

| Mesure (`/api/docs-json` servi) | Résultat |
|---|---|
| `CoherenceResultatDto` | 6 propriétés, **toutes `required`** |
| `coherenceResultat` | `allOf: [$ref: CoherenceResultatDto]` — plus opaque |
| `etatBalance` | `$ref` vers l'enum partagée `EtatBalance` (3 valeurs) |
| routes `dry-run` portant l'hypothèse | **5 / 5**, dont **5** bornant la validabilité |

⚠️ `docker restart` avant chaque mesure — le hot-reload avait menti pendant MNV-431.

### Revue de sécurité — aucun constat

Instruits et écartés avec démonstration : le **JSON est inchangé à l'octet** (le contrôleur renvoie
l'objet du moteur, aucun `ClassSerializerInterceptor` n'est monté) — décrire un champ déjà servi
n'ajoute rien à l'exposition ; provenance strictement locale à l'appelant ; aucun texte ajouté
n'est exploitable (tout ce qu'il nomme était déjà publié dans le même document) ; la validation
n'est pas contournable (`jeu-etats.service` **re-produit** les contrôles côté serveur, « jamais un
`valide` fourni par le client ») ; `MOTEUR_VERSION` **n'a pas à être bumpé** — la valeur produite
est inchangée, donc `empreinteDocument` reste stable et aucun vérificateur ne conclura à une
altération.

⚠️ **Posture pré-existante signalée, hors périmètre** : Swagger est monté **inconditionnellement**
et **hors de la chaîne d'`APP_GUARD`** — `/api/docs` et `/api/docs-json` sont servis **sans
jeton**, sur les 7 services depuis STORY-035. Conforme au design documenté du projet ; à durcir un
jour par une story transverse.

### Portes

lint **0 warning** · build OK · **1372 unitaires** + **386 e2e** verts · couverture
**98,67 / 93,63 / 98,63 / 98,65** · **8 mutations, 8 rouges par assertion**.

⚠️ **Trois mutations écartées comme non probantes** avant d'arriver là, et c'est instructif :
re-typer la propriété en interface **seule** laisse le contrat intact (Swagger suit le `type:`
explicite), retirer le `type:` **seul** aussi (la réflexion sur la classe prend le relais), et
amputer l'`enum` **ici** ne change rien (le schéma partagé est enregistré par le Bilan). Seul
l'**état pré-story complet** rougit. Une mutation qui ne déplace pas la sortie ne mesure rien.

⚠️ **Incident de méthode consigné** : un `git checkout -- src/` de la passe de mutation a emporté
les correctifs de revue **non encore committés** — le piège documenté en mémoire. Constaté,
refaits, revérifiés.
