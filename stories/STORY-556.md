# STORY-556 : Le classeur de dépôt GUDEF fait 92 feuilles — l'export en produit une, et le référentiel ne déclare que 11 notes sur 44

Status: done

**Épic :** EPIC-014 — Consultation & export — `bilan-service`
**Service :** `bilan-service` (`:3004`) **+ `fiscal-service`** — PR jumelles (arbitrage user du 2026-09-30)
**Points :** 13 → **5** ⬇️ *(2026-08-28 : scindée — le gabarit part en STORY-537, les 33 notes en STORY-559 ; il reste l'interface de récupération et le décompte de complétude)* · **Sprint :** S20 · **Complexité :** high · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** demande PO du **2026-08-28** — *« le fichier xlsx c'est pour la déclaration, est-ce
que le système génère cela aussi ? »*
**Pièce de référence :** `1000745307_2025_Definitif (1).xlsx` — **DSF définitive**, dossier PARVIS
DE LA MAISON SAINTE (PMS), NIF 1000745307, exercice clos le 2025-12-31. **92 feuilles.**
**Arbitrage PO :** ✅ **RENDU le 2026-08-28 — le gabarit devient une DONNÉE PAR PAYS**, le Togo en
étant la première instance. ⇒ scindée : **STORY-537** porte le gabarit et le classeur ;
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
| **STORY-537** | le gabarit `depot-dsf-togo@2025` et la production du classeur | `fiscal-service` |
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
- **Produire le classeur** : **STORY-537**, qui porte le gabarit Togo comme donnée de paquet.
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

## ⚡ Recadrage du 2026-09-30 — ce qui prime sur le texte ci-dessus

La fiche a été écrite **avant** STORY-559 et STORY-537. Mesuré sur le code au 2026-09-30 :

| La fiche disait | Le code dit |
|---|---|
| 4 contrôles produits | **8** codes (`CODES_CONTROLE`) : `EQUILIBRE_BILAN`, `COHERENCE_RESULTAT`, `VARIATION_TRESORERIE`, `ARTICULATION_NOTES`, `COMPTES_NON_AFFECTES`, `RESULTAT_NON_AFFECTE`, `INTEGRITE_NOTES`, `COHERENCE_STOCKS` |
| 11 notes déclarées | `syscohada-revise@2.2` en déclare **43** (NOTE 2 et 35 : narratives, hors périmètre) |
| gabarit `depot-dsf-togo@2025`, `fiscal-service` inexistant | paquet **`TG` × `DSF` v1.0** livré par 537, 92 feuilles dans `format.schema.feuilles` ; les 43 feuilles de notes restent vierges (**STORY-680**) |
| « interface de récupération » à créer | `fiscal-service` lit déjà la version figée par la route publique `…/versions/:version` — avec la mise en page d'un snapshot, pas adressée par code |

**Les 8 contrôles intermontants du classeur**, lus dans `Type de Contôles` (B13-B20) : n°1 Actif = Passif ↔ `EQUILIBRE_BILAN` ; n°2 résultat CR = résultat au passif ↔ `RESULTAT_NON_AFFECTE` ; n°3 → n°8 (résultat fiscal, liquidation IS/IR, chiffre d'affaires ×2, comptes bancaires ×2) : **aucun contrôle produit**.

### ✅ Arbitrage user du 2026-09-30 — scinder en deux dépôts

La liste des 92 feuilles est une donnée **du paquet pays** : elle ne doit exister qu'**à un endroit**.

| Dépôt | Ce qu'il porte |
|---|---|
| `bilan-service` | `GET …/etats/:id/versions/:version/contenu` — l'interface de récupération (AC-4) : états et notes **par code**, sans mise en page, statut de chaque note (`PRODUITE` / `A_COMPLETER` / `VIDE`), contrôles tels que produits, référentiel@version (AC-3) |
| `fiscal-service` | le **décompte par feuille** (AC-1, 2, 5, 6) : une correspondance versionnée des 92 feuilles de `TG×DSF v1.0` (nature + motif), les 8 contrôles OTR mis en regard, et une route qui lit le contenu ci-dessus |

**Règles de décompte** — `produites` (le livrable v1.0 y écrit), `produitesNonTranscrites` (la matière
existe côté `bilan-service`, le gabarit n'a pas de case : renvoi STORY-680), `declareesVides` (déclarée
au référentiel, **rien** dans cette liasse), `nonModelisees` (avec motif), `calculeesParLeClasseur`.
Somme = 92. ⛔ Un poste à 0 est une **réponse** (`PRODUITE`), pas un vide ; une note que le référentiel
de la liasse ne déclare pas (`@2.1`) est **non modélisée**, jamais vide (AC-2).

**Hors périmètre ajouté** : transcrire les notes dans le classeur (**STORY-680**).

## Progress Tracking

- **2026-09-30 — `in_progress`.** Recadrage + arbitrage user (scission `bilan-service` / `fiscal-service`).
  Branches `MNV-556` ouvertes sur les deux dépôts (base `dev`).
- **2026-09-30 — développement** (PR jumelles `bilan-service#153` + `fiscal-service#10`).
  - `bilan-service` : `GET …/etats/:id/versions/:version/contenu` (mêmes gardes, même 404, même
    revérification d'empreinte que `versions/:version`) ; refus `CONTENU_AMBIGU` si deux lignes
    figées portent la même clé. ⚠️ **Constat** : la liasse figée porte bilan actif/passif,
    sous-totaux, compte de résultat, TFT — **pas** de résultat fiscal ni de liquidation IS (déclarés
    au référentiel, non produits par le moteur) : les « six états » de la fiche étaient quatre.
  - `fiscal-service` : correspondance des 92 feuilles (`src/modules/completude-depot/assets/tg-dsf-1.0.json`)
    qui désigne le paquet scellé par son empreinte — paquet **inchangé** (`paquet:tg-dsf:verifier`
    conforme, `2b6784de…`) ; classement : 4 états, 1 page de garde, 1 identification, 42 feuilles de
    notes (43 notes), 8 calculées par le classeur (0 case de saisie), 36 non modélisées ;
    `GET /v1/livrables-depot/:pays/:etat/completude` (10/min). Les 8 contrôles OTR : n°1 ↔
    `EQUILIBRE_BILAN`, n°2 ↔ `RESULTAT_NON_AFFECTE`, n°3 → n°8 non couverts, nommés avec leur formule.
- **Portes rejouées en session** : bilan lint 0 · build · 10 766 unitaires (99,39 / 97 / 99,58 / 99,5)
  · 2 521 e2e ; fiscal lint 0 · build · 1 299 unitaires (99,19 / 96,1 / 98,89 / 99,57) · 106 e2e.
  Table de mutations : 9 mutants de dev + 1 (bilan) et 3 (fiscal) de revue, tous rouges.
- **Revue de code (⑥, opus)** — ⛔ **1 constat, retenu comme bloquant** (la revue le classait
  non bloquant) : la règle de statut testait « aucune matière » AVANT `detailACompleter`, si bien
  que les **douze trames vierges** du classeur (notes 1, 3B, 8A, 15B, 16B, 16Bbis, 16C, 27B, 31→34)
  sortaient « déclarées vides » — lu « rien à déclarer », précisément ce que l'AC-2 interdit.
  Corrigé des deux côtés : `bilan-service` rend `A_COMPLETER` dès que le détail reste à saisir ;
  `fiscal-service` gagne une **sixième liste `aCompleter`**, prioritaire (l'action du cabinet
  prime). Effectifs AC-6 : **@2.2 = 6 produites + 27 à compléter + 15 non transcrites + 0 vide + 36
  non modélisées + 8 calculées = 92** ; **@2.1 = 6 + 2 + 8 + 0 + 68 + 8 = 92**.
- **Revue de sécurité (⑦, opus)** — **0 constat** (gardes et 404 identiques à `versions/:version`,
  identifiants `@EstObjectId` + `encodeURIComponent` avant l'appel amont, jeton relayé sans journal,
  corps amont plafonné à 16 Mio, clés de dictionnaire filtrées par motif).
- Lentille ponytail : 9 simplifications de forme non appliquées (validateurs de forme dupliqués entre
  `correspondance-classeur.ts` et `schema-classeur.ts`, `effectifs` dérivables) — dette nommée.

- **Vérification docker (④, stack NEUVE `down -v`, 2026-09-30)** — `tmp/verif-docker-555-557/`, **249 verdicts OK, 0 KO**, commune à 555/556/557 ; p0 prouve les commits exécutés (`balance-service` b962ebb, `bilan-service` 29a7aab, `fiscal-service` d2d744a) et l'identité sha256 hôte = `src` monté, `pdfkit` 0.19.1 dans l'image.
  Liasse FIGÉE `syscohada-revise@2.2` : `…/contenu` ⇒ 43 notes, empreinte = celle du snapshot en base, 13 trames et **aucune** en `VIDE` ; complétude ⇒ 92 feuilles, six listes, chaque feuille une fois, effectifs **6 / 27 / 15 / 0 / 36 / 8** — ceux calculés à la main avant le run ; contrôles OTR n°1/n°2 avec le verdict de la liasse ; paquet = checksum du manifeste ; B ⇒ 404 (`LIASSE_INTROUVABLE` côté fiscal) ; aucune écriture dans les bases bilan et fiscal.
- **Mutations rejouées en session** : 8/8 rouges (+ 4 de revue).
- **Intégration (⑧)** : PR jumelles `bilan-service#153` puis `fiscal-service#10` rebase-mergées ENSEMBLE sur `dev` ; chaque `dev` = l'arbre vérifié.
- **2026-09-30 — `done`.** Statut synchronisé : en-tête, `sprint-status.yaml` (+ `completed_date`), ce suivi.
