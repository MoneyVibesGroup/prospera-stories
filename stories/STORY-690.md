# STORY-690 : Les 23 feuilles de notes encore laissées au cabinet — mouvements, zones géographiques, trames à libellé imprimé

Status: done

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` (paquet `TG` × `DSF` v1.2) — `bilan-service` (plan, ventilation)
**Points :** 8 · **Complexité :** high · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** clôture de STORY-680 (2026-10-01).

---

## Le fait, mesuré

La v1.1 remplit 19 feuilles de notes sur 42 (règle : une feuille entière ou rien). Restent vierges et tracées :

| Notes | Motif |
|---|---|
| 21, 22 | ventilation par zone géographique : sous-comptes 7011 à 7015 exigés, la balance tient `701000` |
| 26 | 651 ne se répartit pas entre clients et autres débiteurs |
| 30 | « Subventions d'équilibre » (produit) imprimée parmi les charges |
| 28, 3C, 3D | tableaux de mouvements |
| 1, 3A, 3B, 15B, 16B, 16B bis, 27B, 31, 34 | trames à libellés imprimés ou matière hors balance |
| 8A, 12, 16C | lignes libres non alignées ou en deux sections |

Et les trames des notes `MIXTE` saisies sur des lignes à **libellé imprimé** (4, 7, 8, 15A, 16A à 19, dont les
échéanciers) ne sont pas transcrites — la complétude le signale.

## Décisions PO (2026-10-07, avant tout code)

- **D-690-1 — périmètre** : `fiscal-service` seul. L'AC-3 d'origine (plan de `bilan-service` : 484/485,
  185/188 sous DA) est **sortie** en [[STORY-701]]. Les notes 3D, 21, 22, 26, 30 restent vierges et
  tracées (la matière n'est pas publiée) ; 8A, 12, 16C, 31 aussi (lignes libres non alignées, deux sections,
  ou trame sans colonne de libellé).
- **D-690-2 — notes MIXTE** (4, 7, 8, 15A, 16A à 19) : la liasse fait foi sur Année N / N-1 ; la ligne saisie
  n'écrit que les colonnes que la table ne tient pas (échéances, régime, note) ; un N ou N-1 saisi qui
  diverge de ce que la liasse écrit fait **refuser** le livrable, code nommé.
- **D-690-3 — mesure faite après D-690-1** : la liasse ne publie **aucun mouvement** (débit/crédit) ; la
  note 3A est `TRAME`, ses postes n'ont pas de ventilation ; les dotations et reprises (RL, RN, TJ, TL) sont
  tenues à la racine, sans catégorie. Les notes 28 et 3C ne sont donc **pas calculables** depuis la liasse :
  elles se remplissent par la saisie du cabinet rapprochée par libellé (AC-1), sinon vierges et tracées.

## Critères d'acceptation

- [x] AC-1 — Les trames à **libellé imprimé** (`TRAME` : 1, 3A, 3B, 15B, 16B, 16B bis, 27B, 34 ; `MIXTE` : 3C,
      4, 7, 8, 15A, 16A, 17, 18, 19, 28) reçoivent les lignes saisies (`PUT …/complements`) **rapprochées
      par libellé** (casse, accents, espaces et apostrophes neutralisés). Une ligne dont le libellé n'est
      imprimé nulle part, ou saisie deux fois, fait refuser le livrable — code nommé, jamais une ligne perdue.
      Les colonnes que le formulaire calcule ne sont pas écrites.
- [x] AC-2 — Notes de mouvements (28, 3C, 3D) : la liasse n'en publie pas la matière (D-690-3) ; 28 et 3C
      passent par AC-1, 3D (trame sans colonne de libellé) reste vierge et tracée.
- [x] AC-3 — MIXTE (D-690-2) : N / N-1 saisis contrôlés contre la liasse, écart ⇒ refus nommé.
- [x] AC-4 — Paquet `TG` × `DSF` **v1.2** construit par le script (v1.0 et v1.1 archivées, régénérées à
      l'octet), correspondance de complétude 1.2 ; preuve par le formulaire et par Excel, comme STORY-680.

## Notes

- Voir [[STORY-680]], [[STORY-559]], [[STORY-688]], [[STORY-701]].

## Progress Tracking

**Statut : `done` (2026-10-07).** PR `prospera-fiscal-service#16` intégrée en rebase-merge sur `dev` (3 commits : feature, test pointé, revue).

### Livré

- **Trames à libellés imprimés** (AC-1) : une ligne saisie (`PUT …/complements`) rejoint la ligne imprimée
  dont le libellé est le sien (`normaliserLibelle` : casse, accents, apostrophes, espaces, deux-points de fin).
  18 notes : `TRAME` 1, 3A, 3B, 15B, 16B, 16B bis, 27B, 34 ; `MIXTE` 3C, 4, 7, 8, 15A, 16A, 17, 18, 19, 28.
  Refus nommés `TRAME_LIBELLE_INCONNU` / `TRAME_LIBELLE_EN_DOUBLE` (rang de la ligne, jamais son libellé).
  Les cases que le formulaire calcule sur une ligne imprimée (`exclues`) ne sont pas écrites.
- **D-690-2** (AC-3) : sur les `MIXTE` à table, Année N / N-1 saisis confrontés à ce qui part — une ligne
  que la liasse laisse vide part à zéro — écart ⇒ `TRAME_DIVERGE_DE_LA_LIASSE`. Une note non transcrite
  (STORY-688) n'est pas confrontée ; ses échéances restent écrites (D-688-4).
- **AC-2** : 28 et 3C passent par la saisie (D-690-3) ; 3D et 31 (trame sans colonne de libellé), 8A, 12,
  16C, 21, 22, 26, 30 restent vierges et tracées ; lignes au libellé imprimé deux fois (3A ×4, 16A ×2) au cabinet.
- **AC-4** : paquet `TG` × `DSF` **v1.2** actif (v1.0, v1.1 archivées, régénérées à l'octet), correspondance
  de complétude 1.2. 3 555 cases = 453 rattachées + 2 033 de trame (1 002 + 1 031) + 1 069 tracées.
  Excel : classeur avec lignes saisies (1, 3A, 28) ouvert sans réparation, clôture 3A (`I13 = 1 150`),
  sous-total note 1 et `J16` note 28 recalculés, contrôles OTR n°1 / n°2 = VRAI.

### Revues

- **Code** — 0 bloquant de la revue générale ; lentilles ECC : la ligne que la liasse laisse vide n'était pas
  confrontée (corrigé : elle part à zéro), une colonne contrôlée pouvait être écrite par la trame ou n'être
  écrite par aucune table (gardes au schéma et au contrat), trois tests renforcés (N-1, 2e ligne saisie,
  garde exercée seule), détail `TEXTE_NON_INSCRIPTIBLE` sur la ligne saisie. **Écarté** : laisser vierges les
  échéances d'une note non transcrite — contredit D-688-4.

- **Sécurité** — 0 (bornes des lignes saisies à l'entrée, normalisation linéaire, colonne du libellé jamais
  écrite, refus sans libellé ni montant saisi, contrôles N/N-1 non contournables par la saisie).

### Portes (rejouées en session sur l'état final)

Lint 0 · build OK · 110 suites / 1 725 tests · couverture 99,32 / 96,79 / 99,06 / 99,65 · e2e 8 / 123.
Mutations : 13 sur la feature + 9 sur les correctifs de revue, toutes rouges (M12 d'abord VERT — test
« 1 500 » ne filtrait pas ; trois mutants d'abord non compilés, rejoués). Pas de vérif docker : générateur sans
état, aucune persistance touchée.

### Historique

- 2026-10-07 — `done`. fiscal#16 mergée.
- 2026-10-07 — `in_progress`. Cadrage : D-690-1 à D-690-3 ; AC-3 d'origine sortie en STORY-701.
- 2026-10-01 — `ready-for-dev`. Créée par la clôture de STORY-680.
