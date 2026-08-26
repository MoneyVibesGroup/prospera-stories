# STORY-416 : La grille de la liasse est calculée, affichée — et impossible à emporter

Status: ready-for-dev

**Épic :** EPIC-023 — Fiscalité (résultat fiscal, liquidation, TVA, provisions, TPU)
**Service :** `balance-service` (`:3007`) — `modules/fiscal`
**Points :** 3 · **Sprint :** S20
**Origine :** relevée le **2026-08-26** en construisant la maquette **FE-050**, au moment de
répondre à la question qui suit immédiatement la grille : *« et maintenant, je la mets où ? »*

---

## Le fait, relevé à la source

`ResultatFiscalResponseDto.postesDsf` est **la grille complète de la liasse** — tous les
codes du paquet, à 0 quand rien ne les alimente, plus les postes hors grille. C'est
exactement ce qu'un cabinet recopie sur la DSF au moment du dépôt.

⛔ **Et il n'existe aucune manière de l'emporter.** Vérifié contrôleur par contrôleur :
`fiscal.controller.ts` sert du JSON et rien d'autre — pas de `Accept: text/csv`, pas de
route `…/resultat-fiscal/export`, pas de génération de document. La seule sortie
fichier du produit est **l'export du Bilan** (FE-038), qui porte les états financiers et
**pas les retraitements** : ce n'est pas le même objet.

---

## Ce que ça coûte, concrètement

Le dépôt de la DSF est **manuel, case par case**, dans le formulaire de l'OTR ou dans la
liasse GUIDEF. La grille est à l'écran ; la saisie se fait ailleurs. Entre les deux, il y
a un humain qui recopie une vingtaine de nombres.

- **Ce n'est pas un confort.** Le produit passe son temps à empêcher un montant faux
  d'entrer dans l'assiette — fail-closed sur les codes, refus plutôt que repli sur les
  classes de gestion, motif publié plutôt que zéro muet — puis **rend la ventilation
  finale à la recopie manuelle**, c'est-à-dire au seul endroit où il ne contrôle rien.
- **Le cas le plus coûteux est silencieux** : un chiffre recopié dans la case d'à côté.
  Le total déposé reste juste, la ventilation ne l'est plus, et **aucun contrôle du
  produit ne peut s'en apercevoir** — la faute est née hors de lui.
- **Et la grille est faite pour être recopiée** : elle publie délibérément les cases à
  zéro (D-091-11) pour qu'on puisse la parcourir sans se demander ce qui manque. Publier
  vingt lignes destinées à la recopie, puis ne pas les rendre recopiables, est une
  décision incomplète, pas une décision.

---

## Périmètre

**Inclus**

- Une sortie **fichier** de la grille de la liasse pour un exercice donné : les postes
  de `postesDsf` dans l'ordre du paquet, avec `code`, `sens`, `montant`, `origine`, et
  le motif quand le poste n'a pas de code.
- Le fichier porte **l'empreinte du calcul** — exercice, balance retenue (id, version,
  état), paquet fiscal (pays, année, checksum). Une grille exportée sans savoir de
  quelle balance elle sort ne vaut pas plus qu'un chiffre sans provenance, et ces quatre
  informations sont **déjà** dans la réponse.
- **Les postes sans case y figurent**, comme à l'écran : ce sont eux qui devront être
  ventilés à la main, et les omettre ferait un fichier qui ne totalise pas l'assiette.

**Hors périmètre**

- **Pré-remplir un formulaire officiel OTR ou un fichier GUIDEF.** C'est un autre sujet,
  qui suppose un gabarit versionné par année, et il ne se décide pas dans cette story.
- **Un PDF mis en page.** Le besoin est de *transporter des chiffres*, pas d'éditer un
  document — un CSV/XLSX répond entièrement, un PDF ajoute une maquette à maintenir.
- Le format exact (CSV séparateur `;` vs XLSX) : **à trancher avec le PO**, cf. Notes.

---

## Critères d'acceptation

1. Une route de lecture rend la grille de la liasse d'un exercice sous forme de fichier,
   soumise aux **mêmes gates** que le reste de l'Atelier (`@RequiresBalanceAccess`,
   `@RequiresDossierScope`, `@RequiresRegime(REEL)`).
2. Le contenu du fichier est **exactement** `postesDsf` — même ordre, mêmes montants,
   mêmes postes. Un test le vérifie sur la **même source**, pas sur deux constructions
   parallèles : deux grilles qui divergent seraient pires qu'une seule non exportable.
3. Le fichier porte l'exercice, la balance retenue et le checksum du paquet.
4. Les mêmes refus que le calcul (`404 BALANCE_INTROUVABLE`, `409 PAQUET_FISCAL_NON_PACKAGE`,
   `409 CLASSES_GESTION_NON_SOURCEES`) — jamais un fichier vide en guise de refus.

---

## Notes

- ⚠️ **Question à trancher avant de chiffrer : le séparateur et l'encodage.** Un cabinet
  togolais ouvre un CSV dans Excel en locale française — séparateur `;`, et un BOM UTF-8
  sans lequel les accents des libellés sortent illisibles. Le produit a déjà payé cette
  leçon ailleurs (les artefacts invalidés par CRLF). ⇒ **le format se décide avec le PO,
  pas au moment du code.**
- ⚠️ **Voisin, mais distinct** : `postesDsf` est la feuille « Détail réintégrations /
  déductions ». La feuille « Résultat fiscal » (cases **D** à **L**) est publiée par
  `LiquidationResponseDto` (STORY-092). Si le besoin réel est « déposer la liasse », les
  **deux** grilles sont concernées ⇒ le PO doit dire s'il veut un export par écran ou un
  export de la liasse.
- ⚠️ **Ne pas confondre avec l'export du Bilan (FE-038)** : même geste, autre objet. Les
  fusionner ferait sortir des retraitements d'un état financier.
- L'écran FE-050 dessine le bouton **désactivé**, avec la mention « non servi par l'API » :
  on montre la cible, on n'invente pas le geste.
- Consommateur nommé : **FE-050**.
