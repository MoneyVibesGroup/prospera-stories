# STORY-317 : Les reports d'échéance accordés par l'administration — la date reportée s'affiche, la date légale reste

Status: ready-for-dev — écrite le 2026-11-26 par la session du groupe C juste avant de la coder (lot 7, n° 2 du fiscal,
`PLAN-LOT-7-2026-11-24.md` §3) ; contrat annoncé avant le code (« ⚠ Contrats » et « ⚠ Communs » du journal de C).

**Epic :** EPIC-030 · **Points :** 3 · **FR :** FR-F20
**Service :** `prospera-fiscal-service` (dossier `obligations`, à C) ; `balance-service` pour la demande de D servie ici
(le paquet fiscal, D-L7-3). **Après :** STORY-315 (le calendrier du portefeuille), STORY-316 (les échéances lues au
paquet). **Suite :** STORY-318 (les alertes et les états de retard), STORY-319 (le responsable et la charge) ; **349 de
D attend 319**.

## Histoire

En tant qu'**expert-comptable**, je veux enregistrer un report accordé par l'administration, afin que mon calendrier
reflète la réalité sans perdre la date légale d'origine.

## Critères d'acceptation (`epics-fiscalite-2026-08-03.md`, EPIC-030)

1. **Étant donné** un report saisi et daté **quand** il s'applique à une obligation **alors** l'échéance affichée
   devient la date reportée **et** l'échéance légale d'origine reste enregistrée et consultable.
2. **Étant donné** une obligation dont l'échéance a été reportée **quand** le retard est qualifié **alors** il se calcule
   sur la date reportée.
3. **Étant donné** un report **quand** il est enregistré **alors** son auteur, sa date et sa portée sont journalisés.

## Ce que le code porte déjà (lu sur `origin/dev`, fiscal `d41dbe6`)

- Une obligation a **une** échéance, `echeance` (champ DÉRIVÉ, récrit à chaque dérivation depuis le paquet, STORY-305,
  316). Le calendrier du portefeuille (315) la trie et la pagine sur l'index `{ orgId, annee, echeance, _id }`.
- Rien ne qualifie encore le retard d'une obligation : les états « pas encore préparée », « en retard de préparation »,
  « échéance dépassée » sont à STORY-318. Le calendrier de **dépôt** (539, `GET /echeances`) compte ses jours restants
  sur ses propres lignes (dossier × état × période), qui ne sont pas des obligations (D-315-4).

## Contrat annoncé avant le code (2026-11-26)

**Ajouts seuls**, sauf ce que l'AC-1 demande : sur une obligation reportée, `echeance` (le champ que tout le monde
affiche) rend la date reportée.

### Le modèle (que 318 et 319 prolongent sans le refaire)

- Une obligation porte deux dates : **`echeanceLegale`** (DÉRIVÉE : celle du paquet, récrite à chaque dérivation) et
  **`echeance`**, l'**échéance applicable** : la date reportée s'il y a un report, sinon la légale. Le calendrier, ses
  tris, ses filtres et son curseur lisent l'applicable, sans index neuf.
- Le report est un champ **HUMAIN**, `report`, posé par sa seule route, **jamais** touché par une dérivation (AD-17) :
  `{ reportId, date, echeanceLegale, decision: { reference, du }, motif, par, le }` (`echeanceLegale` : la légale au
  moment du report). Une re-dérivation récrit la légale et garde le report ; l'applicable devient
  **`echeanceApplicable(legale, report)`** : la date reportée, ou la légale si elle est devenue plus tardive (un report
  n'avance jamais une échéance) ; une légale devenue `null` laisse la date reportée.
- **La qualification du retard** est une fonction pure du domaine, `qualifierRetard(obligation, aLa)` →
  `{ echeance, echeanceLegale, reportee, joursDeRetard }`, calculée sur l'**applicable** (AC-2). 318 y ajoute ses
  trois états et son horizon ; aucune route ne la rend encore (elle n'aurait de sens qu'avec l'état de préparation que
  318 apporte).

### Les routes

- **`POST /api/v1/obligations/reports`** — enregistrer UNE décision de l'administration, sur une ou plusieurs
  obligations **d'un même dossier** (droit `fiscalite:declaration:valider`, rôles du cabinet). Corps :
  `{ obligationIds: string[] (1 à 50, distincts), date: 'AAAA-MM-JJ', decision: { reference: string (3 à 200), du:
  'AAAA-MM-JJ' }, motif: string (3 à 500) }`. Tout ou rien, dans une transaction.
  → `200 { reportId, date, decision, obligations: ObligationResponseDto[] }`.
  Refus : `400` (corps mal formé ; `REPORT_PORTEE_INVALIDE` : doublon, ou obligations de plusieurs dossiers ; `DATE_INVALIDE`) ;
  `404 OBLIGATION_INTROUVABLE` (une seule absente, d'une autre organisation ou hors de la portée de l'appelant : même
  réponse) ; `409 OBLIGATION_DESACTIVEE`, `OBLIGATION_CLOTUREE`, `REPORT_CONCURRENT` (une obligation a changé entre la
  lecture et l'écriture) ; `422 ECHEANCE_LEGALE_ABSENTE` (une obligation non datée ne se reporte pas : sa date manque au
  paquet), `REPORT_NON_POSTERIEUR` (la date reportée doit suivre la légale), `DECISION_POSTERIEURE` (une décision datée
  après aujourd'hui n'est pas encore accordée).
- **`POST /api/v1/obligations/{id}/report/annulation`** — un report saisi par erreur se retire, motivé (même droit).
  Corps `{ motif }` → `200 ObligationResponseDto`, l'échéance revient à la légale. `404 OBLIGATION_INTROUVABLE` ;
  `409 AUCUN_REPORT`.
- Un nouveau report sur une obligation déjà reportée **remplace** le précédent (son `reportId` est journalisé).

### Ce que les réponses gagnent

- `ObligationResponseDto` : **`echeanceLegale`** (`string | null`) et **`report`** (`ReportDto | null`) ; `echeance` se
  décrit « l'échéance applicable ».
- `LigneCalendrierDto` (`GET /obligations/calendrier`) : **`echeanceLegale`** et **`reportee`** (booléen).

### Le journal (AC-3)

- Chaque obligation reportée reçoit l'acte **`OBLIGATION_ECHEANCE_REPORTEE`** dans sa chaîne (`obligation:<id>`) :
  `acteur` = l'auteur (jeton), `survenuLe` = la date de la décision, `enregistreLe` = l'instant serveur ; `contenu` :
  `reportId`, `date`, `echeanceLegale`, `echeanceAvant` (l'applicable d'avant), `reportPrecedent`, **`portee`**
  `{ dossierId, obligations: [ids] }`, et les **empreintes** de la référence et du motif (le texte reste en clair sur
  l'obligation ; le journal est ineffaçable, AD-10).
- L'annulation : **`OBLIGATION_REPORT_ANNULE`** (`reportId`, `echeanceRetablie`, empreinte du motif).

### Persistance

- **Aucune migration** : deux champs facultatifs sur `obligations`. Une obligation écrite avant cette story n'a pas
  `echeanceLegale` : elle se lit égale à `echeance` (aucun report n'a pu exister avant). Aucun index neuf.

## La demande de D servie ici (STORY-348)

- Au paquet fiscal Togo 2026 (source de `balance-service`), **`cnss.collecte`**
  `{ jourLimite: 15, moisSuivant: true, organisme: "CNSS Togo", source, aValider }` : la date de collecte des
  cotisations, que le calcul de 348 lit déjà (absent ⇒ `NON_DECLAREE`). Rien n'est renommé (`cnss.amu.collecte`,
  `cnss.affiliation.<TYPE>`, `irpp.traitementsSalaires` restent). Réépinglage, copies à l'octet dans balance et fiscal ;
  celle de `dossier-service` est à B (ajoutée à la demande ouverte).

## Décisions prises au contrat (contestables)

- **D-317-1** : `echeance` devient l'échéance **applicable** et la légale passe dans `echeanceLegale` (plutôt qu'un
  troisième champ « affiché ») : l'AC-1 le demande, le calendrier trie et pagine déjà sur `echeance`, et tout lecteur
  existant (écrans, 318) lit la bonne date sans changer.
- **D-317-2** : un report vaut pour **une décision** et une **portée** explicite : la liste des obligations, d'un seul
  dossier. Un report général de l'administration (un communiqué qui repousse une date pour tous) est une donnée de
  réglementation : il relève du paquet, pas d'une saisie par dossier — nommé pour plus tard.
- **D-317-3** : le droit est `valider` (l'expert-comptable de l'histoire, comme écarter une obligation, 306) ; aucun
  droit neuf.
- **D-317-4** : une obligation non datée (légale `null`) ne se reporte pas (`ECHEANCE_LEGALE_ABSENTE`) : la date manque au
  paquet et doit y être corrigée, pas masquée par un report.
- **D-317-5** : la date reportée doit être **postérieure** à la légale ; une re-dérivation qui rend la légale plus tardive
  que le report l'emporte (un report n'avance jamais une échéance).
- **D-317-6** : la référence de la décision et le motif sont des textes libres : en clair sur l'obligation, par leur
  empreinte au journal (patron de 306 et 328). La pièce (la lettre de l'administration) n'est pas liée ici : la liaison
  d'une pièce est l'affaire de 338.
- **D-317-7** : le calendrier de **dépôt** (539, `GET /echeances`) ne lit pas les obligations et garde ses dates : un report
  ne le change pas (D-315-4). À reprendre le jour où les deux calendriers se rapprochent (333, à D).
- **D-317-8** : une obligation `CLOTUREE` ne se reporte plus ; une obligation écartée non plus.
