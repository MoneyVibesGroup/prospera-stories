# STORY-555 : La balance entre dans le produit et n'en ressort jamais — aucune route ne l'exporte, et une colonne du format Sage n'est pas dérivable

Status: needs-po-decision

**Épic :** EPIC-017 — Socle `balance-service` + contrat de balance canonique
**Service :** `balance-service` (`:3007`) — `modules/balance`
**Points :** 8 · **Sprint :** S20
**Origine :** demande PO du **2026-08-28** — *« le fichier `Balance_des_comptes.pdf` : est-ce que le
système permet d'exporter la balance sous ce format ? »*
**Pièce de référence :** `Balance_des_comptes.pdf` — édition **Sage 100 Comptabilité i7 8.50**,
ETS RELAXED, période du 01/01/23 au 31/12/23, tirée le 08/07/26.
**Réf. :** **STORY-101** (contrat de balance canonique) · **STORY-087** (reprise d'à-nouveaux) ·
**FE-074** (export CSV + impression, `ready-for-dev`, **côté client**)

---

## Le fait, mesuré sur le code

**`balance-service` n'expose aucune route d'export.** Relevé sur ses 23 contrôleurs : les mots
`csv`, `pdf` et `xlsx` n'y apparaissent **que du côté import** (`imports/fichier-tabulaire.ts`,
`imports/profil-parser.service.ts`, `sage-import.controller.ts`).

⇒ **La balance entre par cinq portes — Sage, tabulaire, cahiers, OCR, saisie — et ne ressort par
aucune.** Le cabinet qui veut la pièce doit retourner dans Sage, c'est-à-dire dans l'outil que
Prospera est censé remplacer.

⚠️ **FE-074 ne comble pas ce trou et ne peut pas le combler.** Elle est **frontend** et
`ready-for-dev` : un CSV fabriqué dans le navigateur à partir de ce que l'écran a chargé. Ce n'est
pas une **pièce du dossier de révision** — ni horodatée par le serveur, ni rattachée à une version
de balance, ni reproductible. Pour une balance destinée à être signée ou remise, c'est disqualifiant.

## ⛔ Ce que le contrat ne porte pas, et qui commande l'arbitrage

L'édition Sage présente **trois paires de colonnes** :

| Bloc du PDF | Colonnes | Dans `LigneBalance` ? |
|---|---|---|
| Mouvements au 31/12/22 | Débit / Crédit | ⛔ **absent** |
| Mouvements | Débit / Crédit | ✅ `mouvementDebit` / `mouvementCredit` |
| Soldes cumulés | Débit / Crédit | ✅ `soldeDebiteur` / `soldeCrediteur` |

Le schéma réel ne porte que **quatre** montants :

```ts
@Prop({ required: true }) compte!: string;
@Prop({ required: true }) libelle!: string;
@Prop({ type: Number, required: true }) mouvementDebit!: number;
@Prop({ type: Number, required: true }) mouvementCredit!: number;
@Prop({ type: Number, required: true }) soldeDebiteur!: number;
@Prop({ type: Number, required: true }) soldeCrediteur!: number;
```

⚡⚡ **Et la paire manquante n'est PAS reconstituable par le calcul.** Les soldes cumulés sont des
soldes **nets** portés d'un côté ou de l'autre ; les mouvements antérieurs sont des **cumuls**
bruts au débit et au crédit. De `(mouvements de la période, solde net)` on ne peut pas retrouver
`(cumul débit antérieur, cumul crédit antérieur)` — l'information a été perdue à l'entrée, pas
égarée.

⚠️ `POST …/balance/a-nouveaux` (STORY-087) construit bien un socle d'ouverture, mais c'est un
**socle de soldes**, pas les cumuls de mouvements de l'exercice précédent. À vérifier à la
conception plutôt qu'à supposer : c'est le seul endroit du produit où la matière pourrait exister.

## L'arbitrage à rendre

- **Voie A — exporter ce que le produit détient.** Une balance à **deux** blocs (mouvements,
  soldes), au format Prospera, honnête sur ce qu'elle contient. Livrable tout de suite, et suffit
  à la révision comme au contrôle d'équilibre.
- **Voie B — reproduire l'édition Sage à l'identique.** Exige d'**élargir le contrat canonique**
  d'une paire de colonnes, donc de toucher **STORY-101** — la pièce qui rend cabinet, IMF et
  distributeur interchangeables — et de faire remonter la donnée par les **cinq** adaptateurs
  d'entrée. Coût sans commune mesure, et un import Sage qui ne fournirait pas la colonne rendrait
  l'export incomplet malgré tout.

⚠️ **Recommandation : voie A**, avec la colonne manquante **déclarée absente** plutôt que remplie
d'un zéro. Un zéro dans une colonne « mouvements antérieurs » se lit comme « ce compte n'avait pas
bougé », ce qui est faux et invérifiable.

⛔ **Tant que cet arbitrage n'est pas rendu, cette story n'est pas tirable.**

## Périmètre

**Inclus** *(sous réserve de l'arbitrage)*

- `GET /dossiers/{id}/balances/{balanceId}/export?format=pdf|xlsx|csv` — **côté serveur**, sur une
  **version** de balance identifiée, jamais sur l'écran courant.
- L'en-tête qui fait d'une impression une pièce : dénomination, exercice, **version de balance**,
  date de tirage, et la mention **« provisoire » / « validée »** selon le statut réel — l'édition
  Sage porte « Impression provisoire », et cette mention est ce qui protège le lecteur.
- Les deux contrôles d'équilibre que le service tient déjà (`mouvements` et `soldes`, via
  `EquilibreSub`) sont **imprimés au pied**, comme Sage imprime ses totaux.
- Le `niveauPreuve` de chaque ligne apparaît : c'est une information que Sage n'a pas et que le
  produit a — une balance issue de cahiers n'a pas la même force qu'une balance importée.

**Hors périmètre**

- Élargir le contrat canonique (voie B). Si le PO la choisit, c'est une story à part, sur
  `balance-service` **et** les cinq adaptateurs.
- Remplacer FE-074. L'export client garde son usage — consulter, trier, bricoler — mais il cesse
  d'être présenté comme la pièce.

## Critères d'acceptation

1. L'export porte sur une **version** de balance ; deux appels sur la même version rendent un
   document au contenu identique.
2. Le document nomme sa version, sa date de tirage et son statut. ⛔ **Une balance non validée
   sort marquée « provisoire »** — sans exception, et la mention n'est pas retirable par paramètre.
3. La colonne « mouvements antérieurs » est **absente du document** (voie A) — pas présente à zéro.
4. Les totaux et les deux contrôles d'équilibre imprimés sont ceux du service, **jamais recalculés
   au rendu**.
5. Une balance de 3 000 lignes s'exporte sans dépasser le plafond de débit du service ; le patron
   `@Throttle` de `bilan-service/export` est repris.
6. Le `niveauPreuve` figure ligne à ligne, et sa légende est imprimée.

## Notes

- ⚡ **Le vrai sujet n'est pas « faire un PDF », c'est « produire une pièce ».** Une balance remise
  à un tiers doit dire de quelle version elle sort et si elle est figée. C'est ce que l'édition
  Sage fait avec « Impression provisoire », et c'est ce qu'un CSV client ne peut pas faire.
- ⚠️ Le patron existe déjà à côté : `bilan-service/src/modules/bilan/export` (STORY-073) rend
  PDF et XLSX en synchrone, avec `nom-fichier.ts`, `empreinte.ts` et un `@Throttle` propre. **À
  réutiliser, pas à réinventer.**
- ⛔ **Ne pas prendre le PDF de référence pour un gabarit officiel.** C'est une édition **Sage**,
  pas un format réglementaire : rien n'oblige à en copier la mise en page. Ce qu'il faut en
  reprendre, ce sont les **informations** qu'un réviseur y cherche.
