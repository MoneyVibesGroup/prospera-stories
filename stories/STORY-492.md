# STORY-492 : Aucun registre ne dit quels pays sont servis — la liste des cinq pays est codée dans un `<select>`

Status: ready-for-dev

**Épic :** EPIC-108 — Le référentiel devient un plugin déclaré (zone, pays, devise, norme)
**Service :** `platform-catalog-service` (`:3006`) + consommateurs `balance-service` / `bilan-service` / `dossier-service`
**Points :** 5 · **Sprint :** S20
**Prérequis :** **STORY-491** (le paquet déclare ses pays).
**Origine :** revue **expert-comptable** de la maquette cumulative, 2026-08-27.

---

## Le fait

La seule chose qui, dans tout le produit, énumère les pays servis est un **menu déroulant de
l'assistant de création de dossier** : cinq entrées (`TG` disponible, `BJ` / `CI` / `SN` / `BF`
« paquet à venir »). Aucune de ces cinq n'est vérifiable : ce n'est ni une donnée, ni un contrat,
ni une projection — c'est un balisage.

Trois conséquences immédiates :

1. **« Paquet à venir » n'est adossé à rien.** Rien ne dit si le paquet béninois est en cours, prévu
   ou imaginé. Le jour où il arrive, personne ne saura que ce `<select>` doit changer.
2. **L'UEMOA n'est pas la CEDEAO, et le produit confond les deux.** L'assistant écrit « Zone UEMOA →
   monnaie XOF ». L'UEMOA compte 8 États ; la CEDEAO 15, dont **six hors OHADA et hors franc CFA**.
   La Guinée est OHADA **sans** être UEMOA (monnaie GNF) : elle tombe entre les deux règles que le
   produit connaît.
3. **Aucune question ne peut être posée au système.** « Ce pays est-il servi ? », « avec quel
   référentiel ? », « quelle devise ? », « quel paquet fiscal ? » n'ont pas de destinataire.

## Le registre à construire

Une entrée par pays, dérivée et non ressaisie :

| Champ | Source |
|---|---|
| `pays` | ISO 3166-1 alpha-2 |
| `devise` | ISO 4217 (code + exposant) |
| `zonesComptables[]` | dérivé des `_meta.pays[]` des référentiels packagés (STORY-491) |
| `referentielsDisponibles[]` | référentiels effectivement **packagés** couvrant ce pays |
| `paquetFiscal` | identifiant + version, ou `null` |
| `statut` | `servi` · `partiel` (référentiel oui, paquet fiscal non) · `non-servi` |

## Critères d'acceptation

- [ ] AC-1 — `GET /pays` rend le registre. `GET /pays/{code}` rend une entrée, ou `404` — jamais une
      entrée vide qui se lirait « servi avec rien ».
- [ ] AC-2 — Le statut est **calculé**, jamais saisi : `servi` exige un référentiel packagé **et** un
      paquet fiscal ; `partiel` exige le référentiel seul. Un pays devient `servi` le jour où son
      paquet est packagé, sans qu'on touche au registre.
- [ ] AC-3 — La création d'un dossier sur un pays `non-servi` est **refusée**
      (`409 PAYS_NON_SERVI`) ; sur un pays `partiel`, elle est **acceptée avec un avertissement
      publié** — le référentiel comptable suffit à tenir une balance et une liasse ; c'est le
      calcul de l'impôt qui manque, et il faut le dire au lieu de le laisser découvrir.
- [ ] AC-4 — Le registre est semé pour les **17 États de l'OHADA** au minimum, et les six États de
      la CEDEAO hors OHADA y figurent en `non-servi` **avec leur devise et leur norme réelle**
      (IFRS / IFRS for SMEs). ⚡ Les faire figurer en `non-servi` vaut mieux que les omettre :
      omettre laisse croire à un oubli, `non-servi` est une décision qu'on peut relire.
- [ ] AC-5 — Un test de cohérence croise le registre et les manifestes : **aucun pays `servi` sans
      artefact packagé correspondant**. Il vire au rouge si l'un des deux bouge sans l'autre.

## Conséquences ailleurs

- **FE-082** consomme `GET /pays` au lieu de son `<select>` en dur.
- Ouvre la trajectoire annoncée par le PO — CEDEAO, puis Afrique de l'Est, puis Europe — **sans
  aucune ligne de code d'écran par pays** : ajouter un pays devient un paquet + une entrée.

## Notes

- ⚠️ **Le registre n'est pas une liste de pays où l'on vend** : c'est une liste de pays dont le
  cadre comptable et fiscal est packagé. Les deux se confondent aujourd'hui parce qu'il n'y en a
  qu'un.
- Voir [[STORY-491]], [[STORY-489]], [[FE-082]].
