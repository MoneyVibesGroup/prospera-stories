---
title: "Épics et stories — Ce qui manque pour qu'une comptabilité tenue dans Prospera soit complète"
created: 2026-11-26
demande: "l'utilisateur (Dev B) : « rédige les stories de ces modules pour compléter ce qui manque actuellement »"
sources:
  - Livre_Comptable_COMPLET.pdf (« La Boîte à Outils du Comptable », SYSCOHADA révisé, 181 p., racine de MoneyVibes_Apps, non versionné)
  - La_Boite_a_Outils_du_Comptable_50_fichiers_bonus/ (50 modèles xlsx, docx, pptx, racine, non versionné)
  - inventaire du code sur origin/dev de comptabilite, balance, bilan, fiscal, paiement, ventes (2026-11-25 et 26)
epics: EPIC-270 → EPIC-276 (neufs) ; EPIC-118 et EPIC-120 (existants, sans story jusqu'ici)
stories: STORY-1142 → STORY-1164 ; FE-159 → FE-165
---

# Ce qui manque pour qu'une comptabilité tenue dans Prospera soit complète

Vingt-trois stories backend et sept stories d'écran. Elles comblent les manques relevés en croisant le code de
`origin/dev` avec un livre de pratique comptable SYSCOHADA et ses cinquante modèles. Les fiches détaillées
(`stories/STORY-*.md`, `frontend-stories/FE-*.md`) s'écrivent **juste avant de coder**, depuis ce document. Les
critères ci-dessous sont ceux qu'elles reprennent.

## 1. Ce que les sources valent

**Le livre et les modèles servent de catalogue de règles et de contrôles. Ils ne servent jamais de référentiel.**

- **Ce qui est repris :** l'ordre des travaux de clôture, les écritures de régularisation et leur contrepassation, les
  barèmes de dépréciation par ancienneté, les contrôles de fin de mois (471, 585, caisse jamais créditrice, comptes de
  personnel soldés), les 25 anomalies et le compte qui révèle chacune, la revue analytique, la justification des comptes,
  les règles de caisse (billetage, procès-verbal à deux), le suivi des recommandations et la grille de contrôle interne,
  le reporting d'une page.
- **Ce qui n'est pas repris, et pourquoi :**
  - le plan de comptes du fichier 01 : 268 comptes, dont environ 10 % sont faux (120 pour le report à nouveau, 895
    « consolidation » au lieu de l'impôt minimum forfaitaire), et aucun compte 55 ;
  - les codes de la liasse du livre (chapitre 12) : ils ne suivent pas le modèle révisé (BA au lieu de AZ, BQ au lieu
    de BK, etc.). La liasse de `bilan-service` est juste et ne change pas ;
  - les taux : la paie des modèles est au taux du Bénin (3,6 % et 18,4 %) ; les taux du Togo restent ceux du paquet
    fiscal et du référentiel social (AP-53) ;
  - le mobile money en 5851 : le compte du SYSCOHADA révisé est le 55 (552 pour le téléphone portable). Le 585 est un
    compte de virements internes, soldé chaque mois ;
  - les formules des modèles 09, 19, 21, 32 et 41 : elles sont fausses (signe du rapprochement, solde additionné, TVA
    décalée d'une ligne, colonne N-1 lue dans le débit N). Les cas de test s'écrivent à la main, avec leur calcul.
- **Le livre ne dit rien du Togo**, de l'OTR, de la facture certifiée ni de la microfinance BCEAO. Rien ici ne touche
  au référentiel SFD.

## 2. Ce qui existe déjà, et n'est pas réécrit ici

| Sujet | Où c'est porté |
|---|---|
| Journaux, brouillard, validation, contre-passation, grand livre, balance dérivée | STORY-961 → 967 (EPIC-112 → 114), livrées |
| Tiers, compte collectif, balance âgée ; lettrage | STORY-968, 969, livrées |
| Clôture de l'exercice, à-nouveaux, réouverture tracée | STORY-970, livrée |
| Facture d'achat ou de vente déposée → écriture proposée ; mémoire des choix | STORY-1097, 1098, livrées (FE-149, FE-150) |
| Immobilisations et amortissements (registre, linéaire, dégressif, cessions) | EPIC-135, `balance-service`, livré |
| Rapprochement bancaire, import des relevés banque et mobile money | STORY-089, `balance-service/modules/rapprochement`, livrés |
| États financiers, 43 notes, liasse DSF de l'OTR, contrôles d'intégrité | `bilan-service`, `fiscal-service`, livrés |
| Paie : bulletin, référentiel social ; écriture de paie et déclaration CNSS | EPIC-034, EPIC-269 (STORY-1091, 1092 ; lot P2 nommé). **STORY-1145 détaille l'écriture de paie du lot P2** |
| Cycle des déclarations (calculé, déclaré, payé ; dépôt ; dossier de contrôle) | EPIC-031 → 033 (STORY-321 → 344) |
| Relances des clients | EPIC-038, EPIC-235 (`recouvrement`) |
| Stocks, valorisation CMUP / FIFO, inventaire | EPIC-075 → 084 (`stock-service`). Deux amendements proposés au §6 |
| Budget, réel contre prévu, contrôle de gestion | EPIC-239 (distributeur) |
| Archives, conservation, valeur de preuve | EPIC-267, lot 7 de B (STORY-1119 → 1126) |
| Facture certifiée par l'OTR | hors périmètre (PRD distributeur FR-57) : décision du PO, pas réécrite ici |

## 3. Règles communes à toutes les stories

- **Contrat de module et preuves** : celles de `coordination/REGLES-DES-GROUPES.md` (§1.5 : tests, mutation, Node 24,
  `docker compose up` du service si une dépendance change). Un contrat neuf (topic, route, champ) s'annonce dans
  « ⚠ Contrats » du journal **avant** le code. On n'en renomme aucun ; on ajoute ou on publie un `@2`.
- **Aucun numéro de compte dans le code.** Chaque écriture produite lit une **table d'imputation versionnée**
  (une donnée du service, avec sa source) : nature d'opération → compte, résolue sur le plan du dossier. Un compte absent
  du plan du dossier ⇒ refus nommé, jamais de compte de repli.
- **Une écriture produite par la machine est proposée, jamais validée seule.** Elle arrive au brouillard, marquée
  `origine` (`FACTURE_EMISE`, `ENCAISSEMENT`, `PAIE`, `AMORTISSEMENT`, `REGULARISATION`, `DEPRECIATION`,
  `PROVISION`, `CAISSE`), avec le fait source. La piste distingue « proposé par la machine » de « validé par X »
  (question Q3 d'`epics-comptabilite-2026-08-27.md`). Un fait reçu deux fois ne produit qu'une écriture.
- **Montants entiers en FCFA.** Un arrondi a une règle écrite et un cas de test.
- **Barèmes et seuils : paramètres du cabinet ou du dossier**, avec une valeur proposée marquée `a-valider-par-expert`
  quand elle vient du livre. Jamais une constante.
- **Écrans** : maquette d'abord (`prototypes/prospera-prototype.html`), validée par l'utilisateur ; chiffres calculés
  depuis le référentiel et vérifiés ; types générés depuis l'OpenAPI vivant ; gate sur le vrai backend.

## 4. Les épics

| Épic | Titre | Dépôt principal | Stories |
|---|---|---|---|
| **EPIC-270** | Le plan de comptes officiel, complet | `balance-service` (référentiels), `prospera-comptabilite-service` | 1142 |
| **EPIC-271** | Les écritures qui naissent des flux de l'entreprise | `prospera-comptabilite-service` | 1143 → 1146, FE-159 |
| **EPIC-272** | Le mois se clôt, et les travaux d'inventaire se font dans l'ordre | `prospera-comptabilite-service` | 1147 → 1152, FE-160, FE-161 |
| **EPIC-273** | La caisse et le mobile money de l'entreprise | `prospera-comptabilite-service`, `balance-service` | 1153 → 1156, FE-162 |
| **EPIC-118** | Détection d'anomalies sur le journal (existant) | `prospera-comptabilite-service` | 1157, FE-163 |
| **EPIC-120** | Piste d'audit et fichier des écritures (existant) | `prospera-comptabilite-service` | 1158, FE-163 |
| **EPIC-274** | Le dossier de révision du cabinet | `balance-service` | 1159 → 1162, FE-164 |
| **EPIC-275** | La liasse porte le résultat fiscal et la liquidation de l'impôt | `bilan-service` | 1163 |
| **EPIC-276** | Le reporting mensuel du dirigeant | `prospera-comptabilite-service` | 1164, FE-165 |

**Ordre conseillé** : 1142 d'abord (toutes les écritures produites lisent le plan complet), puis 1147 (la période close,
que lisent 1148 à 1152 et 1157), puis EPIC-271, EPIC-273, EPIC-272, EPIC-118 et 120, EPIC-274, 1163, 1164. Chaque écran
suit sa story backend.

---

## EPIC-270 — Le plan de comptes officiel, complet

### STORY-1142 : Le plan SYSCOHADA révisé complet, chargé depuis le texte officiel (8 pts)

*En tant que collaborateur, je trouve au plan du dossier les comptes officiels à quatre chiffres et leurs libellés, pour
que la TVA récupérable, les régularisations, le mobile money et l'impôt aient leur compte.*

Dépôts : `balance-service` (`scripts/referentiels/`, assets), copie à l'octet dans `bilan-service` ; régénération de
`prospera-comptabilite-service/src/plan-propre/plans-publies.json` (`scripts/plan-publie/generer.mjs`).

**Constat** (origin/dev, 26/11) : le plan SN publié (`syscohada-revise@2.3`) a **179 comptes**, surtout à 2 et 3
chiffres. Il n'a ni 445, ni 476, ni 477, ni 585, ni 121, ni 891, ni 895, ni 552. La saisie passe par la racine la plus
proche (4452 est admis sous 44), mais aucune écriture produite ne peut nommer son compte, et le libellé affiché est
celui de la racine. Le plan SMT (`smt-togo@1.0`) a le même défaut. `referentiels/plan-comptable-syscohada.json` (174
comptes) ne peut pas servir de source.

| AC | Critère |
|---|---|
| AC-1 | **Source** : le plan de comptes de l'acte uniforme relatif au droit comptable (AUDCIF, 2017, annexe), fourni par l'utilisateur (Q-1). Chaque compte porte sa source (page). Le plan du livre et le fichier 01 sont interdits comme source (test : leur liste de comptes faux du §1 n'apparaît pas avec leur libellé). |
| AC-2 | Nouvelle version `syscohada-revise@2.4` (et `smt-togo@1.1`) : tous les comptes à 2, 3 et 4 chiffres du texte, libellé officiel, classe, sens normal, nature (bilan, gestion, HAO). Les versions publiées ne se réécrivent pas ; les exercices déjà ouverts gardent la leur. |
| AC-3 | **Test de présence** : 121, 129, 131, 139, 4431, 4435, 4441, 4449, 4451, 4452, 4454, 4455, 476, 477, 491, 552, 571, 585, 6594, 7594, 6911, 7911, 891, 895 existent avec leur libellé officiel. |
| AC-4 | Les postes de la liasse ne bougent pas : la table de passage comptes → postes donne **le même poste** pour chaque compte de 2.3 et pour ses sous-comptes de 2.4 (test qui compare sur toute la liste). |
| AC-5 | Le plan publié de la comptabilité est régénéré depuis 2.4 ; un dossier ouvert sur 2.3 continue de saisir ; un dossier ouvert sur 2.4 voit les libellés officiels. |
| AC-6 | Le paquet, ses empreintes et sa copie à l'octet suivent §1.7 et §1.8 des règles (fins de ligne, `git show` pour la copie). |

---

## EPIC-271 — Les écritures qui naissent des flux de l'entreprise

Aujourd'hui, seule une facture **déposée** produit une écriture (STORY-1097). Une facture **émise** par Prospera, un
encaissement, une paie clôturée ou une dotation calculée n'en produisent aucune. Ces quatre stories ne valent que
pour un exercice tenu au journal (STORY-959) ; un exercice tenu aux cahiers ignore les faits, sans erreur.

### STORY-1143 : La facture émise et l'avoir proposent leur écriture de vente (8 pts)

*En tant que comptable de l'entreprise, je retrouve au brouillard du journal des ventes chaque facture émise par
Prospera, sans la ressaisir.*

Dépôt : `prospera-comptabilite-service`. Consomme `facturation.facture.emise@1` et `facturation.avoir.emis@1`
(`prospera-ventes-service`).

| AC | Critère |
|---|---|
| AC-1 | Une facture émise pour l'organisation d'un dossier tenu au journal ⇒ une écriture proposée au journal VE : débit du client auxiliaire (rattaché au collectif 411), crédit des produits par nature de ligne, crédit de la TVA facturée **par taux** (443x), à la date de la facture, avec son numéro comme référence de pièce. |
| AC-2 | Un avoir ⇒ l'écriture inverse, liée à la facture d'origine ; un avoir partiel ne contrepasse que son montant. |
| AC-3 | Le client auxiliaire est trouvé par l'identifiant de tiers de la vente, ou créé avec son NIF ; jamais deux auxiliaires pour un même NIF dans un dossier. |
| AC-4 | La nature de chaque ligne de vente est imputée par la table d'imputation du dossier ; une nature sans compte ⇒ écriture proposée **incomplète**, ligne marquée `IMPUTATION_A_CHOISIR`, jamais de compte de repli. |
| AC-5 | Idempotence : un même fait reçu deux fois ⇒ une seule proposition (test sur un rejeu complet du topic). |
| AC-6 | Équilibre par pièce vérifié avant le brouillard ; le total TTC de l'écriture égale celui de la facture (test sur une facture à deux taux de TVA). |

### STORY-1144 : L'encaissement affecté propose son écriture de trésorerie, lettrée avec la facture (8 pts)

*En tant que comptable, je vois chaque encaissement arriver au bon journal de trésorerie, déjà lettré avec la facture
qu'il règle.*

Dépôt : `prospera-comptabilite-service`. Consomme le fait d'encaissement affecté à une créance de
`prospera-paiement-service` (`paiement.encaissement.affecte`, à confirmer au registre de schémas avant le code).

| AC | Critère |
|---|---|
| AC-1 | Le canal décide du compte de trésorerie : banque (52x), mobile money (55x, par portefeuille, STORY-1155), espèces (57x). Le journal est celui du compte (BQ, MM, CA). |
| AC-2 | Les frais retenus par le prestataire de paiement, quand le fait les publie, sont une ligne de charge distincte (frais bancaires) ; le net encaissé reste au compte de trésorerie. Un fait sans frais publié n'en invente pas. |
| AC-3 | L'écriture proposée porte la référence de la créance ; à sa validation, le lettrage avec la facture (STORY-1143 ou 1097) est **proposé** par la règle de STORY-969 (référence puis montant). |
| AC-4 | Encaissement partiel ⇒ lettrage partiel ; trop-perçu (`paiement.creance.troppercu.constate`) ⇒ le surplus reste au client, créditeur, signalé par STORY-1148. |
| AC-5 | Encaissement annulé (`paiement.encaissement.annule`) ⇒ si l'écriture est au brouillard, elle est retirée ; si elle est validée, une contre-passation est proposée. |
| AC-6 | Idempotence et équilibre comme STORY-1143. |

### STORY-1145 : La paie clôturée propose l'écriture de paie du mois (5 pts)

*En tant que comptable, je retrouve l'écriture de paie du mois au journal des opérations diverses, tirée du livre de
paie et jamais des virements.*

Dépôts : `prospera-paie-service` (publication), `prospera-comptabilite-service` (écriture). Détaille l'item « écriture
de paie dans la comptabilité » du lot P2 d'EPIC-269. Dépend de STORY-1092.

| AC | Critère |
|---|---|
| AC-1 | La clôture d'une période de paie publie `paie.periode.cloturee@1` : dossier, période, totaux **par rubrique** du livre de paie (brut, indemnités, cotisations salariales et patronales par organisme, retenue sur salaires, avances, net). Aucun nom ni identifiant de salarié. |
| AC-2 | Une écriture globale proposée au journal OD : débit des charges de personnel (661, 663) et des charges sociales (664) ; crédit des dettes (422 net, 421 avances, 431 et 433 par organisme, 447x pour la retenue sur salaires). Les comptes viennent d'une table rubrique → compte publiée avec le référentiel social, jamais du code. |
| AC-3 | Cas de référence écrit dans le test : un salarié au SMIG et un cadre avec heures supplémentaires (mêmes cas que STORY-1092), écriture équilibrée au franc près. |
| AC-4 | Contrôle à la validation : total des charges de l'écriture = coût employeur du livre de paie ; un écart refuse la validation (`PAIE_ECART_LIVRE`). |
| AC-5 | Une période corrigée par rappel (STORY-1091 AC-4) produit son écriture dans la période du rappel, jamais une modification de la précédente. |

### STORY-1146 : Les dotations et les cessions d'immobilisations proposent leurs écritures d'inventaire (5 pts)

*En tant que comptable d'un dossier tenu au journal, je retrouve les dotations de l'exercice et les cessions
calculées par le registre, sans les recalculer.*

Dépôts : `balance-service` (publication du registre, EPIC-135), `prospera-comptabilite-service` (écritures).

| AC | Critère |
|---|---|
| AC-1 | Le registre publie, par exercice et par catégorie d'immobilisation, la dotation calculée (amortissement, dérogatoire s'il y a lieu) ; le fait porte le plan d'amortissement qui la justifie (référence et empreinte). |
| AC-2 | Écriture proposée au journal OD, à la date de clôture : débit des dotations (681x, ou 851 pour le dérogatoire), crédit des amortissements (28x) ou de l'amortissement dérogatoire (151). |
| AC-3 | Une cession ⇒ les trois écritures du livre (chap. 7), lues de la table d'imputation : dotation complémentaire jusqu'à la date de sortie ; sortie (28x et 812 contre le compte d'immobilisation) ; prix de cession (485 contre 822 et TVA collectée si la cession y est soumise). Cas de test recalculé à la main (le livre : 15 000 000, sortie au 181e jour). |
| AC-4 | Contrôle : après validation, la valeur brute et les amortissements du registre égalent les soldes des 2x et 28x du grand livre, catégorie par catégorie ; un écart est signalé par STORY-1148. |
| AC-5 | Une dotation recalculée (registre corrigé) propose l'écriture de l'écart, jamais une seconde dotation entière. |

### FE-159 : Les écritures proposées par les flux, à l'écran (5 pts)

*En tant que comptable, je vois ce qui attend ma validation, d'où cela vient, et je valide en lot ce qui est complet.*

App cabinet et app de l'entreprise : onglet « À valider » du journal. Backend : 1143 → 1146.

| AC | Critère |
|---|---|
| AC-1 | Maquette validée avant le code. |
| AC-2 | Liste filtrable par origine (facture émise, encaissement, paie, amortissement), avec le lien vers le fait source (la facture, la créance, la période de paie, le plan d'amortissement). |
| AC-3 | Une ligne `IMPUTATION_A_CHOISIR` se complète sur place ; le lot ne se valide que si chaque écriture est équilibrée et complète. |
| AC-4 | Le libellé « proposé par Prospera » reste visible après validation, avec qui a validé. |
| AC-5 | Types générés ; e2e sur vrai backend. |

---

## EPIC-272 — Le mois se clôt, et les travaux d'inventaire se font dans l'ordre

STORY-970 clôt l'**exercice**. Rien ne clôt un **mois** : une écriture peut encore être datée d'un mois dont la TVA est
déclarée. Le livre en fait la première règle (chap. 9 : clôture mensuelle à J+10, période verrouillée).

### STORY-1147 : Le mois se clôt et se verrouille (5 pts)

*En tant qu'associé, je clos un mois ; plus personne ne peut y dater une écriture sans que je le rouvre, et la
réouverture se voit.*

Dépôt : `prospera-comptabilite-service`.

| AC | Critère |
|---|---|
| AC-1 | Chaque exercice tenu au journal a ses périodes mensuelles, `OUVERTE` puis `CLOTUREE`. Clore exige le droit `comptabilite:periode:cloturer` (associé par défaut) et passe les contrôles bloquants de STORY-1148. |
| AC-2 | Valider ou proposer une écriture datée dans une période close ⇒ `422 PERIODE_CLOSE` (période nommée). Les faits de EPIC-271 datés d'une période close arrivent au premier jour ouvert, avec la date d'origine en référence. |
| AC-3 | Les mois se closent dans l'ordre ; rouvrir un mois exige un motif, rouvre aussi les mois suivants, et s'écrit à la piste. |
| AC-4 | La clôture de l'exercice (STORY-970) exige ses douze périodes closes. |
| AC-5 | La clôture d'un mois publie `comptabilite.periode.cloturee@1` (dossier, exercice, période, empreinte de la balance au dernier jour), que lisent le fiscal et le reporting (STORY-1164). |

### STORY-1148 : Les contrôles avant de clore un mois (8 pts)

*En tant que comptable, je sais avant de clore ce qui bloque et ce qui doit être expliqué.*

Dépôt : `prospera-comptabilite-service`. Lit le rapprochement de `balance-service` quand il existe.

| AC | Critère |
|---|---|
| AC-1 | **Bloquants** : écriture du mois restée au brouillard ; compte de caisse ou de monnaie électronique créditeur à une date du mois (filet de STORY-1153) ; virements internes (585) non soldés au dernier jour. |
| AC-2 | **À expliquer** (levée motivée, écrite à la piste) : compte d'attente 471 non soldé ; dettes de personnel et sociales (421, 422, 431, 447x) non soldées après la date de paiement ; client créditeur ; fournisseur débiteur ; compte de banque sans état de rapprochement du mois ou avec un écart non nul ; écart entre registre des immobilisations et grand livre (STORY-1146 AC-4). |
| AC-3 | **Cohérence de la TVA** : TVA facturée du mois rapportée au chiffre d'affaires taxable du journal des ventes, comparée au taux du paquet fiscal ; au-delà d'une tolérance paramétrée par dossier, contrôle à expliquer. |
| AC-4 | Chaque contrôle a un code, une gravité, le ou les comptes en cause et les écritures concernées (liste cliquable). Les codes et leur gravité sont une donnée versionnée, pas du code. |
| AC-5 | `GET …/periodes/{periode}/controles` sert le résultat sans rien écrire ; il sert aussi au programme de travail (STORY-1161). |

### STORY-1149 : Les régularisations de fin de période, et leur contrepassation (8 pts)

*En tant que comptable, je rattache chaque charge et chaque produit à sa période, et la contrepassation se fait seule
au premier jour de la suivante.*

Dépôt : `prospera-comptabilite-service`. Règles : `referentiels/ecritures-cloture-syscohada-revise.json`.

| AC | Critère |
|---|---|
| AC-1 | Quatre natures : facture non parvenue (charge, TVA à récupérer sur factures non parvenues, 408x) ; facture à établir (4181, produit, TVA sur factures à établir) ; charge constatée d'avance (476) ; produit constaté d'avance (477). Comptes lus de la table d'imputation, confirmés sur le plan 2.4 (STORY-1142). |
| AC-2 | Une régularisation de charge ou de produit constaté d'avance se calcule au prorata des jours, sur une période de service saisie (du, au) ; le calcul et ses dates restent sur l'écriture. Cas du livre recalculé : assurance de 1 200 000 sur douze mois, 900 000 d'avance. |
| AC-3 | À la validation, la contrepassation est **créée** au premier jour de la période suivante, liée à l'écriture d'origine ; elle se propose au brouillard de cette période. |
| AC-4 | Une facture non parvenue est rapprochée de la facture reçue ensuite (même fournisseur, montant) : la contrepassation et la facture se lettrent. |
| AC-5 | Une régularisation au 471 est refusée (`COMPTE_ATTENTE_INTERDIT`) : le livre et la doctrine du compte d'attente l'interdisent. |
| AC-6 | Les 13 cas de test du référentiel qui relèvent du Togo passent ; ceux marqués `specificitesNonTogolaises` sont écartés avec leur motif. |

### STORY-1150 : La dépréciation des créances clients par ancienneté (8 pts)

*En tant que comptable, je dépose à la clôture la dépréciation que justifie l'ancienneté de chaque créance, et la
différence avec l'existant s'écrit seule.*

Dépôt : `prospera-comptabilite-service` (lit la balance âgée de STORY-968).

| AC | Critère |
|---|---|
| AC-1 | Barème du cabinet, par tranche d'ancienneté depuis l'échéance : valeurs proposées 0 % (moins de 30 jours), 25 % (31 à 90), 50 % (91 à 180), 75 % (181 à 365), 100 % (plus d'un an), marquées `a-valider-par-expert`. Un client en procédure se déprécie au cas par cas, avec un motif. |
| AC-2 | **Base hors taxe** : la TVA d'une créance n'est pas dépréciée (le livre déprécie le TTC : erreur relevée, non reprise). Cas de test écrit avec les deux bases. |
| AC-3 | Le besoin par client est comparé à la dépréciation existante (491) : dotation complémentaire (6594) ou reprise (7594) de la seule différence, par client. Cas du livre recalculé (besoin 1 382 500, existant 950 000). |
| AC-4 | Une créance dépréciée est reclassée en clients douteux (416) par une écriture proposée. |
| AC-5 | Une créance déclarée irrécouvrable : perte (651), régularisation de la TVA facturée quand le paquet fiscal le permet, reprise de la dépréciation ; motif et pièce exigés. |
| AC-6 | Rien n'est appliqué d'office : la liste par client, le barème et le calcul sont servis, l'écriture est proposée (doctrine de STORY-504). |

### STORY-1151 : Les provisions pour risques et charges ont un registre (5 pts)

*En tant que comptable, je tiens les risques connus du client, et chaque clôture dit s'il faut doter, maintenir ou
reprendre.*

Dépôt : `prospera-comptabilite-service`.

| AC | Critère |
|---|---|
| AC-1 | Registre par dossier : nature (litige, garantie, amende, restructuration, autre), description, pièce, montant estimé, probabilité, date. |
| AC-2 | Les trois conditions (obligation à la clôture, sortie de ressources probable, estimation fiable) sont cochées une à une ; une provision ne se propose que si les trois le sont. Sinon, le risque reste au registre comme passif éventuel, pour la note annexe. |
| AC-3 | Dotation (6911, ou financière, ou HAO selon la nature, lue de la table d'imputation) contre le compte de provision (19x) ; reprise (7911 ou équivalent) quand le risque disparaît ou se réalise. Le livre impute ces dotations en 6971 « HAO » : non repris. |
| AC-4 | Chaque clôture d'exercice exige une revue de chaque ligne ouverte (maintenue, ajustée, reprise), écrite à la piste. |

### STORY-1152 : Les travaux d'inventaire, dans l'ordre, avant la centralisation (5 pts)

*En tant que comptable, je suis les travaux de fin d'exercice dans le bon ordre, et la centralisation ne part pas tant
qu'il en manque un.*

Dépôt : `prospera-comptabilite-service`. Complète STORY-970.

| AC | Critère |
|---|---|
| AC-1 | Les étapes, dans l'ordre : régularisations (1149), amortissements (1146), variation des stocks (inventaire de clôture, STORY-534), dépréciations des créances (1150), provisions (1151), résultat avant impôt, impôt de l'exercice (liquidation de `balance-service`, STORY-092), résultat net. |
| AC-2 | Chaque étape a un statut (`A_FAIRE`, `FAIT`, `SANS_OBJET` motivé) et le lien vers ses écritures. Une étape `FAIT` exige au moins une écriture validée ou un motif « aucune opération ». |
| AC-3 | La centralisation de STORY-970 refuse tant qu'une étape est `A_FAIRE` (`TRAVAUX_INVENTAIRE_INCOMPLETS`, étapes nommées). |
| AC-4 | L'écriture d'impôt (891, et 895 si c'est le minimum forfaitaire qui est dû) reprend le montant liquidé, jamais un taux appliqué au résultat (STORY-458). |

### FE-160 : La clôture du mois à l'écran (5 pts)

App cabinet et app de l'entreprise : onglet « Clôture » du journal. Backend : 1147, 1148, 1149.

| AC | Critère |
|---|---|
| AC-1 | Maquette validée avant le code. |
| AC-2 | Calendrier des mois de l'exercice (ouvert, clos, rouvert) ; clore un mois montre d'abord les contrôles : bloquants, à expliquer (motif à saisir), passés. |
| AC-3 | Les régularisations du mois : saisir, voir le calcul au prorata, voir la contrepassation prévue. |
| AC-4 | `PERIODE_CLOSE` s'affiche avec le mois et qui peut le rouvrir. |
| AC-5 | Types générés ; e2e sur vrai backend. |

### FE-161 : Dépréciations, provisions et travaux d'inventaire à l'écran (5 pts)

App cabinet. Backend : 1150, 1151, 1152.

| AC | Critère |
|---|---|
| AC-1 | Maquette validée avant le code. |
| AC-2 | Créances par tranche avec le barème du cabinet ; besoin, existant, dotation ou reprise par client ; reclassement et irrécouvrable. |
| AC-3 | Registre des risques avec les trois conditions ; revue à la clôture. |
| AC-4 | Les travaux d'inventaire en liste ordonnée ; la centralisation reste grisée tant qu'une étape manque, avec son nom. |
| AC-5 | Types générés ; e2e sur vrai backend. |

---

## EPIC-273 — La caisse et le mobile money de l'entreprise

Aujourd'hui, une caisse créditrice n'est détectée qu'**après coup**, sur la balance de la liasse
(`CAISSE_CREDITRICE`, STORY-1078). Il n'y a ni arrêté de caisse ni journal de mobile money, et le plan publié n'a pas
le compte 552. Le guichet de la microfinance (EPIC-192) est un autre sujet, non touché ici.

### STORY-1153 : Un compte de caisse ou de monnaie électronique ne devient jamais créditeur (3 pts)

*En tant que comptable, je ne peux pas valider une sortie de caisse qui dépasse ce que la caisse contenait ce jour-là.*

Dépôt : `prospera-comptabilite-service`.

| AC | Critère |
|---|---|
| AC-1 | Valider une écriture qui rend un compte 57x ou 55x créditeur **à sa date**, en tenant compte des écritures validées des jours suivants, ⇒ `422 TRESORERIE_CREDITRICE` (compte, date, solde qu'il aurait). |
| AC-2 | Le contrôle porte sur la date de l'écriture et sur toutes les dates postérieures (une entrée antidatée ne peut pas couvrir une sortie déjà passée en la déplaçant). Cas de test : sortie le 3, entrée le 5 ⇒ refus. |
| AC-3 | Un compte de banque (52x) peut être créditeur (découvert) : il est seulement présenté en trésorerie-passif, sans refus. |
| AC-4 | Les écritures déjà validées ne sont pas rejugées ; un solde créditeur hérité est signalé par STORY-1148. |

### STORY-1154 : L'arrêté de caisse, avec billetage et procès-verbal (5 pts)

*En tant que caissier, j'arrête ma caisse chaque jour devant un contrôleur ; l'écart est constaté et ne disparaît
jamais.*

Dépôt : `prospera-comptabilite-service`.

| AC | Critère |
|---|---|
| AC-1 | Arrêté d'un compte de caisse à une date : solde théorique du grand livre, comptage par coupure (table des billets et pièces en francs CFA en circulation, donnée versionnée), solde compté, écart. |
| AC-2 | Le procès-verbal est signé par deux personnes distinctes, le caissier et un contrôleur ; le même utilisateur ne peut pas tenir les deux rôles (`PV_MEME_SIGNATAIRE`). Il est figé (PDF, SHA-256) et rangé à la GED du dossier. |
| AC-3 | Un écart non nul propose une écriture en compte d'attente, à apurer par décision motivée (manquant ou excédent) ; il n'est jamais absorbé dans une autre ligne. STORY-1148 le signale tant qu'il n'est pas apuré. |
| AC-4 | Paramètres par dossier, sans valeur par défaut inventée : plafond de l'encaisse, plafond d'une dépense en espèces. Un dépassement est un contrôle à expliquer, pas un refus. |
| AC-5 | Une remise d'espèces en banque passe par le compte de virements internes (585) en deux écritures, caisse puis banque ; le 585 non soldé bloque la clôture du mois (STORY-1148). |

### STORY-1155 : Le mobile money a son journal et ses comptes, par portefeuille (5 pts)

*En tant que comptable, chaque portefeuille de monnaie électronique de l'entreprise a son compte, son journal et ses
frais.*

Dépôt : `prospera-comptabilite-service`. Dépend de STORY-1142 (compte 552).

| AC | Critère |
|---|---|
| AC-1 | Portefeuille déclaré au dossier : opérateur (Mixx by Yas, Moov Money, autre déclaré), numéro marchand, titulaire (l'entreprise, jamais un salarié). Il ouvre un sous-compte de 552 et un journal de nature `MONNAIE_ELECTRONIQUE`. |
| AC-2 | `plans-de-journaux@1` gagne la nature `MONNAIE_ELECTRONIQUE` par **ajout** (version 2 du plan SN) ; les exercices ouverts gardent leur plan (règle de STORY-961). Contrat annoncé avant le code. |
| AC-3 | Les frais de l'opérateur vont en charge (frais bancaires), les commissions perçues en produit, lus de la table d'imputation. |
| AC-4 | Un transfert du portefeuille vers la banque passe par le 585, comme une remise d'espèces. |
| AC-5 | Le numéro d'un portefeuille ne se modifie pas : il se ferme et un autre s'ouvre, à la piste (fraude décrite par le livre : changement du numéro de réception). |

### STORY-1156 : Les relevés réels de Mixx by Yas et de Moov Money (5 pts)

*En tant que comptable, j'importe le relevé que l'opérateur me donne, tel quel, et le rapprochement se fait.*

Dépôt : `balance-service` (`modules/tresorerie`, profils de relevés).

| AC | Critère |
|---|---|
| AC-1 | **Prérequis** : au moins deux relevés réels anonymisés par opérateur, fournis par l'utilisateur (Q-3). Sans eux, la story ne démarre pas : aucun format supposé. |
| AC-2 | Un profil par opérateur et par format (CSV, XLSX, PDF si l'opérateur n'en donne pas d'autre), reconnu à l'import ; colonnes de date, référence de transaction, sens, montant, frais, solde. |
| AC-3 | Les frais et commissions du relevé deviennent des lignes distinctes ; le solde de clôture du relevé est contrôlé contre le solde d'ouverture plus les mouvements. |
| AC-4 | Le rapprochement existant (type `MOBILE_MONEY`) apparie par référence de transaction d'abord ; une opération présente d'un seul côté est listée comme suspens, jamais écartée. |

### FE-162 : La caisse et le mobile money à l'écran (5 pts)

App de l'entreprise et app cabinet. Backend : 1153 → 1156.

| AC | Critère |
|---|---|
| AC-1 | Maquette validée avant le code. |
| AC-2 | Arrêté du jour : billetage, écart, signature du caissier puis du contrôleur, PV téléchargeable. |
| AC-3 | Portefeuilles : ouvrir, fermer, voir le journal, importer un relevé, voir les suspens. |
| AC-4 | `TRESORERIE_CREDITRICE` s'affiche avec le solde qu'aurait le compte et la date. |
| AC-5 | Types générés ; e2e sur vrai backend. |

---

## EPIC-118 — Détection d'anomalies sur le journal

L'épic existe depuis le 27/08 sans story. Le PO a tranché que son **moteur d'IA** est `assistant-service` (Q3bis). Cette
story pose les **règles déterministes** dans la comptabilité, sans modèle ; un score appris viendra d'`assistant-service`
dans une story à part. Décision de ce découpage, contestable (D-1157-1).

### STORY-1157 : Les anomalies du journal, par règles (8 pts)

*En tant que réviseur, je vois chaque mois les écritures qui ressemblent à une erreur ou à une fraude, avec le compte
qui la révèle.*

Dépôt : `prospera-comptabilite-service`.

| AC | Critère |
|---|---|
| AC-1 | Catalogue versionné de règles, chacune avec un code, une gravité, le compte révélateur et sa source (livre, chap. 9, tableau des 25 anomalies, et chap. 14). Premier lot : même numéro de facture fournisseur deux fois pour un même fournisseur ; même montant au même fournisseur deux fois en sept jours ; fournisseur débiteur ; client créditeur ; compte d'attente ancien de plus de huit jours ; écriture sans pièce rattachée ; dépense en espèces au-delà du plafond (STORY-1154) ; paiement à un portefeuille ou un compte bancaire ouvert dans le mois ; compensation entre un client et un fournisseur sans convention ; écriture de contre-passation d'une écriture déjà contrepassée. |
| AC-2 | Chaque anomalie liste les écritures concernées ; elle se lève par un motif, écrit à la piste, avec qui l'a levée (patron de STORY-328). |
| AC-3 | Les règles tournent à la clôture d'un mois et à la demande ; elles n'écrivent rien au journal. |
| AC-4 | Une règle a un cas positif et un cas négatif dans les tests ; une mutation sur son seuil rougit sur l'assertion. |
| AC-5 | Le catalogue publie la liste de ses règles (route de lecture), pour que l'écran et `assistant-service` lisent la même. |

---

## EPIC-120 — Piste d'audit et fichier des écritures

La piste est chaînée en SHA-256 (`src/piste/chaine.ts`), mais rien ne permet de **sortir** le journal ni de **prouver**
sa séquence à un contrôleur. L'épic existe sans story.

### STORY-1158 : Le fichier des écritures, et la preuve qu'il est entier (5 pts)

*En tant qu'associé, je remets au contrôleur fiscal le journal général de l'exercice, et il peut vérifier qu'aucune
écriture n'a été retirée.*

Dépôt : `prospera-comptabilite-service`.

| AC | Critère |
|---|---|
| AC-1 | Export du journal général d'un exercice ou d'une période close : toutes les écritures validées, dans l'ordre des numéros, une ligne par mouvement (journal, numéro, date, pièce, compte, auxiliaire, libellé, débit, crédit, lettrage, date de validation, auteur, origine). CSV et XLSX. |
| AC-2 | Le format est **le nôtre**, documenté dans un manifeste joint (colonnes, encodage, séparateur) : le Togo n'impose pas de format, et le format français n'est pas repris. Décision contestable (D-1158-1). |
| AC-3 | Le fichier est accompagné de son empreinte SHA-256 et de la tête de chaîne de la piste à la date de l'export. |
| AC-4 | `GET …/piste/verification` recalcule la chaîne et répond `INTACTE` ou la première rupture (numéro, date). Une mutation qui retire une écriture au milieu fait répondre la rupture. |
| AC-5 | Chaque export s'écrit à la piste (qui, quoi, quelle période). |

### FE-163 : Les anomalies et l'export des écritures à l'écran (3 pts)

Backend : 1157, 1158. Maquette validée ; liste des anomalies du mois, filtre par gravité, levée motivée ; export du
journal avec son empreinte ; résultat de la vérification de la piste. Types générés ; e2e sur vrai backend.

---

## EPIC-274 — Le dossier de révision du cabinet

Le cabinet révise une balance, qu'elle vienne d'un export Sage, des cahiers ou du journal. Ces quatre stories vivent
donc à côté de la balance, dans `balance-service`, et lisent le détail de la comptabilité seulement quand l'exercice
est tenu au journal.

### STORY-1159 : La revue analytique d'une balance contre N-1 (5 pts)

*En tant que réviseur, je vois les comptes qui ont bougé plus que d'habitude, et je dois expliquer chacun.*

| AC | Critère |
|---|---|
| AC-1 | Pour une balance validée et la balance de référence de N-1 (STORY-1117) : par compte, solde N, solde N-1, variation en valeur et en pourcentage. |
| AC-2 | Double seuil, paramétré par cabinet et modifiable par dossier : un pourcentage (15 % proposé) **et** un montant (seuil de signification, 0,5 % du chiffre d'affaires proposé). Un compte n'est signalé que s'il dépasse les deux. |
| AC-3 | Un compte nouveau (N-1 nul) ou disparu (N nul) au-delà du seuil en montant est signalé (le modèle 30 du livre les ignore : défaut non repris). |
| AC-4 | Chaque compte signalé exige une explication avant que la revue passe `TERMINEE` ; la revue se fige avec la version de la balance (empreinte). |

### STORY-1160 : La justification des comptes, feuille par feuille (8 pts)

*En tant que collaborateur, je prouve chaque solde de la balance ; mon associé revoit ce que j'ai préparé.*

| AC | Critère |
|---|---|
| AC-1 | Une feuille par compte ou groupe de comptes (cycles : trésorerie, clients, fournisseurs, personnel, État, immobilisations, stocks, capitaux propres, provisions, attente) : solde de la balance, éléments de justification, écart. |
| AC-2 | Éléments acceptés : pièce de la GED, relevé ou état de rapprochement, détail non lettré du compte (quand l'exercice est tenu au journal, lu de la comptabilité), tableau importé. Le total des éléments est comparé au solde ; l'écart doit être nul ou expliqué. |
| AC-3 | Statuts `A_PREPARER`, `PREPAREE`, `REVUE` ; la revue est faite par une autre personne que la préparation (`REVUE_PAR_LE_PREPARATEUR`). C'est la pratique de révision du cabinet, pas une séparation des tâches dans la tenue (D-964-7 reste intacte). |
| AC-4 | Une feuille revue se fige (empreinte) ; d'un mois ou d'un exercice à l'autre, la structure se reconduit, pas les montants. |
| AC-5 | Le taux de justification du dossier (soldes justifiés / total) se lit au portefeuille. |

### STORY-1161 : Le programme de travail de la clôture du dossier (5 pts)

*En tant qu'associé, je vois pour chaque dossier ce qui reste à faire avant le dépôt, qui le fait et pour quand.*

| AC | Critère |
|---|---|
| AC-1 | Référentiel versionné de tâches par cycle, repris des checklists du livre (clôture annuelle en 50 points, contrôles mensuels en 20) **après relecture** : chaque tâche a un libellé, un cycle, une périodicité et la preuve attendue. |
| AC-2 | Pour un dossier et un exercice : tâches instanciées, responsable, statut (`A_FAIRE`, `FAIT`, `SANS_OBJET` motivé), preuve liée (feuille de STORY-1160, revue de STORY-1159, contrôles de STORY-1148, pièce). |
| AC-3 | Les échéances se **calculent** depuis la date de clôture de l'exercice et les délais du paquet (calendrier de dépôt, STORY-539) : rien n'est écrit « 30/04 » en dur. |
| AC-4 | L'avancement du programme (fait / total) se lit au portefeuille et dans la vue de charge par collaborateur (STORY-319, quand elle sera livrée). |

### STORY-1162 : Les recommandations au client et l'évaluation du contrôle interne (5 pts)

*En tant qu'associé, je remets au dirigeant la liste de ce qu'il doit corriger, et je vérifie l'année suivante que
c'est fait.*

| AC | Critère |
|---|---|
| AC-1 | Grille d'évaluation versionnée : chaque question porte sa **réponse attendue** (Oui ou Non). Le modèle 49 compte un « Oui » à « la même personne saisit et paie ? » comme conforme : défaut non repris, cas de test qui le prouve. |
| AC-2 | Une réponse non conforme, ou une anomalie de STORY-1157, ouvre une observation : constat, risque, recommandation, responsable chez le client, échéance, statut, vérification. |
| AC-3 | La lettre de recommandations se génère (PDF figé, SHA-256, rangé à la GED) ; elle reprend les observations ouvertes de l'exercice précédent avec leur statut. |
| AC-4 | La matrice des risques de fraude n'est pas reprise telle quelle : son échelle d'efficacité du modèle 48 est fausse (une efficacité « aucune » réduit le risque de 20 %). Si une matrice est faite, elle suit risque résiduel = brut × (1 − (efficacité − 1) / 4), avec un cas de test. |

### FE-164 : Le dossier de révision à l'écran (8 pts)

App cabinet : onglet « Révision » du dossier. Backend : 1159 → 1162. Maquette validée ; revue analytique avec les
explications ; feuilles de justification (préparer, revoir) ; programme de travail avec échéances ; grille de contrôle
interne et observations ; lettre de recommandations. Types générés ; e2e sur vrai backend.

---

## EPIC-275 — La liasse porte le résultat fiscal et la liquidation de l'impôt

### STORY-1163 : Le jeu d'états produit le résultat fiscal et la liquidation de l'IS (5 pts)

*En tant que collaborateur, la liasse figée contient le passage du résultat comptable au résultat fiscal et l'impôt dû,
comme le formulaire déposé.*

Dépôt : `bilan-service` ; lecture de `balance-service` (résultat fiscal, STORY-091 ; liquidation, STORY-092).

**Constat** : `contenu-liasse-response.dto.ts` (l. 137) dit que les états `RESULTAT_FISCAL` et `LIQUIDATION_IS`,
déclarés par le référentiel, **ne sont pas produits** par la liasse.

| AC | Critère |
|---|---|
| AC-1 | Avant le code : relever comment le livrable de dépôt de `fiscal-service` remplit aujourd'hui les feuilles du résultat fiscal. S'il les tire déjà de `balance-service`, la story se réduit à les servir dans le contenu de la liasse, sans second calcul. |
| AC-2 | Le jeu d'états porte les deux états, avec les montants de `balance-service` à la date du figement : résultat comptable, réintégrations et déductions par code, déficits imputés, résultat fiscal, IS, minimum forfaitaire, impôt dû, acomptes, crédits, solde. |
| AC-3 | Le résultat comptable de l'état fiscal égale le résultat net du compte de résultat ; sinon le figement est refusé (contrôle de cohérence nommé). |
| AC-4 | Une liasse déjà figée n'est pas recalculée ; la note de la DTO est retirée. |

---

## EPIC-276 — Le reporting mensuel du dirigeant

### STORY-1164 : Le reporting du mois en une page (5 pts)

*En tant que dirigeant, je reçois au dixième jour ouvré ce que mon mois a donné, ce qui m'attend en trésorerie et ce
que je dois décider.*

Dépôt : `prospera-comptabilite-service`. Lit la balance au dernier jour du mois clos (STORY-1147 AC-5), la balance
âgée (STORY-968) et les échéances fiscales (`fiscal-service`, `GET /echeances`).

| AC | Critère |
|---|---|
| AC-1 | Cinq blocs (livre, chap. 13) : chiffres du mois et du cumul (chiffre d'affaires, marge, valeur ajoutée, excédent brut d'exploitation, résultat), comparés au même mois de N-1 quand il existe ; trésorerie disponible et à 30 et 60 jours (encaissements attendus des créances échues, décaissements des dettes échues) ; délais clients et fournisseurs constatés ; obligations fiscales du mois suivant ; faits marquants et décisions attendues (texte saisi par le cabinet). |
| AC-2 | Le reporting ne se produit que pour un mois clos ; ses chiffres se recalculent depuis la balance, jamais saisis. |
| AC-3 | PDF figé (SHA-256), rangé à la GED ; l'envoi au dirigeant passe par `prospera-notification-service` (canal choisi au dossier). |
| AC-4 | Les formules des soldes et des délais sont celles du compte de résultat de `bilan-service` et de STORY-461 ; aucun second calcul divergent (test qui compare sur une même balance). |

### FE-165 : Le reporting mensuel à l'écran (3 pts)

Backend : 1164. Maquette validée ; aperçu du mois, faits marquants à saisir, envoi, historique des envois. Types
générés ; e2e sur vrai backend.

---

## 5. Questions au PO, avec le choix retenu par défaut

| N° | Question | Choix par défaut |
|---|---|---|
| Q-1 | Quel texte officiel du plan de comptes sert de source à STORY-1142 ? | L'annexe de l'AUDCIF (JO OHADA, 2017), fournie par l'utilisateur. Sans elle, 1142 ne démarre pas. |
| Q-2 | La tenue garde-t-elle « pas de séparation des pouvoirs au niveau de l'acteur » (D-964-7), alors que le livre en fait le premier principe du contrôle interne ? | Oui. Seuls le procès-verbal de caisse (1154) et la revue de justification (1160) exigent deux personnes. Une option « valideur distinct au-delà d'un seuil » par dossier serait une story à part. |
| Q-3 | Qui fournit les relevés réels de Mixx by Yas et de Moov Money ? | L'utilisateur, anonymisés. Sans eux, 1156 ne démarre pas. |
| Q-4 | Les barèmes et seuils du livre (dépréciation, revue analytique) sont-ils proposés par défaut ? | Oui, modifiables, marqués `a-valider-par-expert`. |
| Q-5 | Une écriture produite par un flux peut-elle être validée sans humain ? | Non : toujours proposée au brouillard (doctrine de STORY-1097). |

## 6. Amendements proposés à `epics-stock-2026-08-15.md` (pas de story ici)

- **EPIC-080 ou 082** : la dépréciation des stocks par couverture, au barème du cabinet (0 % sous six mois, 10 à 25 %
  de six à douze mois, 50 % au-delà, 75 à 100 % sans mouvement depuis deux ans ou périmé), dotation 6593 contre 39x,
  reprise 7593 ; le livre propose aussi 6813 : non repris.
- **EPIC-082** : l'écart entre consommation théorique (nomenclature × production) et consommation réelle (entrées −
  stock final), alerte au-delà d'un seuil paramétré (3 % dans le livre).
