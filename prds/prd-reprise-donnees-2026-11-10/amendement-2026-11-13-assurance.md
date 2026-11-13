# Amendement du 2026-11-13 — la reprise des données de l'assurance

**Statut : ✅ VALIDÉ par le PO le 2026-11-13** (le PO retient les recommandations du PRD Assurance). À appliquer à `prd.md` et à la spine de la Reprise quand les stories de `reprise` pour l'assurance seront écrites.

**Date :** 2026-11-13 · **Demandé par :** le PRD Assurance (`prds/prd-assurance-2026-11-13/prd.md`, FR-214 à FR-219, actions A-10 et A-19 ; annexe A.7) · **Rédigé pour :** Dev A et Dev B, qui écriront les stories.

---

## 1. Pourquoi un amendement

Le PRD Reprise ne requiert que les **fichiers** en février (FR-1, spine AD-23). Le PRD Assurance veut, au premier jour, **les deux voies** : les fichiers, et l'API du logiciel de la compagnie quand il en expose une. Il ajoute aussi des objets de reprise, deux modules déclarés dans `enrichiPar`, une charge fixée pour un fait publié, et une resynchronisation nocturne qui ne passe pas par `connecteurs`.

## 2. Ce qui change dans `reprise`

### 2.1 L'adaptateur API de l'assurance, au premier jour

- Les **fichiers** (Excel, JSON ; CSV accepté) marchent **sans condition**. Ils ne dépendent pas du logiciel de la compagnie.
- L'**adaptateur API** de l'assurance est écrit **dès que le logiciel de la compagnie est connu** (janvier) et livré **avant la mise en service**.
- Si ce logiciel **n'expose pas d'API**, les fichiers suffisent et **rien ne bloque**.
- L'adaptateur API ne change ni le rapport, ni la validation, ni le feu vert : il remplace seulement la lecture du fichier. Les mêmes règles de traduction et les mêmes tables de correspondance s'appliquent.

### 2.2 Les objets de reprise de l'assurance

`reprise` ne possède aucun objet métier. Il livre par le point d'import de chaque cible, **dans l'ordre des dépendances** : polices avant sinistres, sinistres avant pièces.

| Objet | Cible | Remarque |
|---|---|---|
| `assurance.assure@1`, `assurance.police@1`, `assurance.provision-ouverte@1` | `assurance` | Les polices sont **reçues par `assurance`** : pas de code `polices` (décision du PO du 2026-11-12). |
| `sinistres.dossier@1` | `sinistres` | Un montant requis absent n'est jamais remplacé par zéro : « montant à saisir » (FR-7 du PRD Reprise). |
| `ged.piece@1`, `ged.archive@1` | `ged` | Les pièces et leurs **numéros d'archivage**. Le numéro d'origine garde son format ; un doublon est refusé avec son motif. La **cote physique** du papier est reprise. |
| `expertises.expert@1` | `expertises` | Les experts agréés et leurs coordonnées. |

- Les cibles de l'assurance sont donc `sinistres`, `ged`, `assurance` et `expertises`. Le **feu vert** reste donné par module cible, sur des lots rejoués dans l'espace réel.
- `liaison-assureur` **n'est pas** une cible : il ne possède aucun objet métier.
- Les **dossiers en cours** entrent d'abord, l'historique ensuite. L'historique repris porte un marqueur « historique » et ne se modifie pas depuis l'application.

### 2.3 `enrichiPar` : `ged` et `expertises`

- Le manifeste `reprise` ajoute **`ged`** et **`expertises`** à `enrichiPar` (`manifestes/reprise.manifest.ts`). Ce sont deux modules qui déclarent des objets de reprise (PRD Assurance FR-215 et FR-177).
- La liste de l'assurance devient : `assurance`, `sinistres`, `ged`, `expertises`.

### 2.4 La charge de `reprise.cles-rattachement.publiees@1`

- Le fait existe déjà. L'annexe A.7 du PRD Assurance fixe sa **charge** : **numéro de police, numéro de sinistre, référence de déclaration, numéro d'archivage d'origine**.
- `ged` consomme ce fait (PRD Assurance FR-215) : il rattache chaque pièce reprise à sa police et à son sinistre. Une clé illisible ou inconnue va dans la file « à rattacher » et ne bloque pas la mise en service.
- Les autres verticales gardent la charge que leurs manifestes déclarent. Les clés propres à l'assurance sont un ajout, pas un remplacement.

### 2.5 La resynchronisation nocturne passe par `liaison-assureur`

- Pendant la vie en parallèle, `reprise` resynchronise chaque nuit ce que le logiciel de la compagnie a fait depuis la dernière fois. Elle est **idempotente** (clé d'origine et empreinte de ligne).
- Le manifeste `reprise` reçoit aujourd'hui la nuit de `connecteurs.nuit.terminee@1` et `.absente@1`. Or **`connecteurs` est hors février** pour l'assurance (PRD Assurance FR-245).
- Pour l'assurance, l'échange nocturne passe par **`liaison-assureur`** (`liaison-assureur.sinistre-existant.recu@1`). `reprise` le consomme à la place du fait de `connecteurs`. Quand `connecteurs` sera livré, la même règle s'appliquera par lui.
- Les règles de bascule (dossier « suivi » puis « tenu par Prospera » à la prise en main, litige de source, payé qui fait foi dans Prospera) sont celles de FR-217 du PRD Assurance. Elles ne changent pas le moteur de `reprise`.

## 3. Ce qui n'est pas dans cet amendement

- Le **contenu du rapport** et la **validation par le DG** : inchangés (PRD Assurance FR-216, PRD Reprise FR-11 à FR-13).
- Les **vérifications de C13** propres à l'assurance (`ordre-polices-avant-sinistres`, `montant-absent-jamais-zero`, `numero-archivage-conserve`, `rejeu-sans-doublon`) : elles sont décrites en annexe A.7 du PRD Assurance et s'écriront avec les stories.
- Le **papier** non numérisé : sa cote est reprise, il n'est pas scanné pour la reprise.

## 4. Critères de recette

- Sans API du logiciel de la compagnie, un lot complet entre par fichiers : le rapport, la validation et le feu vert se déroulent sans rien changer.
- Avec l'API, le même lot entre par l'adaptateur : le rapport est identique à celui du fichier équivalent.
- Un lot livre les polices avant les sinistres, et les sinistres avant les pièces.
- `reprise.cles-rattachement.publiees@1` porte les quatre clés ; `ged` rattache une pièce par son numéro de sinistre ; une pièce à clé inconnue va dans « à rattacher ».
- La même resynchronisation nocturne, rejouée, ne crée ni doublon ni changement.
- Le manifeste `reprise` liste `ged` et `expertises` dans `enrichiPar`.
