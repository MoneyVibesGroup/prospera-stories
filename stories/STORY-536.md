# STORY-536 : Le paquet de dépôt — format, canal, calendrier et gabarit, packagés par pays et par état

Status: ready-for-dev

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` (registre) + consommateurs `bilan-service` / `microfinance-service` / `assurance-service`
**Points :** 13 · **Sprint :** S20
**Origine :** arbitrage PO du 2026-08-28 — **voie A**, [[STORY-525]].

---

## Le fait

La voie A engage le produit à **produire des fichiers déposables**. Le premier réflexe serait
d'écrire un générateur e-DSF togolais et de le dupliquer par pays. **C'est la faute qu'il faut
éviter avant la première ligne** : un format de dépôt est **du droit administratif**, il change sans
prévenir, et neuf générateurs codés en dur, c'est neuf régressions par an que personne ne voit
venir.

⚡ **Le produit sait déjà faire l'inverse, et il le fait bien** : le référentiel comptable, le paquet
fiscal et le paquet prudentiel sont des **artefacts packagés, versionnés, vérifiés par checksum**,
et « ajouter un référentiel ne demande pas une ligne de code d'écran ». **Le dépôt doit hériter de ce
patron, pas en inventer un second.**

## Ce que le paquet de dépôt déclare

| Champ | Contenu |
|---|---|
| `pays` · `etat` | ISO 3166-1 alpha-2 · l'état concerné (DSF, DIMF 2000, C-xx CIMA…) |
| `format` | structure attendue (XML, CSV positionné, tableur, PDF/A) + son schéma |
| `gabarit` | la correspondance **poste de liasse → case du formulaire**, sourcée |
| `canal` | téléservice, dépôt physique, courriel — et son adresse |
| `calendrier` | date d'échéance, règle de calcul (`clôture + N mois`), jours ouvrés |
| `penalites` | ce que coûte le retard — au Togo, **40 %** |
| `version` · `checksum` · `statut` | comme tout artefact du programme |

## Critères d'acceptation

- [ ] AC-1 — Le paquet est un **artefact packagé**, chargé et **vérifié par checksum**, comme les
      référentiels et les paquets fiscaux. Aucun format de dépôt codé dans un service.
- [ ] AC-2 — ⛔ **La correspondance poste → case est SOURCÉE**, case par case, avec sa référence.
      Une case sans source **fait échouer le build** — même garde que STORY-493 AC-2. C'est ici que
      « vraisemblable » ferait le plus de dégâts : une case décalée passe tous les contrôles internes
      et est rejetée au guichet.
- [ ] AC-3 — Un dépôt produit **porte la version de format qui l'a produit**. Un format révisé ne
      réécrit jamais un dépôt passé — même règle que les snapshots de liasse.
- [ ] AC-4 — ⚠️ **Aucun pays n'est déclaré `servi` pour le dépôt sans son paquet packagé.** Le
      registre des pays (STORY-492) gagne un statut de dépôt, distinct du statut comptable et
      fiscal : un pays peut être `servi` pour la liasse et `non-servi` pour le dépôt.
- [ ] AC-5 — Une route publie le paquet de dépôt actif d'un couple (pays, état), avec sa version et
      son checksum. C'est ce que l'écran affiche à côté du bouton de dépôt.
- [ ] AC-6 — ⛔ **Aucun générateur dans cette story.** Elle livre le contrat et le registre ;
      STORY-537 livre le premier pays. Les mêler ferait naître le générateur togolais comme
      référence implicite du contrat, et tous les autres comme des cas particuliers.

## Notes

- Voir [[STORY-525]] (la doctrine), [[STORY-537]], [[STORY-538]], [[STORY-539]], [[STORY-492]].
