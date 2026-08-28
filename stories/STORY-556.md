# STORY-556 : Le classeur de dépôt GUDEF fait 92 feuilles — l'export en produit une, et le référentiel ne déclare que 11 notes sur 44

Status: ready-for-dev

**Épic :** EPIC-014 — Consultation & export — `bilan-service`
**Service :** `bilan-service` (`:3004`) — `modules/bilan/export`, `modules/bilan/referentiel`
**Points :** 13 → **5** ⬇️ *(2026-08-28 : scindée — le gabarit part en STORY-558, les 33 notes en STORY-559 ; il reste l'interface de récupération et le décompte de complétude)* · **Sprint :** S20
**Origine :** demande PO du **2026-08-28** — *« le fichier xlsx c'est pour la déclaration, est-ce
que le système génère cela aussi ? »*
**Pièce de référence :** `1000745307_2025_Definitif (1).xlsx` — **DSF définitive**, dossier PARVIS
DE LA MAISON SAINTE (PMS), NIF 1000745307, exercice clos le 2025-12-31. **92 feuilles.**
**Arbitrage PO :** ✅ **RENDU le 2026-08-28 — le gabarit devient une DONNÉE PAR PAYS**, le Togo en
étant la première instance. ⇒ scindée : **STORY-558** porte le gabarit et le classeur ;
**STORY-559** porte les 33 notes manquantes. Cette fiche garde la **moitié `bilan-service`** —
l'interface de récupération et le décompte de complétude.
**Réf. :** **STORY-073** (export PDF/XLSX, livré) · **STORY-330/331** (production du livrable et
format de canal décrit comme donnée, `fiscal-service`) · **FE-038** (déclenchement à l'écran)

---

## Le fait, mesuré des deux côtés

**Ce que l'export produit aujourd'hui** — `rendu-excel.ts`, ligne 12 :

```ts
const sheet = workbook.addWorksheet('Export');
```

**Une seule feuille**, nommée « Export », où `modele-liasse.ts` empile huit sections :
Bilan actif, Bilan passif, Sous-totaux, Compte de résultat, SIG, TFT, Notes annexes, Contrôles.

**Ce que le dépôt attend** — 92 feuilles, dont :

| Bloc du classeur | Feuilles | Modélisé ? |
|---|---|---|
| Page de garde, Fiche conditions, **Fiche dépôt**, NAEMA, Table des codes | 5 | ⛔ aucun |
| Fiche identification 1 & 2, Fiche dirigeants | 3 | ⛔ aucun |
| Bilan actif, Bilan passif, Compte de résultat, TFT, FR 4 | 5 | ✅ 4 sur 5 |
| **Notes 1 → 35** (44 feuilles avec les A/B/C/bis) | 44 | ⚠️ **11 déclarées** |
| États complémentaires, Résultat fiscal, Liquidation IS_IR_MP, Liquidation DP | 8 | ✅ partiellement |
| P64 → P86 — détails charges, produits, TVA, TVM, provisions, amortissements | 23 | ⛔ aucun |
| Liste principaux clients / fournisseurs | 2 | ⛔ aucun |
| **Balance (Optionnel)** | 1 | ⛔ aucun — cf. **STORY-555** |
| **Contrôle de cohérence · Type de contrôles** | 2 | ⚠️ 4 contrôles produits |

⚡ **Le référentiel packagé `syscohada-revise@2.1` déclare 11 notes** — 3, 4, 5, 6, 7, 8, 9, 10,
11, 12 et 17 — soit l'actif et une seule note de passif. **Le classeur en porte 44.** Ce n'est pas
un défaut de l'export : la matière n'existe pas en amont.

⚠️ **Les six états principaux, eux, sont bien là.** Les `postes` du paquet couvrent
`BILAN_ACTIF`, `BILAN_PASSIF`, `COMPTE_RESULTAT`, `TFT`, `RESULTAT_FISCAL` et `LIQUIDATION_IS`.
Le cœur comptable est produit ; c'est **l'enveloppe de dépôt** qui manque.

## Ce que ça coûte, dit simplement

Le cabinet produit sa liasse dans Prospera, l'exporte… puis **recopie** les six états dans le
classeur officiel, remplit à la main les 33 notes restantes, les 23 feuilles de détail et les
fiches d'identification. C'est-à-dire qu'il refait le dépôt entier hors du produit.

⛔ **Et les deux dernières feuilles du classeur sont un juge.** « Contrôle de cohérence » et
« Type de contrôles » sont des feuilles **calculées par le classeur lui-même**, qui rendent
`VRAI`/`FAUX` sur huit contrôles intermontants et une cotation des valeurs numériques. Sur la
pièce de référence, le premier est **`FAUX`** (Total Actif 3 060 000 / Total Passif 0). ⇒ **Le
classeur note ce qu'on y dépose.** Un produit qui remplit ce classeur hérite de son barème, et
doit le viser avant remise — pas après rejet.

## ✅ L'arbitrage, et ce qu'il tranche

**Qui porte le classeur : `bilan-service` ou `fiscal-service` ?**

- **Voie A — `bilan-service`.** Il a déjà le moteur, les postes, les notes et un module d'export
  qui rend du XLSX. Le classeur devient un second `modele-*.ts` à côté de `modele-liasse.ts`.
  Rapide, mais **fait entrer un format de dépôt national dans le service comptable**, alors que le
  produit vient de décider l'inverse pour la fiscalité.
- **Voie B — `fiscal-service`, via STORY-330/331.** La spine fiscale a déjà posé *« format de canal
  **décrit comme donnée du paquet** »* : le gabarit du classeur y serait une donnée versionnée,
  pas du code, et changerait avec la loi de finances sans redéploiement. Mais **`fiscal-service`
  n'existe pas** — ni dossier, ni entrée `docker-compose` — et son socle est `STORY-361`.

✅ **ARBITRAGE RENDU LE 2026-08-28 : voie B pour le gabarit, voie A pour la matière.**
`bilan-service` expose ce qu'il produit — le PRD fiscalité l'écrivait déjà (*« devient fournisseur
du contenu de la liasse pour le dépôt ; aucune fonctionnalité nouvelle exigée en v1, mais une
interface de récupération à exposer »*) — et `fiscal-service` assemble le classeur.

⚡ **Et le PO a ajouté ce qui décide de la forme : « précise que c'est pour le Togo, avec la
possibilité d'en avoir pour chaque pays ».** Le gabarit est donc une **donnée versionnée du paquet
pays**, jamais un modèle en dur — c'est déjà la règle de STORY-331, appliquée au cas le plus lourd
de la zone.

⇒ **Scission :**

| Fiche | Ce qu'elle porte | Service |
|---|---|---|
| **STORY-559** | les 33 notes manquantes du référentiel — **le préalable** | `bilan-service` |
| **STORY-558** | le gabarit `depot-dsf-togo@2025` et la production du classeur | `fiscal-service` |
| **celle-ci** | l'interface de récupération et le décompte de complétude | `bilan-service` |

⚠️ **Les 33 notes ne sont d'aucune des deux voies** : c'est un travail de **référentiel**, à faire
une fois, et il conditionne tout le reste.

## Périmètre

**Inclus**

- **Le décompte de complétude, avant tout.** Une route qui dit, pour un jeu d'états donné :
  quelles feuilles du classeur sont **produites**, lesquelles sont **déclarées mais vides**, et
  lesquelles ne sont **pas modélisées**. ⚡ C'est le livrable qui a le plus de valeur immédiate :
  il transforme « le produit ne fait pas le dépôt » en une liste chiffrée et actionnable.
- L'interface de récupération que le PRD fiscalité attend de `bilan-service` : les six états et
  les notes disponibles, dans une forme **adressée par code de poste**, pas par mise en page.
- Le visa des deux feuilles de contrôle : les quatre contrôles de `controles-coherence` sont mis
  en regard des huit contrôles intermontants du classeur, et **l'écart de couverture est publié**.

**Hors périmètre**

- **Écrire les 33 notes manquantes du référentiel** : **STORY-559**, prérequis.
- **Produire le classeur** : **STORY-558**, qui porte le gabarit Togo comme donnée de paquet.
- Les fiches d'identification, dirigeants et NAEMA : la matière vit dans `dossier-service`, pas
  ici. Rapprochement à faire, contenu à ne pas dupliquer.
- Le dépôt lui-même — assisté (**STORY-332/333**) ou **automatisé** (**STORY-561**). ⚠️ **Le PRD
  fiscalité §3.2 disait « assisté, jamais automatisé » : le PO a levé cette réserve le 2026-08-28.**
  Le connecteur est retenu, déclaré par pays, avec repli sur l'assisté quand il n'est pas
  renseigné. Cette fiche n'en porte rien — mais elle ne doit plus affirmer le contraire.

## Critères d'acceptation

1. Le décompte de complétude rend, pour un jeu d'états : `produites`, `declareesVides`,
   `nonModelisees`, avec le nom de feuille du classeur en clair.
2. Une feuille **non modélisée** est nommée comme telle. ⛔ **Jamais rendue « vide »** — un
   classeur qui présente une note vide se lit comme « cette entreprise n'a rien à y déclarer »,
   ce qui est une affirmation, et elle serait fausse.
3. Le décompte cite le référentiel et sa version : le nombre de notes disponibles dépend du
   paquet, pas du code.
4. L'interface de récupération est adressée **par code de poste** et ne porte aucune mise en page.
5. L'écart entre les 4 contrôles produits et les 8 contrôles du classeur est publié nommément.
6. Sur la pièce de référence (PMS, NIF 1000745307, exercice 2025), le décompte rend un résultat
   **vérifiable à la main** contre les 92 feuilles.

## Notes

- ⚡ **Le classeur porte une feuille « Balance (Optionnel) »** — c'est-à-dire que le dépôt accepte
  la balance en pièce jointe. **STORY-555** la produit ; les deux stories se rejoignent là.
- ⚠️ **Nomenclature.** Le guichet togolais s'appelle **GUDEF** (`gudef.otr.tg`), pas « GUIDEF ».
  Le PRD fiscalité le signale déjà : *« à corriger partout »* — `prospera-stories/` et les
  référentiels portent encore l'ancienne graphie, y compris dans des noms de fichiers packagés.
- ⛔ **Ne pas confondre « produire le classeur » et « déposer ».** Le premier est le sujet de cette
  story. Le second est un geste humain sur un portail à MFA, et le restera en v1.
