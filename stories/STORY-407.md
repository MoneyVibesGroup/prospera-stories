# STORY-407 : Un relevé importé ne se retire jamais — l'erreur de compte est définitive

Status: ready-for-dev

**Épic :** EPIC-022 — Rapprochement bancaire (relevés + mobile money) · *clôturé le 2026-07-30 ;
cette story y atterrit sans le rouvrir*
**Service :** `balance-service` (`:3007`) — `modules/tresorerie`
**Points :** 5 · **Sprint :** S20
**Origine :** relevée le **2026-08-25** en dessinant la maquette **FE-049** — au moment d'écrire
ce que l'écran devait promettre juste avant le bouton « Importer ».

---

## Le fait, relevé à la source

`RelevesController` publie **deux** routes, et pas une de plus :

```ts
@Post()   // importer  (dryRun → 200, persist → 201)
@Get()    // consulter
```

Aucun `DELETE`. Aucun `PATCH`. Une ligne de relevé écrite ne se corrige pas, ne se retire pas, ne
se déplace pas. Le seul geste voisin — `DELETE /tresorerie/comptes/:id` — est refusé
(`409 COMPTE_TRESORERIE_REFERENCE`) dès qu'une ligne y est rattachée : **le compte fautif ne peut
même pas être supprimé avec ses lignes**.

---

## Ce que ça coûte, concrètement

L'erreur qui arrive vraiment n'est pas « un mauvais fichier » : c'est **le bon fichier sur le
mauvais compte**. Le cabinet tient une seule liste de comptes de trésorerie pour tous ses clients
(STORY-402) : « BOA — courant » y voisine avec « BOA — courant » d'un autre dossier. Un import
mal aiguillé y reste, et il n'est pas inerte :

- il **fabrique des écarts** dans un dossier auquel ces flux n'appartiennent pas ;
- il **participe à l'état de rapprochement** — donc au chiffre que le cabinet signe ;
- il est **idempotent par empreinte**, ce qui aggrave la situation au lieu de l'aider : réimporter
  le fichier au bon endroit ne retire rien du mauvais.

⚠️ **La seule sortie actuelle est une intervention en base.** C'est-à-dire : pas de sortie.

---

## Périmètre

**Inclus**

- Un geste de **retrait d'un lot importé**, tracé, réservé aux lignes **non appariées**.
- La borne qui donne son sens à la story : une ligne `RAPPROCHE` ne se retire **pas** sans
  dé-pointer d'abord. Retirer sous un appariement laisserait une ligne de cahier au niveau de
  preuve « fichier » sans le fichier qui la portait — une preuve orpheline, c'est-à-dire une
  balance indéfendable qui *se présente* comme défendable.
- La **granularité est à trancher, et c'est le cœur du cadrage** : par ligne (précis, mais on ne
  retire pas 156 lignes une à une), par **import** (naturel, mais rien ne rattache aujourd'hui une
  ligne à l'import qui l'a créée — `LigneReleve` ne porte ni `importId` ni horodatage d'import),
  ou par **fenêtre de dates sur un compte** (faisable sans nouveau champ, mais grossier).
  ⇒ Si la réponse est « par import », **elle exige un champ nouveau** et donc une migration.
- Trace de l'acte : qui, quand, combien de lignes, sur quel compte.

**Hors périmètre**

- La correction d'une ligne (montant, libellé, sens) : un relevé est la copie d'une pièce d'un
  tiers, on ne la corrige pas — on la réimporte.
- Le re-scopage au dossier : STORY-402.

---

## Critères d'acceptation

1. Un lot importé par erreur se retire **sans intervention en base**, et la trace le dit.
2. Une ligne engagée dans un appariement (proposé ou confirmé) **refuse** d'être retirée, avec un
   code stable et un geste : dé-pointer d'abord.
3. La granularité retenue est **écrite** dans la story avant d'être codée, et si elle exige un
   champ nouveau sur `LigneReleve`, la migration l'est aussi.
4. L'état de rapprochement et les écarts du compte reflètent immédiatement le retrait.

---

## Notes

- ⚠️ **Ce n'est pas une demande de confort.** L'import est la seule écriture irréversible de tout
  l'Atelier : une balance se re-soumet en nouvelle version, une ligne de cahier se supprime, un
  appariement s'annule, un socle d'à-nouveaux se regénère en version. Le relevé est l'exception, et
  rien ne la justifie — elle vient de ce que personne n'a eu à retirer un relevé jusqu'ici.
- FE-049 le **dit à l'écran** faute de pouvoir l'éviter : le compte visé est rappelé juste au-dessus
  du bouton, et l'aperçu est le chemin nominal. C'est une atténuation, pas une réponse.
- Consommateur nommé : **FE-049**.
