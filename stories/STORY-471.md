# STORY-471 : Le prévisionnel est le seul objet du module sans piste d'audit — ni auteur, ni motif, ni événement de journal

Status: ready-for-dev

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
