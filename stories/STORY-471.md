# STORY-471 : Le prévisionnel est le seul objet du module sans piste d'audit — ni auteur, ni motif, ni événement de journal

Status: in_progress

**Épic :** EPIC-013 — Prévisionnel (annuel 3 ans + mensuel 12 mois)
**Service :** `bilan-service`
**Points :** 3 · **Sprint :** S20 (décision PO du 2026-08-09 : tout ce qui touche balance/bilan y est ancré)
**Origine :** maquette **FE-035** (hypothèses de prévisionnel paramétrables), 2026-08-27.
Relevé par la passe expert-comptable sur l'écran FE-035 fini, en cherchant quoi afficher dans la colonne « qui » de l'historique des versions.

---

## Le fait

Trois constats, tous vérifiables en une lecture :

1. **`AuditType` ne connaît pas les hypothèses.** L'énumération compte huit actes — `JEU_CREE`,
   `JEU_RECALCULE`, `JEU_VALIDE`, `JEU_ROUVERT`, `EXERCICE_CREE`, `EXERCICE_CLOS`,
   `EXERCICE_ROUVERT`, `EXPORT_EFFECTUE` — et **aucun** ne concerne le prévisionnel.
2. **`JeuHypothesesController` n'injecte pas `AuditService`**, contrairement à `JeuEtatsController`,
   `ExerciceController` et `ExportService`.
3. **`versions_hypotheses` ne stocke ni `userId` ni motif** : `tenantId`, `dossierId`,
   `jeuHypothesesId`, `version`, `hypotheses`, `base`, `createdAt`. C'est **moins** que le journal de
   la liasse, qui porte au moins un identifiant d'utilisateur (et dont l'absence de **nom** est déjà
   l'objet de STORY-441).

L'historique des versions dit donc **ce qui** a changé, jamais **qui** ni **pourquoi**. Six mois plus
tard, personne ne peut expliquer pourquoi la croissance est passée de 8 à 5 % — alors que c'est
exactement la question qu'un associé, un banquier ou un contrôleur posera.

Le versionnement append-only a été construit (D1 du cadrage du 2026-07-23) pour rendre les projections
**rejouables**. Il l'est. Mais il n'est pas **explicable**, et une projection qu'on ne peut pas
justifier ne vaut pas beaucoup mieux qu'une projection qu'on ne peut pas rejouer.

## Critères d'acceptation

- [ ] AC-1 — `AuditType` gagne `HYPOTHESES_CREEES`, `HYPOTHESES_MODIFIEES` et — si elles sont livrées —
      `HYPOTHESES_SUPPRIMEES`, `HYPOTHESES_REBASEES`.
- [ ] AC-2 — `JeuHypothesesController` journalise sur le patron **exact** de `JeuEtatsController`
      (`journaliser` est sûr par conception : il ne throw jamais, un échec de journal ne casse pas
      l'acte).
- [ ] AC-3 — `versions_hypotheses` stocke `creePar: userId`, écrit par le **service** au moment de
      l'insertion — jamais transmis par l'appelant.
- [ ] AC-4 — Un `motif` **optionnel** accompagne l'édition (`EditerHypothesesDto.motif`, borné), stocké
      sur la version sortante. Optionnel : l'imposer ferait saisir « maj » à tout le monde.
- [ ] AC-5 — `GET …/:id/versions` publie auteur et motif ; l'anti-énumération reste inchangée.

## Conséquences ailleurs

- Même famille que **STORY-441** (le journal de la liasse ne sert ni nom ni rôle) et **STORY-456** (le
  déficit reportable persiste sa piste d'audit sans la publier). Trois occurrences : c'est un patron de
  module, à trancher une fois.
- L'écran FE-035 affiche aujourd'hui « Auteur non tracé » en pointillé, faute de mieux.


---

## Progress Tracking

**Statut : in_progress** — ouvert le 2026-09-07, branche `MNV-471`.

### Ce que la lecture du code a démenti ou précisé, AVANT d'écrire

⚡ **La fiche est PARTIELLEMENT PÉRIMÉE.** Elle a été rédigée le 2026-08-27 ; **STORY-464 a
été clôturée le 2026-09-06**, et elle a livré une partie du constat n° 1 :

| Constat de la fiche | État réel au 2026-09-07 |
|---|---|
| « `AuditType` compte huit actes, aucun sur le prévisionnel » | **Faux** : `HYPOTHESES_SUPPRIMEES` existe depuis STORY-464, et elle est journalisée **dans la transaction** de suppression. L'énumération compte aussi `JEU_COMPLEMENTS_SAISIS`, `LIASSE_DEPOSEE`, `JEU_SUPPRIME` et les trois `MAPPING_SURCHARGE_*`. |
| « `JeuHypothesesController` n'injecte pas `AuditService` » | **Vrai du contrôleur**, mais le **service**, lui, l'injecte déjà (garde `aEteExporte` + journal de suppression). |
| « `versions_hypotheses` ne stocke ni `userId` ni motif » | **Vrai**, inchangé. |

Restent donc à livrer : `HYPOTHESES_CREEES`, `HYPOTHESES_MODIFIEES`, `HYPOTHESES_REBASEES`.

### Décisions de conception

- **D-471-1 — L'auteur d'une version est REPORTÉ, jamais celui de l'acte qui l'archive.**
  La version historisée porte les paramètres de l'état **précédent** ; elle est insérée par
  l'édition **suivante**. Écrire l'auteur de l'acte d'archivage y ferait dire « Awa a saisi
  ces paramètres » alors qu'Awa vient de les **remplacer** — un journal plausible et faux,
  exactement ce que la story existe pour fermer. Le `JeuHypotheses` **courant** porte donc
  `creePar` (et `motif`) de sa version courante, et `versionner()` les **reporte** dans la
  version sortante, comme il reporte déjà la `base` sortante.
- **D-471-2 — Le `motif` accompagne les paramètres qu'il justifie**, donc le jeu en `V+1`,
  puis migre dans l'historique quand cette version est à son tour archivée. La fiche écrit
  « stocké sur la version sortante » ; pris à la lettre sur le vocabulaire du code
  (`versionSortante = doc.version`), le motif « passage de 8 à 5 % » se serait attaché à la
  version qui portait **8 %**, décalé d'un cran.
- **D-471-3 — La DUPLICATION est journalisée en `HYPOTHESES_CREEES`**, avec
  `contexte.duplicateDe`. STORY-466 (livrée le 2026-09-07, après la rédaction de la fiche)
  a ouvert un **second** chemin de création : ne journaliser que `POST` ferait apparaître
  des jeux dont le journal ne porte aucun acte de naissance. Aucun type neuf n'est inventé
  hors des quatre que l'AC-1 nomme.
- **D-471-4 — Le RENOMMAGE n'est pas journalisé.** Aucun des quatre types de l'AC-1 ne le
  couvre, il ne crée pas de version et ne change aucun chiffre. Hors périmètre, à dessein.
- **D-471-5 — Rebaser sur une base déjà à jour (le no-op de STORY-465, AC-4) ne
  journalise RIEN.** Une ligne « rebasé » sur un acte qui n'a rien écrit est du bruit dans
  le journal même qu'on construit pour expliquer les changements. `rebaser()` rend donc
  `{ jeu, versionCreee }` : le contrôleur ne peut pas déduire le fait autrement, et un
  drapeau **optionnel** ajouté au type de retour commun aurait été `undefined` sur les cinq
  autres chemins.
