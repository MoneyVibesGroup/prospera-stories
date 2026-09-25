# STORY-680 : Les 43 feuilles de notes du fichier e-DSF Togo — 4 291 cases à rattacher, ligne par ligne, aux comptes

Status: ready-for-dev

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

- [ ] AC-1 — Le paquet `TG` × `DSF` passe en **v1.1** : chaque case de saisie d'une note ventilable est
      rattachée aux comptes qu'elle totalise, **sourcée** (feuille, ligne, libellé ; plan SYSCOHADA
      révisé). Une ligne dont le rattachement n'est pas sourçable reste **vierge et tracée**.
- [ ] AC-2 — Les notes `TRAME`/`MIXTE` : les lignes saisies (`PUT …/complements`) s'écrivent dans les
      lignes libres de la feuille, dans l'ordre, colonnes alignées ; au-delà de la capacité de la feuille,
      **refus nommé** (jamais une troncature silencieuse).
- [ ] AC-3 — Aucun montant perdu : la garde `LIASSE_NON_TRANSCRIPTIBLE` de 537 s'étend aux comptes des
      notes (un compte ventilé sans ligne ⇒ refus nommé).
- [ ] AC-4 — Preuve par le formulaire : les totaux des notes que le classeur recalcule rejoignent les
      postes du Bilan/CR qu'elles justifient (évaluateur de 537 + ouverture dans Excel).
- [ ] AC-5 — `v1.0` reste au manifeste (archivée) ; un dépôt produit porte la version qui l'a produit.

## Notes

- Voir [[STORY-537]], [[STORY-559]], [[STORY-676]], [[STORY-536]].

## Progress Tracking

**Statut : `ready-for-dev` (2026-09-25).** Créée par la clôture de STORY-537.
