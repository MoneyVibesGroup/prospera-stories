# STORY-1110 : La trésorerie mensuelle de la première année du projet

Status: ready-for-dev — **créée le 2026-11-21** à la demande de l'utilisateur, après validation de la maquette de FE-140
(PR #741). Non slottée : à placer au prochain plan.

**Service :** `prospera-bilan-service`, module `financement` et moteur du prévisionnel (`src/modules/bilan/projection/`) · **Points :** 5
**Dépend de :** STORY-1104 (la date d'acquisition), STORY-1084 (les échéanciers et le scénario retenu, livrées).
**Débloque :** STORY-1085 (pièce « Plan de trésorerie mensuel »), STORY-1086 (annexe du dossier), STORY-1109 (section 6), FE-157.
**Écran :** FE-157 (étape 4 « Les chiffres », bloc « Trésorerie mois par mois »).
**Suite :** STORY-1111.

---

## Pourquoi

Le prévisionnel de Prospera est **annuel**. Une banque qui prête à une **jeune société** veut voir, pour la **première année**, mois
par mois, si l'argent suffit : quand le camion est payé, quand les échéances du prêt commencent, si un mois passe sous zéro.
**Décision de l'utilisateur (21/11) :** le plan de trésorerie mensuel est **exigé pour une jeune société** (première année) et
**facultatif** pour une société établie, qui peut le joindre si la banque le demande.

## Ce qui est attendu

1. **12 mois**, à partir du mois de la date d'acquisition, tirés de la projection retenue.
2. **Les lignes** : encaissements (ventes encaissées, apport du client, prêt reçu), décaissements (achats de marchandises, charges
   d'exploitation, impôt et besoin en fonds de roulement, investissements, échéances du prêt demandé, échéances de la dette
   existante), solde du mois, solde cumulé, trésorerie d'ouverture.
3. **Une égalité assertée** avec le plan annuel : le solde cumulé de décembre est la trésorerie au 31/12 du plan de financement.
4. **Un fichier Excel** du plan mensuel, document du dossier.

## Décisions retenues par défaut (contestables)

- **D-1110-1 — La lecture** : `GET /api/v1/dossiers/{dossierId}/financements/{financementId}/tresorerie-mensuelle` (consulter), sur la
  **projection retenue** (`scenarioRetenu`, STORY-1084). Réponse :
  `{ ouverture: { date, montant }, mois: [ { mois: 'AAAA-MM', encaissements: {...}, decaissements: {...}, soldeMois, soldeCumule } ],
  moisNegatifs[], controle: { decembre: { mensuel, annuel, egal } }, statut, motif }`. Même convention que 1084 : `statut` `CALCULE` ou
  `INCALCULABLE`, jamais 0 inventé ; motifs fermés `SCENARIO_NON_RETENU`, `SCENARIO_INTROUVABLE`, `DATE_ACQUISITION_ABSENTE`,
  `EXERCICE_DE_BASE_SANS_MILLESIME`.
- **D-1110-2 — Les douze mois** commencent au mois de la `dateAcquisition` (STORY-1104) et se terminent onze mois plus tard, **à cheval
  sur deux exercices** : référence, acquisition au 01/04/2026 ⇒ avril 2026 → mars 2027. Les flux d'un mois se lisent dans l'exercice
  qui le contient (2026 pour avril → décembre, 2027 pour janvier → mars) ; la projection couvre déjà trois exercices.
- **D-1110-3 — La ventilation des flux annuels** (règle par défaut, contestable) :
  - les flux de **l'activité actuelle** se répartissent à parts égales sur les 12 mois de l'exercice civil ;
  - les flux **liés au projet** (chiffre d'affaires, marge et charges du camion, investissement, apport, déblocage du prêt)
    commencent au mois d'acquisition : l'investissement et l'apport tombent **ce mois-là** (« le camion en avril »), le prêt est
    reçu ce mois-là, le reste se répartit à parts égales sur les mois qui suivent dans l'exercice ;
  - les **échéances** du prêt demandé et de la dette existante sont **celles des échéanciers de STORY-1084**, mois par mois, jamais
    lissées : référence, **0** le mois du déblocage, puis **−658 346** chaque mois (la première échéance tombe un mois après la date
    de début, D-1084-5), et **−39 988** par mois pour la dette existante (prêt d'équipement Orabank, 1 239 289 à 10 % sur 36 mois) ;
  - arrondi au franc ; **l'écart d'arrondi se reporte sur le dernier mois de chaque exercice** (décembre, puis mars pour la fin du
    premier exercice mensuel), de sorte que les sommes mensuelles égalent les montants annuels.
- **D-1110-4 — L'ouverture** : la trésorerie à la date d'acquisition = la trésorerie au 1er janvier de l'exercice + les flux nets de
  l'activité actuelle des mois qui précèdent l'acquisition dans l'exercice (janvier → mars). **Référence : 765 910 au 01/04/2026**
  (trésorerie d'ouverture 850 000 au 01/01/2026, moins 84 090 de flux nets de janvier à mars).
- **D-1110-5 — L'égalité assertée** (`controle.decembre`) : le solde cumulé de décembre est égal, **au franc**, à la trésorerie au 31
  décembre du plan de financement annuel (STORY-1084, D-1084-11). **Référence : décembre 2026 = 2 772 076** (plan annuel :
  850 000 + variation 1 922 076). Le test l'asserte en dur ; au service, un écart ne se sert pas : 422
  `ECART_AVEC_LE_PLAN_ANNUEL` (le défaut du moteur est une panne, pas un choix de l'utilisateur) et une alerte est journalisée.
  La même égalité est vérifiée pour les deux exercices touchés ; mars 2027 clôt le plan mensuel sans égalité annuelle à tenir.
- **D-1110-6 — Valeurs de référence de la maquette** (jeu « Avec le camion », dette existante comprise) :

  | Mois | Apr. 2026 | Mai | Juin | … | Déc. 2026 | Janv. 2027 | Févr. | Mars |
  |---|---:|---:|---:|---|---:|---:|---:|---:|
  | Solde du mois | 808 103 | 149 757 | 149 757 | … | 149 764 | 173 115 | 173 115 | 173 115 |
  | Solde cumulé | 1 574 013 | 1 723 770 | 1 873 527 | … | **2 772 076** | 2 945 191 | 3 118 306 | 3 291 421 |

  avril 2026 : ventes encaissées 4 003 999, apport 6 250 000, prêt reçu 25 000 000, achats −2 248 046, charges d'exploitation
  −622 768, impôt et besoin en fonds de roulement −160 094, investissement du camion −31 375 000, échéance du prêt 0, échéance
  de la dette existante −39 988. Les **invariants** (ouverture 765 910, décembre 2 772 076, somme des soldes d'avril à décembre
  = 2 006 166) sont la référence ; les autres cellules sont recalculées par le moteur et la maquette est corrigée si une cellule
  diffère de plus d'un franc.
- **D-1110-7 — Les mois sous zéro** : `moisNegatifs[]` liste les mois dont le solde cumulé est négatif (référence : aucun). La
  synthèse du dossier (STORY-1086) et les points de vigilance les citent.
- **D-1110-8 — Le fichier Excel** : `POST /tresorerie-mensuelle/export` (préparer) produit le plan en `.xlsx` comme **document du
  dossier** (contrat de STORY-1104, `origine = GENERE`, `cible = PIECE_EXIGENCE`), avec un **aperçu** dans l'application avant
  téléchargement ; il reprend les mêmes cellules que la réponse (jamais recalculées).
- **D-1110-9 — Pas de nouveau droit** (consulter, préparer), même portée que 1083 ; le manifeste M49 passe en 0.3.0 (`GET
  /tresorerie-mensuelle` en lecture seule). Un dossier `BROUILLON` seulement pour l'export. Piste d'audit : aucun type neuf.

## Critères d'acceptation

- **AC-1** : l'ouverture 765 910 au 01/04/2026, le solde cumulé de décembre 2 772 076 et l'égalité avec le plan annuel sont écrits
  en dur dans le test ; la somme des douze soldes égale la variation des 12 mois.
- **AC-2** : les échéances du prêt sont celles de l'échéancier de 1084 (0 puis −658 346, jamais lissées) ; le décaissement du camion
  tombe en avril.
- **AC-3** : sans projection retenue, ou sans date d'acquisition, la réponse est `INCALCULABLE` avec son motif, jamais 0.
- **AC-4** : un moteur volontairement faussé d'un franc répond 422 `ECART_AVEC_LE_PLAN_ANNUEL` (mutation sur le contrôle) ; l'écart
  d'arrondi se reporte sur décembre.
- **AC-5 (voir)** : l'Excel exporté a un aperçu dans l'application avant téléchargement.
- **AC-6** : droits et portée comme 1083 ; contrat publié, typé dans l'OpenAPI, annoncé dans « ⚠ Contrats » avant le code.

## Hors périmètre

- Un plan de trésorerie sur plus de 12 mois ou à la semaine.
- Le saisonnier : les flux sont lissés ; une saisonnalité par activité viendra avec le référentiel sectoriel.
- Le scénario prudent mensuel : le plan mensuel porte la projection retenue seule (le prudent reste annuel, STORY-1111).
