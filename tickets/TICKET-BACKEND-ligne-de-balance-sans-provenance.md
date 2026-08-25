# TICKET-BACKEND — une ligne de balance ne dit pas **d'où elle vient**, et rien ne permet de remonter à ses pièces

**Cible :** `balance-service` (:3007)
**Ouvert par :** revue d'usage « expert-comptable venant de Sage » du **2026-08-25** (barry thierno alhassane) — constat de **conception**, pas d'intégration
**Consommateur nommé :** **FE-075** *(`blocked` sur ce ticket — nommée dès l'ouverture, pour ne pas rejouer l'orphelinat de STORY-144)*
**Priorité :** Should — aucune panne, mais le geste le plus fréquent du métier est impossible, et il l'est **en silence**
**État :** ⛔ ouvert

---

## Le constat

Le produit tient toute sa promesse sur une idée : **chaque chiffre repose sur une pièce**. Elle est
tenue **ligne à ligne dans les cahiers** (chaque recette porte la vignette de l'image qui l'a
produite) et **statistiquement dans la balance** (`niveauPreuve` par ligne, `statutPreuve` pondéré
en montants). Entre les deux, **le chaînon est coupé** : une ligne de balance ne référence rien.

Relevé le 2026-08-25 sur `origin/dev` (`src/modules/cahiers/agregation/dto/agregation.dto.ts`,
`src/modules/balance/dto/submit-balance.dto.ts`) :

```ts
// La ligne de balance, en entrée comme en sortie :
{ compte, libelle, mouvementDebit, mouvementCredit, soldeDebiteur, soldeCrediteur, niveauPreuve }
// ⇒ `niveauPreuve` dit de QUELLE NATURE est la preuve.
// ⇒ RIEN ne dit QUELLE preuve.
```

Le service **connaît** pourtant le lien au moment où il agrège : `POST …/balances/depuis-cahiers`
lit les lignes de cahier, les ventile par compte et en fait des soldes. **L'information existe
pendant le calcul et n'est écrite nulle part.**

## Pourquoi ça compte

C'est le geste que l'expert-comptable fait **des dizaines de fois par jour** : il voit
`701 Ventes de marchandises 68 900 000` et il clique pour savoir **quelles ventes**. Dans Sage, c'est
le grand livre. Ici, il n'y a rien à cliquer — et l'écran ne dit pas pourquoi.

⚡ **Et l'ironie est que la matière est là.** L'image est stockée, la ligne de cahier porte son
compte, la balance porte son total. **Ce sont trois maillons présents et deux jointures absentes.**
Une balance qui affirme « ces 68,9 M reposent sur des pièces » **sans pouvoir en désigner une seule**
est exactement la promesse que le produit vend et que le contrat ne tient pas.

## Ce qui rend le contournement impossible

Trois voies ont été examinées le 2026-08-25 ; **aucune ne tient** :

| Voie | Pourquoi elle échoue |
|---|---|
| Filtrer les lignes de cahier sur le compte | ⛔ **`RecettesQueryDto` n'accepte que `mois`.** Pas de filtre `compte`. Il faudrait charger **12 mois** et filtrer côté client — pour un seul compte, sur un écran de 1 284 lignes. |
| Passer par `GET …/cahiers/{livre}/totaux-comptes` | ⛔ Il rend **compte → total**, c'est-à-dire la même agrégation que la balance, **pas** les lignes qui la composent. Il répond « combien », jamais « lesquelles ». *(Et il appartient déjà à FE-046.)* |
| Repartir du fichier importé (source `sage`) | ⛔ La balance ne référence **ni** son import **ni** son profil en sortie — c'est le même angle mort que **STORY-388** (`origine` et `balanceSourceId` absents de `BalanceResponseDto`) et **STORY-389/390** (le mapping et les réglages retenus ne sortent pas). |

## Demande

**Que la ligne de balance porte de quoi remonter à ce qui l'a produite** — la forme reste au choix
du service, deux options crédibles :

- **(a) Sur la ligne** : un `origine` optionnel décrivant *comment* elle a été produite
  (`OCR` / `IMPORT` / `SAISIE` / `A_NOUVEAUX`) et *de quoi* (identifiant du lot, de l'import, ou du
  socle). Coût : le DTO grossit sur chaque ligne.
- **(b) Une route de détail** : `GET /dossiers/{id}/balances/{balanceId}/lignes/{compte}/origine`,
  qui rend les lignes sources d'un compte. Coût : une route de plus ; bénéfice : **la balance
  elle-même ne grossit pas**, ce qui compte sur 1 284 lignes.

⚠️ **Recommandation : (b).** La provenance n'est consultée que sur **un** compte à la fois, à la
demande — la charger sur les 1 284 lignes de chaque lecture serait payer en permanence pour un
geste ponctuel.

⚠️ **Ne PAS sceller le nouveau champ dans le checksum.** Le sceau ne couvre que le contenu métier ;
l'y ajouter refuserait en `400` toute balance déjà soumise. *(Même précaution que le ticket
`balance-ne-declare-pas-son-dossier`.)*

⚠️ **Les balances DÉJÀ produites n'auront pas cette information**, et c'est acceptable — à condition
que le contrat permette de **distinguer « pas de provenance enregistrée » de « aucune pièce »**. Un
champ absent qui se lit « aucune preuve » transformerait une limite technique en accusation.

## Renvois

- **STORY-388** — `BalanceResponseDto` ne publie ni `origine` ni `balanceSourceId`. **Voisin, pas
  identique** : 388 porte sur l'origine de **la balance**, ce ticket sur celle de **la ligne**.
- **STORY-391 / STORY-392** — la jointure ligne de cahier ↔ image, **impossible dans les deux sens**.
  ⚡ **Elles sont l'AMONT de ce ticket** : même résolu ici, le comptable atteindrait des lignes de
  cahier **sans pouvoir en ouvrir la pièce**. Les trois se tiennent, et **391/392 passent d'abord**.
- **FE-046** — consomme `totaux-comptes` ; ne referme pas ce manque (voir le tableau ci-dessus).
