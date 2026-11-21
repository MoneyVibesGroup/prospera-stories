---
title: "Épics et stories — Les services du cabinet (financement, archives, missions, paie)"
created: 2026-11-18
source: prds/prd-services-cabinet-2026-11-18/prd.md (FR-1 → FR-25, NFR-1 → NFR-9)
epics: EPIC-266 → EPIC-269 ; FE-EPIC-012 ; AP-EPIC-005
stories: STORY-1083 → STORY-1092 ; FE-140 → FE-145 ; AP-50 → AP-53 ; amendé le 21/11 : STORY-1104 → 1111, FE-152 → FE-157
---

# Épics et stories — Les services du cabinet

Vingt stories en **cinq lots de quatre** (consigne de l'utilisateur du 2026-11-18), dans l'ordre de valeur du PO :
financement, archives, missions, paie. Chaque lot mêle backend et écrans ; la console a une story dans quatre lots.
Les fiches détaillées (`stories/STORY-*.md`, `frontend-stories/FE-*.md`, `AP-*.md`) s'écrivent **juste avant de
coder**, depuis ce document ; les critères ci-dessous sont ceux qu'elles reprennent.

## Règles communes à toutes les stories

- **Backend** : contrat de module (manifeste C1, garde, droits hors du jeton, état publié, C13), cloisonnement par
  portefeuille (hors portée : 404), piste d'audit, montants entiers en FCFA, documents figés par SHA-256 ; preuves
  selon `coordination/REGLES-DES-GROUPES.md` (tests par chemin de fichier, mutation, Node 24, `docker compose up` du
  service si une dépendance change). Un contrat neuf s'annonce dans « ⚠ Contrats » du journal **avant** le code.
- **Écrans** : **maquette d'abord**, ajoutée au prototype (`prototypes/prospera-prototype.html` pour le cabinet,
  prototype séparé pour la console, AP-30), republiée et **validée par l'utilisateur** ; types générés depuis l'OpenAPI
  vivant ; aucune donnée simulée ; gate d'intégration sur vrai backend à la fin de l'épic.
- **Ordre dans un lot** : la story de la console qui publie un référentiel passe avant la story qui le lit.

## Couverture des exigences

| FR | Story | FR | Story |
|---|---|---|---|
| FR-1 | 1083, FE-140, 1107, 1108, FE-155 | FR-13 | 1089, FE-144 |
| FR-2 | 1085, 1105, FE-153 | FR-14 | 1090, FE-144 |
| FR-3 | 1084, 1104, FE-140, FE-152 | FR-15 | 1090, FE-144 |
| FR-4 | 1084, 1086, 1110, FE-141 | FR-16 | lot M2 (suivant) |
| FR-5 | 1086, 1109, FE-142, FE-156 | FR-17 | AP-50 |
| FR-6 | 1084, 1111, FE-157 | FR-18 | AP-52 |
| FR-7 | 1087, FE-143 | FR-19 | AP-51 |
| FR-8 | 1087 | FR-20 | AP-53 |
| FR-9 | 1087, FE-143 | FR-21 | 1091, FE-145 |
| FR-10 | 1088, FE-143 | FR-22 | 1091, FE-145 |
| FR-11 | 1088, FE-143 | FR-23 | 1092, FE-145 |
| FR-12 | 1089, FE-144 | FR-24 | 1092 |
|  |  | FR-25 | lot P2 (suivant) |

*Amendé le 21/11 (parcours réel du dossier de financement, maquette de FE-140 validée, PR #741) : les FR neufs du PRD §4.1 se couvrent
ainsi.*

| FR neuf | Story | FR neuf | Story |
|---|---|---|---|
| FR-1b (pro forma, projet financé, contrat des documents) | 1104, FE-152 | FR-1e (suivi banque par banque, conditions, décaissement) | 1107, 1108, FE-155 |
| FR-1c (plusieurs banques, relation, profil) | 1105, FE-152 | FR-5b (documents générés, Word modifiable, aperçu) | 1109, FE-156 |
| FR-1d (garanties saisies, décote, couverture retenue) | 1106, FE-154 | FR-6b (trésorerie mensuelle, hypothèses, soutenable, différé, prudent) | 1110, 1111, FE-157 |


## Les épics

| Épic | Titre | FR | Lots |
|---|---|---|---|
| **EPIC-266** | Le dossier de financement bancaire (`financement`, M49) | FR-1 → FR-6, FR-17 | F1, F2 |
| **EPIC-267** | Les archives du client : la GED ouverte au cabinet, et le papier (`ged`, M07) | FR-7 → FR-11, FR-19 | G1 |
| **EPIC-268** | Les missions et la facturation du cabinet (`missions`, M39) | FR-12 → FR-15, FR-18 | M1 |
| **EPIC-269** | La paie du cabinet (`paie`, M41) | FR-20 → FR-24 | P1 |
| **FE-EPIC-012** | Les services du cabinet à l'écran (app cabinet) | — | F1 → P1 |
| **AP-EPIC-005** | Les référentiels et le suivi des services du cabinet (console) | FR-17 → FR-20 | F1, G1, M1, P1 |

## Les lots

| Lot | Story 1 | Story 2 | Story 3 | Story 4 | Gestes avant |
|---|---|---|---|---|---|
| **F1** | AP-50 | STORY-1083 | STORY-1084 | FE-140 | maquettes FE-140, AP-50 |
| **F2** | STORY-1085 | STORY-1086 | FE-141 | FE-142 | FE-035 et FE-036 tirées ; maquettes |
| **G1** | STORY-1087 | STORY-1088 | AP-51 | FE-143 | quota de l'offre (Q-SC-5) ; maquettes |
| **M1** | AP-52 | STORY-1089 | STORY-1090 | FE-144 | **dépôt `prospera-cabinet-service` créé** ; maquettes |
| **P1** | AP-53 | STORY-1091 | STORY-1092 | FE-145 | **dépôt `prospera-paie-service` créé** ; sources du référentiel social (Q-SC-4) ; maquettes |

Porteurs proposés (le plan du lot tranche) : backend de `bilan-service`, `prospera-cabinet-service`,
`prospera-paie-service` → A ; `document-service` → C (qui tient la GED) ; console et écrans → D. Une story qui touche
le dépôt d'un autre groupe (auth, paiement, fiscal) passe par une demande dans le journal.

---

## EPIC-266 — Le dossier de financement bancaire

### Lot F1

#### AP-50 : La console tient les exigences des banques (5 pts)

*En tant qu'opérateur Money Vibes, je publie ce que chaque banque exige, pour que le cabinet sache ce qu'il lui
manque avant d'aller à la banque.*

Dépôts : `frontend-admin-panel`, BFF `admin-panel`, catalogue (référentiel `exigences-bancaires-uemoa`). FR-17.

| AC | Critère |
|---|---|
| AC-1 | Un éditeur liste les banques (code, nom, pays) et, par banque : pièces exigées (bloquante ou non), nombre d'exercices historiques, ratios regardés et seuils. |
| AC-2 | « Banque générique UEMOA » existe toujours et ne se supprime pas. |
| AC-3 | Publier crée une **version datée** du référentiel (mécanisme des référentiels du catalogue : octets, empreinte, une version publiée ne se réécrit jamais) ; l'éditeur montre la version publiée et le brouillon. |
| AC-4 | Le contenu initial est marqué « à relire par une banque » (Q-SC-1) et cette mention reste visible jusqu'à ce qu'on l'enlève. |
| AC-5 | Droit plateforme dédié ; un opérateur sans ce droit voit la page en lecture seule. |

> **Amendé le 21/11 — AP-50 passe à 8 points** (maquette de FE-140 validée, PR #741). Le référentiel `exigences-bancaires-uemoa` porte
> aussi, en plus de AC-1 à AC-5 :
>
> | AC | Critère (amendement) |
> |---|---|
> | AC-6 | **Les exigences par profil et par relation** : chaque exigence porte son groupe (l'entreprise, les comptes, les dirigeants et cautions, le projet, la relation avec la banque), son libellé, `bloquante`, ses `profils` (`ETABLIE`, `JEUNE`, `TOUS`), sa règle selon la relation (`NOUVEAU_CLIENT` et `CLIENT_MOUVEMENTE` : `REQUISE`, `DEJA_A_LA_BANQUE`, `FOURNIE_PAR_LA_BANQUE` ou `SANS_OBJET`), son éventuelle condition (`SI_MATERIEL`, `SI_CA_A_JUSTIFIER`, `SI_JEUNE_SOCIETE`, `TOUJOURS`). Un éditeur par banque. |
> | AC-7 | **Les validités** : `validiteMois` par exigence (attestation de régularité fiscale, attestation CNSS, extrait RCCM, justificatif de domicile : 3 mois par défaut). |
> | AC-8 | **Les décotes par défaut des garanties** : par type (hypothèque 30 %, gage de matériel 40 %, nantissement du fonds de commerce 50 %, dépôt à terme 0 %, fonds de garantie 0 %, assurance 0 %, autre 30 %), avec la pièce attendue ; valeurs de démonstration à faire confirmer par une banque. |
> | AC-9 | **Les seuils et paramètres** : couverture du service de la dette (1,20), autonomie financière (33 %), repères d'apport (20 à 30 % établie, 30 à 40 % jeune), repères de couverture des garanties (100 % établie, 150 % jeune), `tauxIndicatifPct` (12 %), `assurance.tauxAnnuelPct` (0,30 %), marge brute par défaut du questionnaire (25 %), règles de crédibilité des hypothèses (STORY-1111). Surchargeables par banque ; une banque sans seuil propre prend ceux de la banque générique. |
> | AC-10 | Chaque modification publie une version datée ; un dossier garde la version lue à l'ajout de la banque (STORY-1105). |

#### STORY-1083 : Le dossier de financement existe (5 pts)

*En tant qu'associé, je crée un dossier de financement pour un client, pour suivre sa demande de prêt du brouillon à
la réponse de la banque.*

Dépôt : `bilan-service` (dossier `financement/`) ; manifeste `manifestes/financement.manifest.ts` (M49). FR-1.

| AC | Critère |
|---|---|
| AC-1 | Manifeste C1 du module `financement` (verticale cabinet, dépend de `bilan`), garde `FINANCEMENT_NOT_ENTITLED`, droits `financement:dossier:preparer`, `:valider`, `:consulter` déclarés et attribués (`CAB_ASSOCIE` les trois, `CAB_COLLABORATEUR` préparer et consulter). |
| AC-2 | `POST/GET/PATCH …/dossiers/{id}/financements` : objet, montant, durée, différé, type, banque cible (code du référentiel, version lue gardée), garanties, exercice de référence. |
| AC-3 | La table des transitions de FR-1 (PRD) exactement : chaque ligne éprouvée, toute autre transition `409 TRANSITION_INTERDITE` ; `PRET` → `REMIS` exige une version figée (1086 : d'ici là, refusé `VERSION_FIGEE_ABSENTE`). |
| AC-4 | Un dossier `REMIS` est immuable : corriger crée la version n+1, la précédente reste lisible. |
| AC-5 | Cloisonnement (portefeuille, 404) et piste d'audit ; mutation sur la garde de transition. |

#### STORY-1084 : Chaque emprunt a son échéancier, et le prévisionnel le lit (8 pts)

*En tant que collaborateur, je saisis le prêt demandé et les dettes existantes, pour que le prévisionnel et les
indicateurs de dette soient justes.*

Dépôt : `bilan-service` (`financement/`, `projection/`). FR-3, FR-4 (dette), FR-6.

| AC | Critère |
|---|---|
| AC-1 | Un emprunt : capital, taux, durée, différé, périodicité, mode (échéances constantes ou amortissement constant), date de début ; échéancier calculé (capital, intérêts, restant dû). |
| AC-2 | Convention de FR-3 (taux nominal annuel ÷ 12, intérêts et échéance arrondis au franc, écart sur la dernière) ; somme du capital = capital emprunté. **Valeur de référence** écrite dans le test : 25 000 000, 12 %, 48 mois ⇒ mensualité 658 346, dernière 658 339, intérêts 6 600 601. |
| AC-3 | Le dossier de financement choisit un jeu d'hypothèses du prévisionnel comme scénario retenu ; ses emprunts remplacent l'agrégat `empruntsNouveaux` pour les charges financières et les remboursements par exercice (aucune copie du prévisionnel). |
| AC-4 | Indicateurs servis avec formule et sources : couverture du service de la dette, capacité d'endettement résiduelle, autonomie financière, plan de financement emplois/ressources par année. |
| AC-5 | Un indicateur incalculable dit pourquoi (`INCALCULABLE`, motif) ; jamais 0. Mutation sur le report d'arrondi. |

#### FE-140 : Le dossier de financement à l'écran (5 pts)

*En tant qu'associé, je vois les demandes de prêt de mon client, j'en crée une et je saisis ses emprunts.*

App cabinet : nouvel onglet « Financement » de la fiche dossier (visible si le module est octroyé). Backend : 1083,
1084. FR-1, FR-3.

| AC | Critère |
|---|---|
| AC-1 | Maquette ajoutée au prototype et validée par l'utilisateur avant le code. |
| AC-2 | Liste des dossiers de financement du client (état, montant, banque, dates) ; création ; changement d'état selon les droits (un collaborateur ne voit pas « Valider »). |
| AC-3 | Saisie des emprunts et échéancier affiché ; les indicateurs de dette avec leur formule au survol. |
| AC-4 | Les refus du serveur s'affichent par leur code, avec un texte d'écran (jamais le texte amont). |
| AC-5 | Types générés (`gen:api`) ; e2e sur vrai backend. |

### Lot F2

#### STORY-1085 : Ce que la banque exige, et ce qu'il manque (5 pts)

*En tant qu'associé, je vois pour la banque choisie ce qui est fourni et ce qui manque, et je ne peux pas déclarer le
dossier prêt s'il manque une pièce bloquante.*

Dépôts : `bilan-service` ; lecture des pièces du dossier dans `document-service` (`GET /dossiers/{id}/pieces`). FR-2.

| AC | Critère |
|---|---|
| AC-1 | Pour chaque exigence de la version du référentiel lue : `FOURNIE` (source : pièce, exercice validé), `MANQUANTE` (action proposée), `SANS_OBJET` (motif saisi). |
| AC-2 | Les pièces déjà déposées (statuts, RCCM, carte CFE…) sont reconnues par leur type, sans nouveau dépôt ; une pièce s'ajoute au dossier de financement par référence. |
| AC-3 | Les exercices historiques se lisent des jeux d'états **validés** ; un exercice absent est `MANQUANTE`. |
| AC-4 | `PRET` refusé tant qu'une exigence bloquante manque : `409 EXIGENCES_BANCAIRES_INCOMPLETES`, liste en `details`. |
| AC-5 | Une nouvelle version du référentiel ne change pas un dossier déjà créé (il garde la sienne) ; mutation. |

> **Amendé le 21/11 — STORY-1085 passe à 8 points** (maquette de FE-140 validée, PR #741 ; décisions de l'utilisateur 20-21/11 : pas de
> consentement BIC ; pièces selon le profil et la relation ; lettre d'affirmation toujours). Dépend de AP-50 (le référentiel étendu),
> STORY-1104 (le contrat des documents, le pro forma), STORY-1105 (profil et relation) ; lit STORY-1109 (pièces générées),
> STORY-1110 (plan mensuel) et STORY-1111 (hypothèses « à justifier »). Les AC-1 à AC-5 ci-dessus restent ; s'y ajoutent :
>
> | AC | Critère (amendement) |
> |---|---|
> | AC-6 | **Exigences par profil et par relation.** Chaque exigence du référentiel porte `profils` (`ETABLIE`, `JEUNE`, `TOUS`) et une règle par relation : `REQUISE`, `DEJA_A_LA_BANQUE`, `FOURNIE_PAR_LA_BANQUE` ou `SANS_OBJET`. La liste d'une banque = les exigences de **son** profil (STORY-1105) et de **sa** relation. Un client déjà connu n'a pas à refournir ses statuts, RCCM, NIF, pièce d'identité, justificatif de domicile (`DEJA_A_LA_BANQUE`) ni ses relevés (`FOURNIE_PAR_LA_BANQUE`) ; le dossier d'ouverture de compte est `SANS_OBJET`. |
> | AC-7 | **Six statuts** par exigence et par banque : `FOURNIE` (source : pièce déposée, document généré, exercice validé, emprunts, projection), `MANQUANTE` (**bloquante** ou **facultative**, avec l'action proposée : `DEPOSER`, `GENERER`, `IMPORTER_EXERCICE`, `OUVRIR_EDITEUR`), `EXPIREE` (validité dépassée), `SANS_OBJET` (motif : par règle, ou saisi par le cabinet, 10 à 300 caractères), `DEJA_A_LA_BANQUE`, `FOURNIE_PAR_LA_BANQUE`. Seules `MANQUANTE` bloquante et `EXPIREE` bloquante comptent pour `PRET` (`EXIGENCES_BANCAIRES_INCOMPLETES`, liste par banque en `details`). |
> | AC-8 | **Validité** : une exigence porte `validiteMois` (attestation de régularité fiscale, attestation CNSS, extrait RCCM, justificatif de domicile : 3 mois) ; `EXPIREE` = date du document + validité < date du jour. Référence : attestation CNSS du 18/10/2025 expirée depuis le 18/01/2026 ; attestation OTR déposée le 09/02/2026 valable jusqu'au 09/05/2026. |
> | AC-9 | **Pièces conditionnelles** : pro forma **si matériel** (type `INVESTISSEMENT` ou `CREDIT_BAIL`, STORY-1104 ; expiré ⇒ `EXPIREE`) ; **contrats ou lettres d'intention si une hypothèse de chiffre d'affaires est « à justifier »** (STORY-1111) ; **plan de trésorerie mensuel si jeune société**, bloquant (facultatif pour une société établie, STORY-1110) ; note de présentation (société établie) ou plan d'affaires (jeune société), STORY-1109 ; **lettre d'affirmation du dirigeant toujours** ; tableau des dettes en cours repris des emprunts (STORY-1084). |
> | AC-10 | **Jeu d'essai** : les sept cas du tableau `attendu` du banc d'essai de la maquette, dont : société établie, relations mixtes (BOA nouveau, Orabank déjà client, Ecobank nouveau), dossier incomplet = 27 exigences, **10 fournies, 13 manquantes, 1 expirée, 3 sans objet, 11 bloquantes** ; société établie complète = 24 fournies, 3 sans objet ; jeune société, relations mixtes = 23 exigences, 7 fournies, 14 manquantes, 1 expirée, 1 sans objet, 13 bloquantes. Écrits en dur dans le test. |
> | AC-11 | **« Demander au client les pièces manquantes »** : `GET …/demandes-pieces/message?canal=` rend un message prêt (WhatsApp ou e-mail) qui liste les pièces manquantes **banque par banque**, les pièces communes une seule fois ; `POST …/demandes-pieces` enregistre la demande (canal, date, auteur) et envoie l'e-mail par `notification-service` (WhatsApp : lien ouvert par l'écran, rien d'envoyé par le serveur). |
> | AC-12 | **« Voir » une pièce** : chaque exigence `FOURNIE` porte `voir` : un document déposé ou généré (contrat de STORY-1104, `…/documents/{id}/apercu`), un exercice validé (états financiers) ou une projection (STORY-1111). |
> | AC-13 | **Déposer = téléverser** (exigence de l'utilisateur, 21/11) : toute action `DEPOSER` (pièce, remplacement d'une pièce expirée, mois de relevés manquants) est un vrai téléversement par le contrat de STORY-1104 (D-1104-9) : types et taille nommés, refus `FORMAT_NON_ACCEPTE`, `FICHIER_TROP_VOLUMINEUX`, `FICHIER_ILLISIBLE`, la pièce passe `FOURNIE` avec nom du fichier, date et déposant. **Tout document généré se voit avant téléchargement.** |
> | AC-14 | Routes (sous `/api/v1/dossiers/{dossierId}/financements/{financementId}`) : `GET /exigences?banqueId=` (consulter), `PUT` et `DELETE /exigences/{code}/sans-objet` (préparer), `GET …/demandes-pieces/message`, `POST …/demandes-pieces` (préparer). Refus : `EXIGENCE_INTROUVABLE`, `MOTIF_REQUIS`, `SANS_OBJET_INTERDIT` (exigence imposée par la règle), `REFERENTIEL_INTROUVABLE`. |
>
> **Valeurs de la maquette** : la liste complète des exigences, leurs groupes (l'entreprise, les comptes, les dirigeants et cautions, le
> projet, la relation avec la banque), leurs profils, leurs règles et leurs statuts est celle du banc d'essai FE-140, étape « Les pièces ».

#### STORY-1086 : Le dossier pour la banque, assemblé et figé (8 pts)

*En tant qu'associé, je génère le document que je remets à la banque, et je retrouve exactement ce que j'ai remis.*

Dépôt : `bilan-service` (`financement/`, `export/`). FR-4 (exports), FR-5.

| AC | Critère |
|---|---|
| AC-1 | Le PDF contient : présentation (identité du dossier client), objet et montant, historique sur 3 exercices (bilan, compte de résultat, tableau des flux), analyse (19 indicateurs + indicateurs de dette, verdicts), prévisionnel 3 ans du scénario retenu, plan de financement, échéancier, garanties, liste des pièces jointes ; l'Excel porte les tableaux. |
| AC-2 | Générer **fige** une version (contenu, hypothèses, version du référentiel, SHA-256) ; la retélécharger rend les mêmes octets ; aucun recalcul après figement. |
| AC-3 | Les ratios et l'analyse entrent aussi dans les exports existants des états (ajout seul). |
| AC-4 | Le document porte « préparé par <cabinet> », la date et la version ; aucune transmission à la banque. |
| AC-5 | Générer exige `PRET` ; les chiffres du PDF sont ceux de l'API (test qui compare). |

> **Amendé le 21/11 — STORY-1086 passe à 13 points** (maquette de FE-140 validée, PR #741). Dépend de STORY-1085 amendée, STORY-1106
> (garanties), STORY-1109 (documents générés), STORY-1110 et STORY-1111 (annexe, scénario prudent). **AC-5 est amendé** (ci-dessous) ;
> AC-1 à AC-4 restent, avec les ajouts suivants :
>
> | AC | Critère (amendement) |
> |---|---|
> | AC-6 | **Un dossier par banque.** Chaque banque du dossier (STORY-1105) a **son** dossier : son PDF et son Excel, ses exigences, la relation qui la concerne, son nom de fichier (`Dossier-Kossi-camion-BOA-v1.pdf`, `…-Orabank-v1.xlsx`, `…-Ecobank-generique-v1.pdf`). États du dossier d'une banque : `A_GENERER`, `GENERE` (à relire), `FIGE` (version, date, empreinte SHA-256, dont les 16 premiers caractères s'affichent). `POST …/banques/{banqueId}/dossier/generer`, `POST …/figer` (valider), `GET …/dossier`, `GET …/dossier/pdf`, `GET …/dossier/xlsx`. |
> | AC-7 | **Générer et figer avant `PRET`** (amende AC-5) : générer est permis en `BROUILLON` et `PRET` (un document **recalculé** et non figé) ; **figer** (valider) exige que les exigences bloquantes de cette banque soient remplies (`EXIGENCES_BANCAIRES_INCOMPLETES`) et aucun pro forma expiré ; toute modification d'un brouillon après le figement passe la version `PERIMEE` (« à régénérer »). `PRET` → `REMIS` d'une banque (STORY-1107) exige une version `FIGE` non `PERIMEE` (`VERSION_FIGEE_ABSENTE`, `VERSION_FIGEE_PERIMEE`) : le port `VersionsFigees` de 1083 lit désormais les versions figées par banque. |
> | AC-8 | **Synthèse d'une page en tête de chaque dossier** : *Qui* (raison sociale, forme, NIF, activité, ancienneté), *Le projet* (objet, coût, apport, montant demandé, durée, différé), *Les garanties* (couverture retenue, couverture déclarée, valeur retenue), *La capacité à rembourser* (couverture du service de la dette **centrale** et **prudente**, la plus basse des trois exercices ; autonomie financière de la 1re année), *Relation avec la banque* (la relation propre à cette banque), **points forts** et **points de vigilance** générés. **Référence (Ets Kossi)** : couverture retenue **197 %**, déclarée **275 %**, valeur retenue **49 250 000** ; couverture centrale **1,56**, prudente **1,12** ; autonomie 2026 **37,7 %** ; coût 31 250 000, apport 6 250 000 (20 %), demandé 25 000 000, 48 mois, sans différé. |
> | AC-9 | **Points forts et de vigilance : des règles, aucun texte libre généré, aucune IA.** Fort : couverture centrale minimale ≥ 1,20 ; couverture prudente minimale ≥ 1,20 ; autonomie ≥ 33 % ; couverture retenue des garanties ≥ repère (100 % société établie, 150 % jeune société) ; apport ≥ repère (20 % ou 30 %) ; relation `CLIENT_MOUVEMENTE`. Vigilance : couverture prudente minimale < 1,20 (référence : 1,12) ; trésorerie prudente négative (référence : 2027, −754 142) ; hypothèse de chiffre d'affaires « à justifier » ; montant demandé supérieur au montant soutenable (référence : 20 492 000) ; apport sous le repère ; garanties sous le repère ; mois de trésorerie négatif (STORY-1110). Chaque ligne cite son chiffre. |
> | AC-10 | **Le scénario prudent en annexe** (STORY-1111) : les trois lignes couverture, trésorerie, résultat net, en central et en prudent, avec les repères ; le dossier présente la projection retenue en corps de document. |
> | AC-11 | **Mention fixe de responsabilité du cabinet**, en pied de **chaque page** : « Établi par <cabinet> sur la base des informations fournies par le client. Ne constitue pas une certification des comptes. » (référence : Cabinet Diallo & Associés) ; avec « préparé par <cabinet> », la date et la version. |
> | AC-12 | **PDF et Excel** : le PDF porte la synthèse, la présentation, le projet (pro forma, coût), l'historique, l'analyse, le prévisionnel, la trésorerie mensuelle si exigée, le plan de financement, l'échéancier, les garanties (décote, valeur retenue), la note ou le plan, la liste des pièces jointes **de cette banque** ; l'Excel porte les tableaux. Les chiffres du PDF sont ceux de l'API (test qui compare, comme AC-5). |
> | AC-13 | **Voir avant de télécharger** (exigence de l'utilisateur, 21/11) : le PDF et l'Excel de chaque banque, générés ou figés, s'affichent dans l'application (`…/documents/{id}/apercu`, contrat de STORY-1104) **avant** tout téléchargement ; le téléchargement d'une version figée rend les mêmes octets. |

#### FE-141 : L'analyse financière à l'écran (5 pts)

*En tant que collaborateur, je lis les indicateurs du client, leur formule et leur verdict, avant de parler à la
banque.*

App cabinet : onglet « Analyse » du bilan, et bloc d'indicateurs du dossier de financement. Backend :
STORY-552 → 554 (livrées), 1084. FR-4.

| AC | Critère |
|---|---|
| AC-1 | Maquette validée avant le code ; chiffres de la maquette tirés du jeu `cabinet-demo-togo` et vérifiés. |
| AC-2 | Les 19 indicateurs par famille, valeur N et N-1, formule et postes sources, verdict par seuil sectoriel ; « incalculable » avec son motif. |
| AC-3 | Les indicateurs de dette du dossier de financement (1084) dans le même composant. |
| AC-4 | Types générés ; e2e sur vrai backend. |

#### FE-142 : Les pièces exigées et le dossier pour la banque (5 pts)

*En tant qu'associé, je complète ce qui manque, je génère le dossier, je le télécharge, et je note la réponse de la
banque.*

App cabinet : onglet « Financement » (suite de FE-140). Backend : 1085, 1086. FR-1, FR-2, FR-5. Prérequis : FE-035,
FE-036 (écrans du prévisionnel).

| AC | Critère |
|---|---|
| AC-1 | Maquette validée avant le code. |
| AC-2 | Liste des exigences (fournie / manquante / sans objet) ; ajouter une pièce existante ou en déposer une ; motif pour « sans objet ». |
| AC-3 | « Générer » puis « Figer » ; les versions figées se téléchargent (PDF, Excel) avec leur date et leur empreinte. |
| AC-4 | Noter `REMIS`, `ACCORDE` (montant, taux, durée), `REFUSE` (motif). |
| AC-5 | Le refus `EXIGENCES_BANCAIRES_INCOMPLETES` affiche la liste de ce qui manque. |

> **Amendé le 21/11 — FE-142 est absorbée par les écrans neufs et n'est plus à écrire en l'état.** La maquette de FE-140 (PR #741) montre
> le parcours entier en sept étapes ; FE-142 se redécoupe ainsi : les pièces exigées (AC-2, AC-5) passent à **FE-153** (avec STORY-1085
> amendée) ; noter `REMIS`, `ACCORDE`, `REFUSE` (AC-4) passe à **FE-155** (suivi banque par banque, STORY-1107 et 1108) ; « Générer »,
> « Figer » et le téléchargement des versions figées (AC-3) restent à FE-142, **réduite à l'étape 6 « Le dossier »** : un dossier par
> banque, la synthèse d'une page, la relecture, le figement, l'aperçu puis le téléchargement (STORY-1086 amendée). **FE-142 : 5 → 3 points,
> dépend de STORY-1086 amendée.** Les pièces exigées et le suivi n'y reviennent pas.

---

## EPIC-267 — Les archives du client

### Lot G1

#### STORY-1087 : La GED s'ouvre au cabinet (8 pts)

*En tant qu'archiviste du cabinet, j'ouvre le fonds d'archives d'un client, je numérise par lots, je contrôle et je
verse, avec le circuit déjà éprouvé de la GED.*

Dépôts : `document-service` (module `ged`) ; manifeste `ged` amendé (verticale cabinet) ; droits `ged:*` et rôle
`CAB_ARCHIVISTE` dans `auth-service` (demande à B). FR-7, FR-8, FR-9.

| AC | Critère |
|---|---|
| AC-1 | Le porteur d'une pièce et d'un versement devient générique : dossier `sinistres` **ou** dossier client du cabinet ; le chemin de l'assurance ne change pas (ses tests passent tels quels). |
| AC-2 | Fonds d'archives par dossier client : période, natures attendues, volumétrie annoncée ; numéro `ARC-AAAA-<code client>-NNNNN`. |
| AC-3 | Plan de classement OHADA en **paramètre versionné** (natures, exercice, tiers, date, montant, référence) ; le cabinet ajoute des natures. |
| AC-4 | Lots, indexation, contrôle humain, versement, scellé : le circuit existant sous les droits de la matrice §2.3 du PRD (`ged:fonds:gerer`, `ged:lot:numeriser`, `ged:piece:indexer`, `ged:versement:verser`, `ged:piece:consulter`, `ged:sensible:consulter`) ; `CAB_ARCHIVISTE` ne lit rien d'autre du dossier. |
| AC-5 | Les pièces déjà déposées (`profil-documents`, `piece-documents`) apparaissent dans le fonds par référence ; les verser les copie dans la GED avec leur empreinte, liées à l'original. |
| AC-7 | Natures sensibles (bulletins, contrats de travail, pièces médicales, pièces d'identité) : lisibles seulement avec `ged:sensible:consulter` (404 sinon) ; test par rôle. |
| AC-6 | Toutes les pièces du cabinet chiffrées au repos (D-SC-6) ; stockage sans méthode de suppression. |

#### STORY-1088 : L'original papier, et retrouver une pièce (8 pts)

*En tant qu'archiviste, je sais où dort chaque original, je le prête et le récupère, et je retrouve une pièce en une
minute.*

Dépôt : `document-service` (module `ged`). FR-10, FR-11 ; reprend FR-170, FR-171 du PRD assurance.

| AC | Critère |
|---|---|
| AC-1 | Réception d'archives : bordereau (boîtes, période, état), numéro de réception. |
| AC-2 | Cote de chaque boîte (local, travée, tablette, boîte, rang), étiquette PDF à code QR ; un original est relié à sa copie numérique. |
| AC-3 | Sortie et retour d'une boîte ou d'une pièce : motif, emprunteur, date de retour prévue ; alerte au retard (paramètre). |
| AC-4 | Récolement daté : boîtes trouvées, manquantes, en trop ; écarts nommés. Restitution au client avec bordereau. |
| AC-5 | Recherche dans un fonds par nature, exercice, tiers, date, montant, référence et texte lu — **sauf le texte des natures sensibles** (métadonnées seulement) ; le résultat donne la copie et la cote de l'original. |
| AC-6 | La durée de conservation s'affiche par pièce (paramètre, 10 ans par défaut) ; aucune destruction. |

#### AP-51 : La console voit l'archivage de chaque cabinet (3 pts)

*En tant qu'opérateur Money Vibes, je vois ce que chaque cabinet stocke, pour facturer l'offre et anticiper la
capacité.*

Dépôts : `frontend-admin-panel`, BFF `admin-panel`, une route de consommation de surface plateforme dans
`document-service`. FR-19.

| AC | Critère |
|---|---|
| AC-1 | Par cabinet : fonds ouverts, pages versées, volume stocké, boîtes cotées, sur le mois et au total. |
| AC-2 | Le quota de l'offre (Q-SC-5) et l'alerte de dépassement ; la consultation n'est jamais bloquée. |
| AC-3 | Aucune donnée de pièce (ni nom, ni contenu) ne remonte à la console : des compteurs seulement. |

#### FE-143 : Les archives du client à l'écran (8 pts)

*En tant qu'archiviste, je travaille le fonds d'un client depuis une seule page.*

App cabinet : onglet « Archives du client » de la fiche dossier (le mot « archiver » reste à la fermeture du dossier,
D-SC-5). Backend : 1087, 1088.

| AC | Critère |
|---|---|
| AC-1 | Maquette validée avant le code. |
| AC-2 | Fonds : réception, lots (état, contrôle), versements et bordereaux. |
| AC-3 | Boîtes : cote, étiquette à imprimer, sortie et retour, retards, récolement. |
| AC-4 | Recherche et ouverture de la copie ; la cote de l'original à côté. |
| AC-5 | Types générés ; e2e sur vrai backend. |

---

## EPIC-268 — Les missions et la facturation du cabinet

### Lot M1 (dépôt `prospera-cabinet-service` à créer avant)

#### AP-52 : La console publie le modèle de base de la lettre de mission (3 pts)

*En tant qu'opérateur Money Vibes, je publie un modèle de lettre que chaque cabinet copie et adapte.*

Dépôts : `frontend-admin-panel`, BFF `admin-panel`, référentiel `modele-lettre-mission`. FR-18.

| AC | Critère |
|---|---|
| AC-1 | Éditeur du modèle (sections, champs à remplacer : cabinet, client, prestations, honoraires, durée, responsabilités). |
| AC-2 | Publication versionnée et datée ; une version publiée ne se réécrit jamais. |
| AC-3 | Le modèle dit qu'aucun modèle de l'ordre n'a été trouvé (Q-SC-2), tant que ce n'est pas réglé. |

#### STORY-1089 : Le catalogue du cabinet et la lettre de mission (8 pts)

*En tant qu'associé, je compose la mission d'un client depuis mon catalogue, et j'obtiens une lettre que le client
signe.*

Dépôt : `prospera-cabinet-service` (neuf : socle Node 24, client Kafka de Confluent, garde partagée, C13) ;
manifeste `manifestes/missions.manifest.ts` (M39, code `missions`). FR-12, FR-13.

| AC | Critère |
|---|---|
| AC-1 | Socle du service au patron des services récents (santé bornée, supervision Kafka, état publié, garde `MISSIONS_NOT_ENTITLED`, droits `missions:*`). |
| AC-2 | Catalogue du cabinet : forfait, abonnement (mensuel, trimestriel, annuel), au volume ; prix HT entier ; TVA paramètre (18 % par défaut). |
| AC-3 | Mission par dossier client : prestations, prix, date d'effet, durée, périmètre, responsable ; états `BROUILLON` → `ENVOYEE` → `SIGNEE` → `TERMINEE` / `RESILIEE`. |
| AC-4 | Lettre PDF depuis le modèle du cabinet (copie de la version de base lue) ; signature par dépôt du scan **ou** par le lien d'acceptation de FR-13 : signataire déclaré, code à six chiffres par SMS, usage unique, expiration 7 jours, annulable ; page sans compte ni autre donnée ; une lettre signée est immuable, un avenant crée une version. |
| AC-5 | Mission signée ⇒ une preuve de mandat **de plus** au journal du dossier client ; `MANDAT_ATTESTE` reste valable. |
| AC-6 | Tests du lien : expiré, déjà utilisé, code faux (trois essais puis blocage), annulé ⇒ refus nommés ; l'acceptation enregistre signataire, horodatage, empreinte, canal. |

#### STORY-1090 : Les factures d'honoraires et leur encaissement (8 pts)

*En tant qu'associé, je facture le forfait et l'abonnement sans tableur, et je vois qui a payé.*

Dépôts : `prospera-cabinet-service` ; `prospera-paiement-service` (demande à B : abonnement et créance à créancier
cabinet). FR-14, FR-15.

| AC | Critère |
|---|---|
| AC-1 | Facture : lignes, TVA par ligne arrondie au franc, totaux = sommes, mentions de FR-14, PDF figé ; numéro `HON-AAAA-NNNNNN` attribué **à l'émission**, série par cabinet et par année, sans trou, même sous concurrence (test de 10 émissions simultanées : 10 numéros consécutifs) ; un brouillon n'a pas de numéro. |
| AC-2 | Une facture émise ne se modifie ni ne se supprime ; l'avoir (total ou partiel) a sa série `AVO-AAAA-NNNNNN` et cite sa facture ; un avoir supérieur au reste dû laisse un crédit imputé sur la facture suivante. |
| AC-3 | Forfait facturé à la signature ou au jalon ; abonnement : une facture par échéance (brouillon à valider ou émission directe, réglage du cabinet). |
| AC-4 | Chaque facture émise devient une créance dans `paiement-service` (bénéficiaire : l'organisation du cabinet ; `moduleAppelant: missions`) ; lien de paiement **seulement** sur le compte d'encaissement propre du cabinet (aucun compte de Money Vibes choisissable : test) ; sinon saisie manuelle ; paiement partiel ⇒ `PARTIELLEMENT_PAYEE`. |
| AC-5 | Vue par client et totale : facturé, encaissé, reste dû, en retard, crédit. |

#### FE-144 : Les missions et les factures à l'écran (8 pts)

*En tant qu'associé, je tiens mon catalogue, mes lettres et mes factures dans l'app.*

App cabinet : « Catalogue » dans les paramètres du cabinet ; onglet « Mission et factures » de la fiche dossier ;
page « Facturation des clients » (distincte de `/billing`, qui est l'abonnement Prospera). Backend : 1089, 1090.

| AC | Critère |
|---|---|
| AC-1 | Maquette validée avant le code. |
| AC-2 | Catalogue : créer, modifier, retirer une prestation (une prestation déjà facturée ne se supprime pas). |
| AC-3 | Mission : composer, générer la lettre, l'envoyer, déposer la signature ou voir l'acceptation. |
| AC-4 | Factures : émettre, avoir, télécharger, lien de paiement, saisir un paiement ; tableau facturé / encaissé / retard. |
| AC-5 | Types générés ; e2e sur vrai backend. |

---

## EPIC-269 — La paie du cabinet

### Lot P1 (dépôt `prospera-paie-service` à créer avant)

#### AP-53 : La console publie le référentiel social du Togo (5 pts)

*En tant qu'opérateur Money Vibes, je publie les taux de la paie avec leur source, pour qu'aucun bulletin ne repose
sur un chiffre inventé.*

Dépôts : `frontend-admin-panel`, BFF `admin-panel`, référentiel `social-tg` au catalogue. FR-20.

| AC | Critère |
|---|---|
| AC-1 | Éditeur : CNSS par branche (employeur, salarié), plafond, AMU, barème de la retenue sur salaires, abattements, SMIG, majorations des heures supplémentaires, durée légale du travail ; **chaque valeur porte sa source** (texte, article, date). |
| AC-2 | Une valeur sans source se publie « à compléter » ; le calcul qui en dépend sera refusé (1092). |
| AC-3 | Publication `social-tg@2026.1`, datée, empreinte ; une version publiée ne se réécrit jamais ; une nouvelle version porte sa date d'effet. |
| AC-4 | Les valeurs déjà présentes au paquet fiscal (CNSS 17,5 % / 4 %, barème IRPP art. 74) sont reprises avec leur source, sans divergence (test qui compare). |

#### STORY-1091 : Le service de paie et les salariés (8 pts)

*En tant que collaborateur, je tiens les salariés d'un client et je saisis les éléments du mois.*

Dépôt : `prospera-paie-service` (neuf) ; manifeste `manifestes/paie.manifest.ts` (M41, code `paie`). FR-21, FR-22.

| AC | Critère |
|---|---|
| AC-1 | Socle au patron des services récents ; garde `PAIE_NOT_ENTITLED` ; droits `paie:salarie:gerer`, `paie:periode:preparer`, `paie:periode:cloturer`, `paie:consulter`, attribués selon la matrice §2.3 du PRD (clôture : associé seul). |
| AC-2 | Fiche salarié (identité, n° CNSS, entrée, contrat, catégorie, salaire de base, situation pour l'impôt, mode de paiement) ; champs personnels **chiffrés au repos** ; lecture par le portefeuille du dossier seulement. |
| AC-3 | Période `AAAA-MM` : éléments variables (heures supplémentaires, absences, primes, avantages, avances, retenues), saisie et import d'un gabarit fourni (erreurs ligne par ligne). |
| AC-4 | Période `CLOTUREE` immuable ; une correction passe par un rappel sur la période suivante. |
| AC-5 | Aucune donnée personnelle dans les logs, les faits Kafka ni les erreurs. |

#### STORY-1092 : Le bulletin du mois, et la fiscalité qui le reprend (8 pts)

*En tant que collaborateur, j'obtiens les bulletins justes du mois, et la base de rémunération arrive seule dans la
fiscalité.*

Dépôts : `prospera-paie-service` ; `prospera-fiscal-service` (réception `IMPORT`, demande à A si un autre groupe
porte). FR-23, FR-24.

| AC | Critère |
|---|---|
| AC-1 | Calcul : brut, assiette, cotisations salariales et patronales, retenue sur salaires, net, coût employeur — avec le référentiel social **de la période** ; aucun taux dans le code (test d'invariant). |
| AC-2 | Élément nécessaire « à compléter » au référentiel ⇒ `422 REFERENTIEL_SOCIAL_INCOMPLET` avec l'élément nommé ; jamais d'approximation. |
| AC-3 | Bulletin numéroté `BUL-AAAA-MM-<code client>-NNNN`, PDF figé (SHA-256) ; livre de paie du mois en PDF et Excel. **Cas de référence** écrits dans le test (un salarié au SMIG, un cadre avec heures supplémentaires majorées selon le référentiel). |
| AC-4 | Clôture de la période ⇒ la base de rémunération de chaque bénéficiaire est écrite dans fiscal-service en `IMPORT` (STORY-345) : type, montants par rubrique, période, identifiant de bénéficiaire du fiscal (gardé par la paie) ; **ni nom, ni numéro CNSS, ni contrat** (test sur le corps envoyé) ; idempotente au rejeu. |
| AC-5 | Mutation sur le taux lu (un taux pris ailleurs que dans la version de la période ⇒ rouge). |

#### FE-145 : La paie du mois à l'écran (8 pts)

*En tant que collaborateur, je prépare la paie d'un client du début à la clôture.*

App cabinet : onglet « Paie » de la fiche dossier. Backend : 1091, 1092.

| AC | Critère |
|---|---|
| AC-1 | Maquette validée avant le code ; chiffres de la maquette calculés depuis le référentiel social publié et vérifiés. |
| AC-2 | Salariés : liste, fiche, entrée et sortie. |
| AC-3 | Période : éléments du mois (saisie, import avec erreurs ligne par ligne), calcul, bulletins, livre de paie, clôture (droit de l'associé). |
| AC-4 | `REFERENTIEL_SOCIAL_INCOMPLET` s'affiche avec l'élément manquant et « Money Vibes doit compléter le référentiel ». |
| AC-5 | Types générés ; e2e sur vrai backend. |

---

## Lots suivants (nommés, non détaillés)

- **F3** — partage consenti du dossier avec la banque (passeport de la vision).
- **G2** — conservation, destruction proposée puis visée, restitution numérique en fin de mission.
- **M2** — temps passé, rentabilité par client, portail client (interrupteur `portail-client`).
- **P2** — déclaration CNSS mensuelle, écriture de paie dans la comptabilité, ordres de virement.
