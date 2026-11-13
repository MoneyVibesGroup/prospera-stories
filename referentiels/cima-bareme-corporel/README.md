# Référentiel `cima-bareme-corporel` — barème légal des dommages corporels (CIMA)

**Fichier :** `bareme-corporel-cima-2014.json` · **Version :** `CIMA-2014` · **Vérifié le :** 2026-11-13 (double saisie concordante) · **Statut :** à valider par le juriste avant la mise en service.

## Ce que c'est

Les tables du **Code des assurances CIMA, Livre II** (art. 258 à 266, modifiés par le Conseil des Ministres du 03/04/2014), qui fixent le **plancher légal** de l'offre d'indemnité aux victimes d'un **accident de la circulation** (art. 231). Elles s'appliquent aussi au fonds de garantie automobile, dans la limite de l'art. 603.

| Table (`id`) | Contenu | Source (PDF 2019) |
|---|---|---|
| `art260_point_ip` | Valeur du point d'incapacité permanente, en % du SMIG annuel, par tranche de taux d'IP (10) et par âge (8) | p. 88 |
| `art262_souffrance_esthetique` | Échelle souffrance physique et préjudice esthétique (8 niveaux, en % du SMIG annuel) | p. 89 |
| `art265_repartition` | Clés de répartition du revenu à capitaliser entre ayants droit (5 compositions familiales) | p. 90-92 |
| `art266_prejudice_moral_ayants_droit` | Préjudice moral des ayants droit (en % du SMIG annuel) | p. 92 |
| `regles_numeriques_art258_266` | Plafonds, seuils et durées écrits en prose (6, 10, 2, 36, 85, 20 SMIG ; 50 % ; 25 ans…) | p. 87-92 |
| `conversion_rentes` | Prix du franc de rente : viagère et temporaire (limites 65, 60, 55, 25, 21 ans), hommes et femmes — table de mortalité 60/64 MHK, taux 6,50 % | p. 99-109 |
| `bareme_acuite_visuelle` | Taux d'IP selon l'acuité des deux yeux (13 × 13) | p. 116 |
| `bareme_audition` | Taux d'IP selon la perte auditive des deux oreilles (7 × 7) | p. 117 |
| `bareme_medical` | Barème fonctionnel indicatif des incapacités : taux ou fourchette par séquelle (264 lignes) | p. 111-135 |

## Comment il a été vérifié

Deux saisies **indépendantes** : la n° 1 depuis le PDF officiel (images et couche texte), la n° 2 depuis la version HTML officielle du Code 2019, recoupée avec le Code 2018 de la FANAF. Un script les a comparées cellule par cellule : **aucun écart de valeur** sur les tables de calcul (776 cellules), les deux tableaux (vue, audition) et le barème fonctionnel ; les seules différences étaient des doublons et des écritures (« max 30 » / « jusqu'à 30 »), tranchées sur l'original. La saisie n° 1 sert de base (elle porte les pages et une séquelle que la n° 2 avait manquée).

## Comment l'utiliser

- **Donnée, jamais code** (PRD assurance FR-4, spine assurance AD-12) : le moteur de calcul lit ce fichier ; une nouvelle version de la CIMA = un nouveau fichier daté, sans reprise du code.
- **Date d'effet** : un dossier est calculé avec la version en vigueur à sa **date de survenance**. Cette version vaut pour les accidents survenus **à partir du 01/08/2014** ; avant, les valeurs de 1999 diffèrent (plafonds et art. 260, 265, 266) : calcul manuel motivé, sous le contrôle du responsable.
- **SMIG** : hors de ce fichier, paramètre daté par pays (Togo : 52 500 FCFA par mois depuis 2023, à confirmer par texte officiel) ; on retient le pays de l'accident, ou le pays de résidence de la victime s'il est plus élevé.
- **Lecture seule pour la compagnie** : seule Money Vibes publie une nouvelle version, par correctif réglementaire, après double saisie et validation du juriste.
- **L'IA ne calcule jamais un montant corporel** à partir de ces tables : le calcul est fait par le moteur et arrêté par le gestionnaire et le médecin-conseil.

## Anomalies de la source

Voir `ANOMALIES.md` : elles sont reproduites **telles qu'imprimées**, jamais corrigées en silence.

## Les autres barèmes (hors de ce fichier)

Le barème CIMA ne vaut **que** pour le corporel automobile. Les autres sinistres relèvent d'autres barèmes : voir le catalogue dans `CATALOGUE-DES-BAREMES.md`.
