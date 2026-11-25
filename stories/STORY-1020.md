# STORY-1020 : L'état de rapprochement s'exporte (PDF / Excel) — la pièce que le cabinet verse au dossier de révision

Status: in-progress — fiche et contrat écrits le 2026-11-25 par le groupe C (lot 7, n° 0a), **avant le code**.

**Épic :** AB-05 (rapprochement) · **FR :** FR-A17 (PRD Atelier : « production de l'état de rapprochement bancaire et de la
situation du compte en fin d'exercice ») · **Service :** `prospera-balance-service`
**Débloque :** FE-077 (lot 7 de A, n° 21 : « l'export de l'état de rapprochement », `blocked` faute de route d'export).
**Plan :** `PLAN-LOT-7-2026-11-24.md` §3, amendement du 25/11 ; `PLAN-LOT-6-2026-11-23.md` (amendement D-L6-5 : « une
route d'export sert l'état de rapprochement d'un exercice ; FE-077 débloquée »).

## Histoire

En tant qu'**expert-comptable**, je veux emporter l'état de rapprochement d'un compte hors de l'écran, en PDF ou en
Excel, afin de le verser au dossier de révision et de le présenter le jour où un vérificateur le demande.

## Ce que le code porte déjà (lu sur `origin/dev`, `b78f500`)

- `GET /api/v1/dossiers/{dossierId}/rapprochement/etat` (STORY-090, 172, 370, 409, 410) : l'équation (solde du relevé,
  en-cours crédit et débit, solde comptable théorique, solde comptable, écart **affiché, jamais absorbé**), le motif
  quand l'écart n'est pas calculable, la **balance de référence** (version, source, état, comptes retenus, ventilation),
  les avertissements sur l'obtention du solde comptable.
- `GET …/rapprochement/situation` : ouverture, entrées, sorties, clôture, lignes, lignes encore non rapprochées.
- `GET …/rapprochement/ecarts` : les écarts qualifiés (`EN_ATTENTE`, `JUSTIFIE` + motif, `A_CORRIGER`), recalculés à chaque
  appel (D-090-4 : un écart n'est pas persisté, seule la décision l'est).
- L'export d'une version de balance (STORY-555) : un **modèle** (`DocumentExport`) que trois rendus restituent (PDF,
  XLSX, CSV), une **empreinte** SHA-256 du contenu non daté, la mention **PROVISOIRE** posée par le modèle, un plafond de
  10 exports par minute, un nom de fichier sans donnée du dossier, `@SorteDeRoute('export')` (STORY-914).
- **Aucune route n'exporte l'état de rapprochement.** C'est le manque de FE-077.

FE-077 laissait le choix au PO entre un export côté client (A) et une route serveur (B). Le plan du lot 6 (amendement
D-L6-5, décision de l'utilisateur) a retenu **B** : c'est cette story.

## Critères d'acceptation

1. **Étant donné** un compte de trésorerie et ses relevés sur un exercice **quand** le cabinet demande l'export de son
   état au format `pdf` (ou `xlsx`) **alors** il reçoit une pièce jointe qui porte l'équation complète, la balance de
   référence nommée, les avertissements, la situation du compte et **chaque ligne du relevé encore non rapprochée** avec
   sa qualification et son motif.
2. **Étant donné** un export **quand** on le lit **alors** il porte sa date et son heure de tirage et dit que l'état est
   **recalculé** au tirage, pas conservé ; deux tirages sans changement entre eux ont la **même empreinte**
   (`X-Empreinte-Document`), et une qualification d'écart faite entre deux tirages la change.
3. **Étant donné** une demande sans compte **quand** elle arrive **alors** elle est refusée (`400`) : l'export vise **un**
   compte, jamais un agrégat.
4. **Étant donné** une balance de référence non validée, ou absente **quand** l'état est exporté **alors** la mention
   **PROVISOIRE** figure sur chaque page du PDF et en première ligne du classeur ; aucun paramètre ne la retire (tout
   paramètre non déclaré ⇒ `400`).
5. **Étant donné** un compte d'un autre dossier ou d'un autre cabinet **quand** son export est demandé **alors** la
   réponse est celle de l'état pour un compte inconnu (`404 COMPTE_TRESORERIE_INTROUVABLE`) ou de la portée du dossier.
6. **Étant donné** le classeur **quand** on l'ouvre **alors** les montants sont des nombres (en unités monétaires) et aucun
   libellé ni motif saisi ne redevient une formule (`=…`).
7. **Étant donné** un module `balance` suspendu ou désinstallé **quand** l'export est demandé **alors** il est servi (sorte
   `export`, FR-43) : les données restent au client.

## Contrat annoncé avant le code (2026-11-25)

**Ajouts seuls.** Aucune route, aucun champ, aucun fait existant ne change.

- **`GET /api/v1/dossiers/{dossierId}/rapprochement/etat/export`** — mêmes paramètres que `…/etat` (`compteId`,
  `exerciceDebut`, `exerciceFin`, `au` facultatif) **et** `format` (`pdf` | `xlsx`), rien d'autre (liste blanche du
  `ValidationPipe` : tout autre paramètre ⇒ `400`). Mêmes gardes que `…/etat` (`@Roles(TENANT_ADMIN, TENANT_USER)`,
  `@RequiresBalanceAccess`, portée du dossier) ; `@SorteDeRoute('export')` ; `@Throttle` 10 par minute (celui de l'export
  de balance).
- **`200`** : le document en pièce jointe (`Content-Disposition: attachment; filename="etat-rapprochement-<arrêté
  AAAA-MM-JJ>[-provisoire].<pdf|xlsx>"`, aucun nom ni identifiant du dossier ou du compte), `Cache-Control: no-store`,
  en-tête **`X-Empreinte-Document`** (SHA-256 hex du contenu non daté). Refus : ceux de `…/etat` (`400`
  `EXERCICE_INDETERMINE` ou borne invalide, `404 COMPTE_TRESORERIE_INTROUVABLE`, `403` de la garde), plus `400` pour un
  `format` absent ou inconnu, `429` au-delà de 10 par minute.
- **Contenu** (le même pour les deux formats ; l'empreinte vaut pour les deux) :
  - en-tête : dénomination (celle du dossier gardé), compte de trésorerie (libellé, canal, numéro), compte comptable
    effectif, devise, exercice, date d'arrêté, nature du document (« recalculé au tirage, non conservé »), balance de
    référence (version, identifiant, état, source, comptes retenus), empreinte, date de tirage ;
  - **PROVISOIRE** en bandeau tant que la balance de référence n'est pas `VALIDÉE` (ou qu'il n'y en a pas) ;
  - l'**équation** ; les **avertissements** ; la **situation** du compte ; les **lignes du relevé non rapprochées** au jour
    d'arrêté (date, libellé, nature, qualification, crédit, débit, total = les en-cours de l'équation) ; les
    **justifications** (motif de chaque ligne justifiée, en entier).
- **Manifeste `balance` 1.2.0** : la route entre dans `routesLectureSeule` (une pièce de révision reste exportable). La
  copie au catalogue est demandée à B.
- **→ A (FE-077)** : l'écran appelle cette route ; les types se génèrent depuis l'OpenAPI du service vivant.

## Décisions (contestables)

- **D-1020-1** : une seule route, sous `…/etat`, aux paramètres de `…/etat` : l'export est **cet** état, rien d'autre. Deux
  formats, `pdf` et `xlsx` (le titre de la story) ; pas de CSV : le classeur sert déjà le retraitement.
- **D-1020-2** : l'état reste **recalculé**, jamais persisté (D-090-4, hors périmètre de FE-077). L'empreinte du contenu non
  daté dit ce qu'aucune date ne dit : deux exemplaires de même empreinte disent la même chose, deux empreintes différentes
  prouvent que l'état a changé entre deux tirages. Re-produire à l'identique un état passé serait une autre story.
- **D-1020-3** : **PROVISOIRE** par fermeture, comme l'export de balance (STORY-555) : tout ce qui n'est pas une balance
  de référence `VALIDÉE` (brouillon, rejetée, absente) l'est.
- **D-1020-4** : les écarts listés sont les **lignes du relevé de ce compte** non rapprochées au jour d'arrêté — celles
  qui forment les en-cours —, **toutes qualifications** (une ligne justifiée reste un mouvement absent de la comptabilité :
  elle compte toujours dans les en-cours). Les écarts côté **cahiers** portent sur tout le dossier (une recette sans
  encaissement n'est imputable à aucune banque) : ils n'y figurent pas, et le document le dit.
- **D-1020-5** : la liste est plafonnée à **3 000** lignes (la taille mesurée de l'export de balance) ; au-delà, le
  document le dit et ses totaux portent sur **toutes** les lignes.
- **D-1020-6** : un avertissement ou un motif long est **découpé en lignes par le modèle** : le rendu PDF garde sa
  hauteur de ligne constante (STORY-555), et rien de la justification n'est abrégé.
- **D-1020-7** : le classeur nomme sa feuille d'après le document (un champ facultatif du modèle ; l'export de balance,
  qui ne le pose pas, garde sa feuille « Balance » et son empreinte).
- **D-1020-8** : la recopie à l'octet des trois paquets SYSCOHADA révisé et du SMT (demande de D, ticket de 1076 → 1118)
  entre dans la même PR, en commit séparé : c'est une demande adressée à C, qui passe avant la story.

## Hors périmètre

- Un export multi-comptes (FE-077 : un état se signe banque par banque).
- La persistance d'un état daté (D-1020-2).
- L'écran : FE-077 (A).
