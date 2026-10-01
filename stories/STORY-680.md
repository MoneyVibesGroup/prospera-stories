# STORY-680 : Les 43 feuilles de notes du fichier e-DSF Togo — 4 291 cases à rattacher, ligne par ligne, aux comptes

Status: done

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` (paquet `TG` × `DSF`, v1.1) — `bilan-service` lu (notes annexes de la liasse figée)
**Points :** 13 · **Sprint :** S20 · **Complexité :** high · **Assigné à :** `vivianMoneyVibesGroupes`
**Origine :** cadrage de STORY-537 (2026-09-25) — les notes y ont été mises **hors périmètre**, mesure à l'appui.

---

## Le fait, mesuré

STORY-537 remplit le classeur e-DSF de l'OTR pour l'**identification** et les **quatre états**
(223 cases, sourcées, prouvées par Excel : contrôles OTR n°1 et n°2 « VRAI »). Les **43 feuilles de
notes** sortent **vierges** : le cabinet les complète dans Excel.

| Mesure (gabarit anonymisé) | Conséquence |
|---|---|
| **4 291 cellules de saisie** dans les feuilles de notes | un travail de transcription, pas de code |
| Les lignes sont **par nature** (« Marchandises », « Matières premières et fournitures liées », « Banques locales »…), pas par poste de liasse | chaque ligne se rattache à des **comptes** (préfixes du plan SYSCOHADA révisé), note par note, **sourcée** |
| La liasse porte déjà la ventilation par compte des notes `VENTILATION`/`MIXTE` (STORY-559) et les lignes saisies des trames | la matière existe : c'est le **gabarit** qui manque |

## Critères d'acceptation

- [x] AC-1 — Le paquet `TG` × `DSF` passe en **v1.1** : chaque case de saisie d'une note ventilable est
      rattachée aux comptes qu'elle totalise, **sourcée** (feuille, ligne, libellé ; plan SYSCOHADA
      révisé). Une ligne dont le rattachement n'est pas sourçable reste **vierge et tracée**.
- [x] AC-2 — Les notes `TRAME`/`MIXTE` : les lignes saisies (`PUT …/complements`) s'écrivent dans les
      lignes libres de la feuille, dans l'ordre, colonnes alignées ; au-delà de la capacité de la feuille,
      **refus nommé** (jamais une troncature silencieuse).
- [x] AC-3 — Aucun montant perdu : la garde `LIASSE_NON_TRANSCRIPTIBLE` de 537 s'étend aux comptes des
      notes (un compte ventilé sans ligne ⇒ refus nommé).
- [x] AC-4 — Preuve par le formulaire : les totaux des notes que le classeur recalcule rejoignent les
      postes du Bilan/CR qu'elles justifient (évaluateur de 537 + ouverture dans Excel).
- [x] AC-5 — `v1.0` reste au manifeste (archivée) ; un dépôt produit porte la version qui l'a produit.

## Notes

- Voir [[STORY-537]], [[STORY-559]], [[STORY-676]], [[STORY-536]].

## Progress Tracking

**Statut : `done` (2026-10-01).** PR `prospera-fiscal-service#11` intégrée en rebase-merge sur `dev` (3 commits : domaine, paquet, revue).

### Livré

- Paquet `TG` × `DSF` **v1.1** généré par script reproductible (`scripts/gabarits/releve-notes-tg-dsf.ts` + `construire-paquet-tg-dsf.ts`) ; v1.0 au manifeste `actif: false`, régénérée à l'octet (AC-5).
- **3 555 cases de saisie** mesurées sur les 42 feuilles de notes (définition du produit, `estCaseDeSaisie` — la mesure « 4 291 » de 537 comptait autrement) : **453 rattachées aux comptes** (préfixe le plus long, sourcées : feuille, ligne, libellé, comptes), **1 002 de trame**, **2 100 vierges tracées** avec motif (`NON_SOURCE`, jamais touchées par l'adaptateur : une saisie du cabinet est conservée). 19 feuilles reçoivent des montants ; règle « une feuille entière ou rien ».
- AC-2 : lignes libres alignées (notes 3E, 13, 32, 33), refus `TRAME_HORS_CAPACITE` / `TRAME_DESALIGNEE`. AC-3 : garde `LIASSE_NON_TRANSCRIPTIBLE` étendue, jugée **colonne par colonne**.
- AC-4 : 51 confrontations par l'évaluateur ; **Excel** : ouverture sans réparation, contrôles OTR n°1/n°2 = VRAI, totaux des notes = postes (ex. NOTE 6 I22 = BILAN ACTIF I29).
- Complétude (STORY-556) : correspondance `tg-dsf-1.1.json`, onze notes ventilées passent « produites ».

### Revues

- **Code** — 1 bloquant corrigé : `'NOTE 6'!I10` est une formule du formulaire (`+'BILAN ACTIF'!I29`, le net N-1 du poste entier) ; écrire I11:I17/I20 doublait les stocks N-1, et la garde par famille (brutN ≈ brutN1) le masquait. Colonne rendue au formulaire, garde de build « table asymétrique », balayage des 42 feuilles (aucun total additif ne lit une case écrite ET une formule reprise d'une autre feuille), garde AC-3 par colonne, fixture enrichie (32x + dépréciation N-1). 2 non-bloquants corrigés : le point n'est plus séparateur décimal (« 1.500 » s'inscrivait 1,5) ; constante `MODES_NOTE` dupliquée retirée. 1 constat laissé (conforme à AC-3) → STORY-688.
- **Sécurité** — 0 (échappement `inlineStr`, injection de formule fermée, trames bornées, aucune donnée client au dépôt — NIF absent, schéma base64 décodé compris).

### Portes (rejouées en session sur l'état final)

Lint 0 · build OK · 102 suites / 1 475 tests · couverture 99,21 / 96,25 / 98,96 / 99,58 · e2e 8 / 106. Mutations : 15 sur la feature + 5 sur les correctifs, toutes rouges. Pas de vérif docker : aucune persistance touchée (générateur stateless).

### Suites

- STORY-688 — un compte à solde inversé (411 créditeur sous BI, 47 qui change de sens) refuse le livrable **entier**.
- STORY-689 — la transmission enregistre le paquet **actif**, pas la version inscrite dans le fichier.
- STORY-690 — les 23 feuilles de notes encore laissées au cabinet + trames sur lignes à libellé imprimé ; arbitrages de plan (484/485, 185/188 sous DA).

### Historique

- 2026-10-01 — `in_progress`. Branche `MNV-680` ouverte (fiscal-service + docs).
- 2026-09-25 — `ready-for-dev`. Créée par la clôture de STORY-537.
