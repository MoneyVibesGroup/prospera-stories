# STORY-558 : ⛔ SUPERSEDED — doublon de STORY-537, dont elle réinventait le périmètre

Status: superseded

**Superseded par :** **STORY-537** *(« Le fichier e-DSF Togo — le premier pays »)*, elle-même
adossée à **STORY-536** *(« Le paquet de dépôt — format, canal, calendrier et gabarit, packagés par
pays et par état »)*.
**Créée puis retirée le 2026-08-28.** Points 13 → **0**.

---

## Pourquoi elle a existé, et pourquoi elle ne doit pas

Elle a été écrite le 2026-08-28 pour porter le gabarit du classeur de dépôt togolais comme donnée
de paquet pays. **C'était déjà fait, deux fois, le même jour** :

- **STORY-536** livre le **contrat et le registre** — `pays`, `etat`, `format`, `gabarit`
  (correspondance poste → case, **sourcée case par case**), `canal`, `calendrier`, `penalites`,
  `version`, `checksum`. Son **AC-6** est explicite : *« Aucun générateur dans cette story. Elle
  livre le contrat et le registre ; **STORY-537 livre le premier pays**. »*
- **STORY-537** livre **l'instance togolaise**.

⇒ STORY-558 réinventait le mécanisme de 536 et le périmètre de 537.

⚠️ **La cause de l'erreur, pour ne pas la refaire.** STORY-536/537 vivaient sur une branche locale
non poussée au moment de la rédaction. La règle de réservation d'identifiants a bien vu que les
ids `487→549` étaient **pris** — elle ne dit rien de **ce qu'ils contiennent**. ⇒ **Réserver un id
n'est pas instruire un périmètre : avant d'ouvrir une fiche sur un sujet, lire les fiches voisines,
pas seulement compter leurs numéros.**

## ⚡ Ce qui est repris dans STORY-537, et qui garde de la valeur

Les mesures faites sur la pièce réelle `1000745307_2025_Definitif (1).xlsx` — DSF **définitive**,
dossier PMS, NIF 1000745307, exercice 2025 — ont été **versées à STORY-537** :

- le classeur porte **92 feuilles**, dont **44 de notes** ;
- `syscohada-revise@2.1` n'en déclare que **11** ⇒ **STORY-559** est le préalable ;
- les deux dernières feuilles sont un **juge** : huit contrôles intermontants, et sur cette pièce
  le premier est **`FAUX`** *(Total Actif 3 060 000 / Total Passif 0)* ;
- `bilan-service` produit **quatre** contrôles : **l'écart se publie, il ne se comble pas**.

⚡⚡ **Et surtout : cette pièce lève le blocage de STORY-537.** Elle était `blocked` avec un seul
motif — *« le gabarit officiel e-DSF de l'OTR n'est pas au dépôt. C'est le seul blocage, et il
n'est pas technique. »* **Le gabarit est arrivé.**

## Renvois

Les fiches qui pointaient ici — **STORY-555**, **STORY-556**, **STORY-559**, **STORY-561**,
**STORY-565** — pointent désormais **STORY-537**.
