---
title: "PRD — Les services du cabinet : financement, archivage, missions, paie"
status: final
created: 2026-11-18
updated: 2026-11-18
project: prospera
verticale: cabinet d'expertise comptable (Togo, OHADA, UEMOA)
contrat_de_module: CONTRAT-DE-MODULE-2026-11-09.md (C1 → C13)
chemin: rapide (fast path) — hypothèses marquées [ASSUMPTION], décisions retenues par défaut (règle de l'utilisateur)
---

# PRD — Les services du cabinet : financement, archivage, missions, paie

## 0. Objet du document

Ce PRD cadre quatre services que l'application cabinet ne rend pas encore, et que les cabinets vendent. Il est court
par choix : il s'appuie sur ce qui existe (bilan, prévisionnel, analyse financière, GED de l'assurance, créances et
liens de paiement, base de rémunération du fiscal) et ne décrit que ce qui manque.

Il se lit avec : le contrat de module (`CONTRAT-DE-MODULE-2026-11-09.md`, C1 → C13), la spine du moteur
d'installation, le PRD fiscalité (FR-F28, FR-F80), le PRD assurance (GED, FR-170 → FR-175) et la note
`vision-ia-sectorielle-2026-11-10.md` (finançabilité des PME). Les épics et les stories, en lots de quatre, sont dans
`epics-services-cabinet-2026-11-18.md`. Le détail technique et la veille sont dans `addendum.md`.

## 1. Vision

Un cabinet du Togo nous a dit ce qui le fait vivre (message du 18/11/2026) :

- **ce qui rapporte le plus vite** : l'archivage numérique et physique des pièces des clients (une mission de 1 à
  9 mois, payée une fois, surtout pour les grandes structures), puis la mise en place de la comptabilité (une fois),
  puis le suivi mensuel de la comptabilité, de la fiscalité et des RH (récurrent) ;
- **ce qu'on lui demande le plus** : l'assistance aux prêts bancaires, puis la comptabilité.

Aujourd'hui, Prospera aide le cabinet à **produire** (balance, liasse, déclarations, comptabilité au journal). Il ne
l'aide ni à **vendre** ni à **facturer** ce qu'il produit, et il ignore deux des services qui rapportent le plus.

La vision : **le cabinet vend, produit et facture ses quatre services depuis Prospera.** Le dossier de prêt sort en
une journée parce que les chiffres sont déjà là ; les archives d'un client se numérisent, se rangent et se retrouvent ;
chaque mission a sa lettre et ses factures ; la paie du mois alimente la fiscalité sans ressaisie.

Ordre de valeur retenu par le PO (2026-11-18) : **1) financement, 2) archivage, 3) missions et facturation, 4) paie.**

## 2. Pour qui

| Qui | Ce qu'il fait ici | Accès |
|---|---|---|
| **L'associé** (`CAB_ASSOCIE`, `TENANT_ADMIN`) | vend la mission, signe la lettre, valide le dossier de financement, émet les factures | tout |
| **Le collaborateur** (`CAB_COLLABORATEUR`) | prépare le dossier de financement, la paie, les lots d'archives des dossiers de son portefeuille | son portefeuille |
| **L'archiviste du cabinet** (rôle neuf `CAB_ARCHIVISTE`) | reçoit les boîtes, numérise, indexe, range, prête et restitue | les fonds d'archives |
| **Le client du cabinet** (la PME) | fournit les pièces, signe la lettre de mission, reçoit factures et bulletins | **aucun compte au jour 1** (D-SC-9) |
| **La banque** | reçoit le dossier de financement | **destinataire d'un document, jamais utilisatrice** (D-SC-2) |
| **Money Vibes** (console, `PLATFORM_ADMIN`) | publie les référentiels (exigences bancaires, modèles de lettre de mission, référentiel social), suit la consommation d'archivage | console |

### 2.1 Ce que le cabinet veut faire (jobs)

- « Monter le dossier de prêt d'un client en une journée, chiffres justes, et savoir ce qu'il manque pour sa banque. »
- « Vendre une mission d'archivage, recevoir 40 boîtes, les numériser, et retrouver une facture de 2019 en une minute. »
- « Mettre chaque client sous lettre de mission et facturer le forfait et l'abonnement sans tableur. »
- « Faire la paie des clients chaque mois, et que la fiscalité la reprenne sans ressaisie. »

### 2.2 Parcours clés (personnages fictifs)

**UJ-1 — Le prêt de DÉMO NÉGOCE TOGO.** Kafui, associée, reçoit un appel : son client veut 25 millions de FCFA pour un
camion. Elle ouvre le dossier client, crée un **dossier de financement** (montant, objet, durée de 48 mois, banque
cible). Prospera lui montre ce que **cette** banque exige : les trois derniers exercices (deux sont dans Prospera, le
troisième est à importer), les statuts et le RCCM (déjà déposés), une attestation fiscale (manquante). Elle saisit le
**tableau d'amortissement** du prêt demandé ; le prévisionnel se recalcule ; la **capacité de remboursement** et la
**couverture du service de la dette** s'affichent avec leurs formules. Elle génère le dossier (PDF et Excel), le relit,
le fige et l'envoie elle-même à la banque. Trois semaines plus tard, elle note la réponse : accordé.

**UJ-2 — Les archives de la société de transport.** Edem, archiviste, reçoit 40 boîtes d'un grand client. Il ouvre
le **fonds d'archives** du client, enregistre la réception (boîtes, période, état), crée un lot de numérisation par
boîte. Chaque pièce numérisée est indexée selon le **plan de classement OHADA** (nature, exercice, tiers), contrôlée,
puis versée avec un numéro d'archive. Chaque boîte reçoit une **cote** (local, travée, tablette, boîte) et une
étiquette à code QR. Six mois plus tard, le client demande la facture d'un fournisseur de 2019 : Edem la retrouve par
recherche, et sait dans quelle boîte dort l'original.

**UJ-3 — La lettre de mission.** Kafui signe un nouveau client. Elle choisit dans le **catalogue du cabinet** :
« mise en place de la comptabilité » (forfait), « suivi mensuel comptable et fiscal » (abonnement), « archivage »
(forfait au volume). Prospera produit la **lettre de mission** depuis le modèle du cabinet ; le client la signe. Le
forfait est facturé à la signature ; l'abonnement émet une **facture d'honoraires** chaque mois, avec un lien de
paiement ; Kafui voit qui a payé.

**UJ-4 — La paie de novembre.** Sena, collaborateur, gère la paie des 12 salariés d'un client. Il saisit les éléments
du mois (heures supplémentaires, absence, prime). Prospera calcule chaque **bulletin** (brut, CNSS, retenue d'impôt,
net) avec les taux du **référentiel social** en vigueur, produit les bulletins numérotés et le livre de paie. La base
de rémunération du mois arrive d'elle-même dans le module fiscal.

### 2.3 Qui lit et écrit quoi (droits)

Les droits sont déclarés au manifeste de chaque module, attribués aux rôles du cabinet dans `auth-service` et lus par
`GET /moi/droits` (jamais dans le jeton). La **portée** dit sur quels dossiers clients le droit s'exerce.

| Rôle | `financement` | `ged` (archives du client) | `missions` | `paie` | Portée |
|---|---|---|---|---|---|
| `CAB_ASSOCIE` | `financement:dossier:preparer`, `:valider`, `:consulter` | `ged:fonds:gerer`, `ged:piece:consulter`, `ged:sensible:consulter` | `missions:catalogue:gerer`, `missions:mission:gerer`, `missions:facture:emettre`, `missions:encaissement:saisir`, `missions:consulter` | `paie:salarie:gerer`, `paie:periode:preparer`, `paie:periode:cloturer`, `paie:consulter` | tous les dossiers du cabinet |
| `CAB_COLLABORATEUR` | `:preparer`, `:consulter` | `ged:piece:consulter` | `missions:consulter` | `paie:salarie:gerer`, `paie:periode:preparer`, `paie:consulter` | son portefeuille |
| `CAB_ARCHIVISTE` (neuf) | — | `ged:fonds:gerer`, `ged:lot:numeriser`, `ged:piece:indexer`, `ged:versement:verser`, `ged:physique:gerer`, `ged:piece:consulter`, `ged:sensible:consulter` | — | — | les fonds d'archives de tous les dossiers du cabinet ; **rien d'autre** du dossier |

- **Natures sensibles** (bulletins de paie, contrats de travail, pièces médicales, pièces d'identité) : lisibles
  seulement avec `ged:sensible:consulter` ; leur texte lu **n'entre pas** dans la recherche plein texte (seules leurs
  métadonnées sont cherchables) ; l'OCR reste interne au service.
- Un collaborateur hors portefeuille reçoit 404 ; l'archiviste ne lit ni la paie, ni les missions, ni le financement.

### 2.4 Hors public au jour 1

Le client du cabinet n'a pas de compte (pas de portail), et la banque ne se connecte pas. Les deux viendront avec le
portail client (interrupteur `portail-client` de `missions`) et le « passeport de santé financière » de la vision.

## 3. Vocabulaire

| Terme | Sens ici |
|---|---|
| **Dossier de financement** | la demande de prêt d'un client du cabinet à une banque : projet, montant, durée, banque, pièces, chiffres, état |
| **Exigences bancaires** | ce qu'une banque demande (pièces, nombre d'exercices, ratios regardés) ; référentiel tenu par Money Vibes |
| **Couverture du service de la dette** (DSCR) | flux disponible pour la dette / échéances de l'année (capital et intérêts) |
| **Fonds d'archives** | l'ensemble des archives d'un client confiées au cabinet. ⚠️ À ne pas confondre avec « archiver un dossier », qui ferme un dossier client (existe déjà) |
| **Versement** | l'entrée d'un lot de pièces dans le fonds, avec son bordereau et son numéro `ARC-` |
| **Cote** | l'adresse physique d'une boîte : local, travée, tablette, boîte, rang |
| **Mission** | ce que le cabinet s'engage à faire pour un client, sous une lettre de mission |
| **Prestation** | une ligne du catalogue du cabinet : forfait, abonnement ou au volume |
| **Facture d'honoraires** | la facture du cabinet à son client ; le cabinet est le créancier |
| **Référentiel social** | les taux et barèmes de la paie (CNSS, AMU, retenue d'impôt sur salaires, SMIG), versionnés et sourcés |
| **Bulletin** | le bulletin de paie mensuel d'un salarié, numéroté et figé |

## 4. Les fonctionnalités

Chaque service est un **module installable** (contrat C1 → C13) : manifeste, garde de module, droits hors du jeton
(`GET /moi/droits`), état publié, cloisonnement par portefeuille, piste d'audit. Les exigences communes sont au §5.

### 4.1 Le dossier de financement bancaire (module `financement`, M49 proposé)

Porté par `bilan-service` (il a déjà les états, le prévisionnel et l'analyse). Verticale : cabinet.

#### FR-1 : Un dossier de financement par demande de prêt

Le cabinet crée, pour un dossier client, un **dossier de financement** : objet du prêt, montant demandé, durée,
différé, type (investissement, trésorerie, crédit-bail), banque cible, garanties proposées (texte), exercice de
référence. Il passe par les états `BROUILLON` → `PRET` → `REMIS` → `ACCORDE` | `REFUSE` | `ABANDONNE`. Un client peut
en avoir plusieurs.

| De | Vers | Droit | Condition |
|---|---|---|---|
| — | `BROUILLON` | `preparer` | — |
| `BROUILLON` | `PRET` | `valider` | aucune exigence bloquante manquante (FR-2) |
| `PRET` | `BROUILLON` | `valider` | motif |
| `PRET` | `REMIS` | `valider` | une version figée existe (FR-5) ; date de remise |
| `REMIS` | `ACCORDE` / `REFUSE` | `valider` | `ACCORDE` : montant, taux, durée obtenus ; `REFUSE` : motif |
| `BROUILLON`, `PRET`, `REMIS` | `ABANDONNE` | `valider` | motif |

Toute autre transition est refusée (`409 TRANSITION_INTERDITE`, états de départ et d'arrivée en `details`).
- Un dossier `REMIS` ne se modifie plus : une correction crée une nouvelle version (la précédente reste lisible).

> **Amendé le 21/11 (parcours réel, maquette de FE-140 validée, PR #741) :**
> - la **banque cible unique** devient **1 à 3 banques** par demande, chacune avec son suivi (FR-1c, FR-1e) ;
> - le **texte libre des garanties** devient des garanties structurées (FR-1d) ;
> - **`REMIS`, `ACCORDE` et `REFUSE` du dossier ne se posent plus à la main** : ils suivent le suivi de chaque banque (première
>   remise ⇒ `REMIS` ; choix du client ⇒ `ACCORDE` ; toutes les banques refusent ⇒ `REFUSE`) ; la transition manuelle répond `409 TRANSITION_PAR_BANQUE` ;
> - un état de plus : **`DECAISSE`** (final), après `ACCORDE` (FR-1e) ;
> - `BROUILLON` → `PRET` exige aussi un projet complet (FR-1b) ;
> - décisions de l'utilisateur (20-21/11), inscrites comme telles : **pas de consentement BIC** ; les pièces dépendent du **profil** de l'entreprise (société
>   établie, jeune société) et de la **relation** avec chaque banque (déjà client à compte mouvementé, nouveau client).

#### FR-2 : Les exigences de la banque, et ce qu'il manque

Le dossier lit les **exigences de la banque cible** (FR-17) : pièces, nombre d'exercices historiques, ratios
regardés. Il affiche pour chaque exigence : **fournie** (avec sa source), **manquante**, ou **sans objet** (motif).
Une banque inconnue prend les exigences « banque générique UEMOA ».

- Une pièce déjà déposée dans le dossier client (statuts, RCCM, carte CFE…) est reconnue sans nouveau dépôt.
- Les exercices historiques se lisent des états validés du bilan ; un exercice absent est « manquant » avec l'action proposée (importer la balance).
- Passer `PRET` est refusé tant qu'une exigence marquée bloquante manque (`EXIGENCES_BANCAIRES_INCOMPLETES`, avec la liste).

> **Amendé le 21/11 :** la liste dépend du **profil** et de la **relation avec chaque banque** (FR-17 amendé) ; six statuts (fournie, manquante
> bloquante ou facultative, expirée selon la validité, sans objet avec motif, « déjà à la banque », « fournie par la banque ») ; pièces
> conditionnelles (pro forma si matériel ; contrats ou lettres d'intention si le chiffre d'affaires d'une hypothèse est « à justifier » ;
> plan de trésorerie mensuel si jeune société ; lettre d'affirmation du dirigeant toujours) ; **« demander au client les pièces
> manquantes »** (message prêt, par banque) ; **« voir » chaque pièce**. **Toute action « déposer » est un vrai téléversement**
> (sélecteur de fichier et glisser-déposer, types et taille nommés, refus nommés, progression et annulation) et **tout document généré,
> comme tout fichier déposé, se voit dans l'application avant tout téléchargement** (exigence de l'utilisateur, 21/11).

#### FR-3 : Le tableau d'amortissement de chaque emprunt

Le cabinet saisit chaque emprunt — **le prêt demandé et les dettes existantes** — : capital, taux, durée, différé,
périodicité, mode (échéances constantes ou amortissement constant), date de début. Prospera calcule l'échéancier
(capital, intérêts, capital restant dû) et **alimente le prévisionnel** : charges financières et remboursements par
exercice, au lieu de l'encours moyen agrégé d'aujourd'hui.

- **Convention** : le taux saisi est nominal annuel ; le taux périodique est le taux annuel divisé par le nombre de
  périodes de l'année (12 en mensuel). Échéance constante = C × i / (1 − (1 + i)^−n). Les intérêts de chaque période
  sont arrondis au franc (demi vers le haut) ; l'échéance est arrondie au franc ; l'écart cumulé se reporte sur la
  **dernière** échéance, de sorte que la somme du capital remboursé égale exactement le capital emprunté.
- **Valeur de référence** : 25 000 000 FCFA, 12 % l'an, 48 mois, échéances constantes, sans différé ⇒ mensualité
  **658 346**, dernière échéance **658 339**, intérêts totaux **6 600 601**, total remboursé **31 600 601**.
- Un différé paie les intérêts seulement pendant sa durée ; la durée d'amortissement court après.

#### FR-4 : Les indicateurs que la banque regarde

Sur le réel (3 exercices) et sur le prévisionnel (3 ans), le dossier affiche, **avec leur formule et leurs sources** :
les 19 indicateurs déjà calculés (structure, liquidité, rentabilité, exploitation), plus : **couverture du service de
la dette** (DSCR), **capacité d'endettement résiduelle**, **plan de financement** (emplois et ressources, par année),
**autonomie financière**. Les seuils d'alerte viennent des exigences de la banque (FR-17) ou, à défaut, des seuils
sectoriels du paquet.

- Un indicateur incalculable (division par zéro, exercice manquant) dit pourquoi ; il n'affiche jamais 0.

#### FR-5 : Le dossier assemblé, figé, remis par le cabinet

Prospera assemble **un document** pour la banque : présentation de l'entreprise (identité du dossier client),
objet et montant, historique sur 3 exercices (bilan, compte de résultat, tableau des flux), analyse et indicateurs,
prévisionnel sur 3 ans avec le scénario retenu, plan de financement, échéancier, garanties, liste des pièces jointes.
Formats : **PDF** (le dossier) et **Excel** (les tableaux).

- Générer fige une version : contenu, hypothèses et empreinte SHA-256 ; la version figée se retélécharge à l'identique.
- Le document porte « préparé par <cabinet> » et la date ; aucun chiffre n'est recalculé après le figement.
- Le cabinet remet le document lui-même (e-mail, papier) : **aucune transmission à la banque par Prospera** (D-SC-2).

> **Amendé le 21/11 :** **un dossier par banque** (ses exigences, sa relation, son nom de fichier), avec une **synthèse d'une page** en tête
> (qui, projet, garanties retenues, couverture centrale et prudente, points forts et points de vigilance **générés par des règles, sans IA**),
> le **scénario prudent en annexe**, la **mention fixe de responsabilité du cabinet** en pied de chaque page, **PDF et Excel**, **aperçu
> avant téléchargement**. Générer est permis avant `PRET` ; figer exige les exigences bloquantes remplies ; une modification après le
> figement périme la version.

#### FR-6 : Le prévisionnel et les scénarios du dossier

Le dossier de financement **choisit** un jeu d'hypothèses du prévisionnel existant (EPIC-013) comme scénario retenu, et
peut en comparer deux (prudent, central). Les emprunts de FR-3 s'y injectent. Rien n'est dupliqué : le prévisionnel
reste celui du bilan.

#### FR-1b : Le projet financé *(ajouté le 21/11)*

Le dossier porte le **projet** : une ou plusieurs **factures pro forma** (matériel, fournisseur, numéro, date, validité, montants HT,
TVA 18 %, TTC, fichier joint), des **frais annexes** facultatifs, la **date d'acquisition**, l'**apport** du client. Le **coût** est la
somme des pro forma **TTC** (et des frais cochés) ; le **montant demandé** est le coût moins l'apport, calculé et modifiable. Le pro forma
est **obligatoire et bloquant** pour un investissement ou un crédit-bail (un pro forma expiré bloque), sans objet pour un crédit de
trésorerie. **Valeur de référence** : pro forma 31 250 000 TTC (HT 26 483 051 + TVA 4 766 949), apport 6 250 000 (20 %), demandé 25 000 000.
Le prêt demandé est proposé d'office comme premier emprunt (FR-3). Le fichier du pro forma se **téléverse** et se **voit** (FR-2).

#### FR-1c : Plusieurs banques, la relation, le profil *(ajouté le 21/11)*

Une demande se remet à **une à trois banques** ; la banque inconnue prend la banque générique UEMOA. Pour chaque banque, la **relation** :
déjà client à compte mouvementé, ou nouveau client (déduite de la comptabilité quand elle se voit, modifiable). Le **profil** de
l'entreprise : société établie ou jeune société, déduit de sa date de création et du nombre d'exercices validés, modifiable avec motif.

#### FR-1d : Les garanties saisies, la décote, la couverture retenue *(ajouté le 21/11)*

Le cabinet **saisit** les garanties (hypothèque, gage de matériel, nantissement du fonds de commerce, caution, dépôt à terme, fonds de
garantie, assurance avec délégation, autre) : garant ou bien, valeur déclarée (ou part du prêt couverte), **décote** de la banque (proposée
selon le type, modifiable), valeur retenue, pièce justificative (téléversée, vue). Rien n'est prédéfini ni ajouté d'office. Deux
couvertures : **déclarée** et **retenue** (la retenue compte). **Référence** : déclarée 275 %, retenue 197 % pour un prêt de 25 000 000.

#### FR-1e : Le suivi banque par banque, les conditions, le décaissement *(ajouté le 21/11)*

Chaque banque a son suivi : remise (date, interlocuteur), compléments demandés et fournis, passage en comité, **réponse** (accord, refus,
contre-proposition) avec l'**offre détaillée** (montant, taux, durée, différé, frais, assurance, garanties exigées, conditions préalables).
Le cabinet **compare** les offres sur le **coût total** (intérêts + frais + assurance) et le **coût pour 1 000 000 empruntés** ; le client
**choisit**, les autres banques passent « non retenues ». Les **conditions préalables** de l'offre retenue se lèvent une à une (avec pièce) ;
le **décaissement** reste bloqué tant qu'une condition est ouverte, puis se note (date, montant, première échéance).
**Référence** : Orabank Togo 22 000 000 à 11,5 %, 48 mois, coût total 6 033 992 ; BOA Togo 20 000 000 à 12 %, 36 mois, coût total 4 394 306.

#### FR-5b : Les documents générés du dossier *(ajouté le 21/11)*

Prospera génère, **pré-remplis** avec les données du dossier : la **note de présentation** (société établie), le **plan d'affaires** (jeune
société, avec un questionnaire de huit questions), la **lettre de demande**, la **lettre d'affirmation** du dirigeant, la **décision des
associés**, l'**engagement de domiciliation**. Blocs « à compléter » avec compteur. Chaque document se **voit** dans l'application, se
télécharge en **Word (modifiable)** et en **PDF** ; la version modifiée **se téléverse** et remplace la générée, **les deux restant dans
l'historique** (date, auteur). Les textes proposés sont des **modèles remplis avec les données, sans IA** (l'option d'une aide par IA est
à décider par l'utilisateur : PRD assistant IA, FR-IA07 et FR-IA09).

#### FR-6b : Les aides à la décision et la trésorerie mensuelle *(ajouté le 21/11)*

- **Hypothèses suggérées** depuis l'historique validé, avec leur source, et « créer la projection depuis l'historique ».
- **Crédibilité** des hypothèses face à l'historique (repères vert, ambre, rouge ; des avertissements, rien ne bloque).
- **Montant soutenable** : le plus grand prêt, au millier près, qui garde une couverture ≥ 1,20 chaque année et des dettes financières
  ≤ capitaux propres la 1re année (référence : 20 492 000 pour une demande de 25 000 000).
- **Simulation d'un différé**, sans rien enregistrer ; **scénario prudent** côte à côte (réutilise la comparaison du prévisionnel).
- **Trésorerie mensuelle** de la 1re année (12 mois depuis la date d'acquisition), **exigée pour une jeune société**, dont le solde de
  décembre égale la trésorerie du plan annuel au franc près (référence : 765 910 à l'ouverture, 2 772 076 en décembre).

### 4.2 L'archivage numérique et physique (module `ged` ouvert au cabinet, M07)

Porté par `document-service`, qui a déjà la GED de l'assurance (lots, contrôle, versement `ARC-`, scellé, versions).
**On ouvre cette GED au cabinet ; on n'en crée pas une deuxième** (D-SC-4).

#### FR-7 : Un fonds d'archives par client

Le cabinet ouvre un **fonds d'archives** pour un dossier client (pas seulement un dossier sinistre) : période
couverte, nature des documents attendus, volumétrie annoncée (boîtes, pages), mission rattachée (FR-13). La pièce et le
versement de la GED se rattachent à ce fonds.

- Le numéro d'archive devient `ARC-AAAA-<code client>-NNNNN` pour le cabinet (le volet CORP/MATL reste à l'assurance).
- Les pièces déjà déposées dans le dossier client (constitution, pièces comptables) **apparaissent** dans le fonds par
  référence, en lecture. **Les verser** au fonds les copie dans la GED avec leur empreinte (le scellé porte sur les
  octets versés) ; l'original du dépôt reste où il est, lié à sa copie versée.

#### FR-8 : Le plan de classement OHADA

Chaque pièce porte : nature (facture d'achat, facture de vente, relevé bancaire, bulletin de paie, contrat, statuts,
déclaration fiscale, pièce de caisse…), exercice, date, tiers, montant (facultatif), référence. Le plan est un
**paramètre** du module, versionné, avec un plan par défaut OHADA ; le cabinet peut ajouter des natures.

#### FR-9 : Numériser par lots, contrôler, verser

Le circuit existant s'applique au cabinet : lot de numérisation, indexation (assistée par la lecture du document
quand elle existe), contrôle qualité humain obligatoire, versement avec bordereau et scellé. Les rôles sont ceux du
cabinet : `CAB_ARCHIVISTE` numérise, indexe, verse ; l'associé et le collaborateur du portefeuille consultent.

#### FR-10 : L'archive physique

Le cabinet gère les **originaux papier** :

- réception d'archives d'un client (bordereau de réception : boîtes, période, état) ;
- **cote** de chaque boîte (local, travée, tablette, boîte, rang) et **étiquette** à code QR ;
- **sortie et retour** d'une boîte ou d'une pièce, avec motif, emprunteur et date de retour prévue ; alerte au retard ;
- **inventaire** (récolement) daté, écarts nommés ;
- **restitution** au client en fin de mission, avec bordereau signé.

Un original papier est relié à sa copie numérique ; on sait toujours où est l'original.

#### FR-11 : Retrouver

Recherche dans un fonds par nature, exercice, tiers, date, montant, référence et **texte lu** du document (sauf le
texte des natures sensibles, §2.3). Le résultat
donne la copie numérique et la cote de l'original. Les durées de conservation (10 ans pour les pièces comptables en
OHADA, à confirmer sur le texte de l'AUDCIF) s'affichent par pièce ; **aucune destruction automatique** (lot suivant :
destruction proposée puis visée).

### 4.3 Les missions et la facturation du cabinet (module `missions`, M39)

Porté par un **service neuf** `prospera-cabinet-service` (dépôt à créer par l'utilisateur). Le cabinet est **le
créancier** : l'argent de ses honoraires va au cabinet, jamais à Money Vibes (règle SM-1).

#### FR-12 : Le catalogue des prestations du cabinet

Le cabinet tient son catalogue : prestations au **forfait** (mise en place de la comptabilité, dossier de financement,
archivage au forfait), à l'**abonnement** (suivi mensuel comptable, fiscal, paie ; périodicité mensuelle,
trimestrielle, annuelle) et **au volume** (archivage à la page ou à la boîte, bulletins à l'unité). Prix HT en FCFA,
TVA applicable (18 % par défaut, paramètre), libellé de facture.

#### FR-13 : La lettre de mission

Pour un dossier client, le cabinet compose une **mission** : prestations choisies, prix, date d'effet, durée,
périmètre, responsable. Prospera produit la **lettre de mission** depuis le modèle du cabinet (dérivé du modèle de
base publié par Money Vibes, FR-18). États : `BROUILLON` → `ENVOYEE` → `SIGNEE` → `TERMINEE` | `RESILIEE`.

- La signature au jour 1 : la lettre signée (scan) est déposée, **ou** le client l'accepte par un **lien
  d'acceptation** [ASSUMPTION] :
  - le lien est envoyé au **signataire déclaré** de la mission (nom, fonction, e-mail ou WhatsApp) ; un **code à six
    chiffres** part sur un second canal (SMS au numéro du signataire) et doit être saisi ;
  - usage unique, **expiration à 7 jours** (paramètre), annulable par le cabinet ; un lien transféré ne sert à rien
    sans le code ;
  - la page montre la lettre (PDF figé) et un seul bouton ; aucun compte, aucune autre donnée du cabinet (ce n'est pas
    un portail) ;
  - l'acceptation enregistre : signataire déclaré, date et heure, empreinte de la lettre, canal du code.
- Une lettre signée ne se modifie plus : un avenant crée une nouvelle version.
- La mission signée **s'ajoute** aux preuves du mandat du dossier client ; l'attestation existante (`MANDAT_ATTESTE`)
  reste valable et n'est pas remplacée.

#### FR-14 : Les factures d'honoraires

Le cabinet émet des **factures** : lignes (prestation, quantité, prix unitaire HT, taux de TVA), totaux, PDF. Une
facture émise ne se supprime ni ne se modifie : on émet un **avoir**. Le forfait se facture à la signature ou au
jalon ; l'abonnement émet une facture à chaque échéance (brouillon à valider ou émission directe, au choix du
cabinet).

- **Numérotation** [ASSUMPTION] : une série par cabinet **et par année civile**, `HON-AAAA-NNNNNN`, repartant à
  000001 le 1er janvier, continue et sans trou dans l'année. Le numéro est attribué **à l'émission**, de façon
  atomique (deux émissions simultanées n'ont jamais le même numéro, aucune n'en saute un) ; un brouillon n'a pas de
  numéro. Les avoirs ont leur propre série `AVO-AAAA-NNNNNN` et citent la facture qu'ils corrigent.
- **Calcul** : montant de ligne = quantité × prix unitaire, entier ; TVA calculée **par ligne**, arrondie au franc
  (demi vers le haut) ; totaux = sommes des lignes.
- **Mentions** : nom, adresse, NIF et RCCM du cabinet ; nom, adresse et NIF du client ; numéro, date d'émission,
  date d'échéance, détail HT/TVA/TTC par taux, mission de rattachement.

#### FR-15 : L'encaissement

Chaque facture émise devient une **créance** dans `paiement-service` (créancier et bénéficiaire : le cabinet ;
payeur : le client) : saisie d'un paiement reçu (espèces, chèque, virement), lien de paiement, relance. Le cabinet
voit, par client et au total : facturé, encaissé, reste dû, en retard.

- **L'argent va au cabinet, jamais à Money Vibes (SM-1)** : la créance porte l'organisation du cabinet comme
  bénéficiaire ; un **lien de paiement** n'est proposé que si le cabinet a déclaré **son propre compte
  d'encaissement** (PI-SPI ou FedaPay) ; sans compte, seule la saisie manuelle est possible. Aucun compte de Money
  Vibes ne peut être choisi (test).
- **Paiement partiel** : il réduit le reste dû ; la facture est `PARTIELLEMENT_PAYEE` jusqu'au solde.
- **Avoir** : il réduit la créance de la facture corrigée ; un avoir supérieur au reste dû laisse un **crédit** du
  client, imputé sur sa prochaine facture (jamais remboursé par Prospera).

#### FR-16 : Le temps de la mission (lot suivant)

Le suivi du temps passé par mission et la rentabilité par client viennent au lot suivant ; le jour 1 compte les
prestations, pas les heures.

### 4.4 La console Money Vibes

#### FR-17 : Les exigences des banques

La console tient le **référentiel des exigences bancaires** : la liste des banques (UEMOA, d'abord le Togo), et pour
chacune les pièces exigées (bloquantes ou non), le nombre d'exercices, les ratios regardés et leurs seuils. Une
« banque générique UEMOA » sert par défaut. Chaque modification publie une **version datée** ; un dossier de
financement garde la version lue à sa création.

- Le contenu initial vient de la pratique bancaire connue [ASSUMPTION] et **doit être relu par une banque** avant la première vente.

> **Amendé le 21/11 :** le référentiel porte aussi les **exigences par profil** (société établie, jeune société) **et par relation** (déjà client,
> nouveau client), leurs **validités**, les **décotes par défaut des garanties**, et les **seuils et paramètres** (couverture 1,20, autonomie 33 %,
> repères d'apport et de couverture, taux indicatif, assurance 0,30 %). Voir AP-50 amendée.

#### FR-18 : Les modèles de lettre de mission

La console publie un **modèle de base** de lettre de mission (versionné), que chaque cabinet copie et adapte. Aucun
modèle de l'ordre (ONECCA) n'a été trouvé : le modèle de base le dit.

#### FR-19 : L'archivage vu par Money Vibes

La console voit, par cabinet : fonds ouverts, pages numérisées, volume stocké, boîtes cotées, et le quota de
l'offre. Le dépassement d'un quota alerte (il ne bloque pas la consultation).

#### FR-20 : Le référentiel social

La console publie le **référentiel social Togo** versionné et daté (`social-tg@2026.1`) : taux CNSS par branche
(employeur, salarié), plafond s'il existe, cotisation AMU, barème de la retenue d'impôt sur salaires, SMIG,
abattements, **majorations des heures supplémentaires** (par tranche, nuit, jour férié), durée légale du travail. **Chaque valeur porte sa source** (texte, article, date) ; une valeur sans source est publiée « à
compléter » et le calcul qui en dépend est refusé (FR-23). Les règles de publication sont celles du paquet fiscal
(octets, empreinte, une version publiée ne se réécrit jamais).

### 4.5 La paie (module `paie`, M41)

Porté par un **service neuf** `prospera-paie-service` (dépôt à créer par l'utilisateur). **Décision du PO du
2026-11-18 : la paie entre dans Prospera pour le cabinet** ; elle renverse FR-F28 du PRD fiscalité (« la paie est hors
Prospera »).

#### FR-21 : Les salariés d'un client

Pour un dossier client employeur : la fiche de chaque salarié (identité, numéro CNSS, date d'entrée, contrat,
catégorie, salaire de base, situation de famille pour l'impôt, mode de paiement). Données personnelles protégées
(§5) : chiffrées au repos, lues seulement dans la portée du dossier (§2.3). **Aucune donnée de la fiche** (numéro
CNSS, contrat, situation de famille, coordonnées) ne va au module fiscal : seule la base de rémunération y va (FR-24).

#### FR-22 : Les éléments du mois

Pour une période (`AAAA-MM`) : heures supplémentaires, absences, primes, avantages, avances, retenues. Saisie ou import
d'un fichier (gabarit fourni). Une période `CLOTUREE` ne se modifie plus ; une correction passe par un rappel le mois
suivant.

#### FR-23 : Le bulletin

Prospera calcule chaque bulletin : brut, assiette, cotisations salariales et patronales, retenue d'impôt sur
salaires, net à payer, coût employeur — **avec le référentiel social de la période**, jamais une valeur écrite dans le
code. Un référentiel incomplet pour un élément nécessaire rend `REFERENTIEL_SOCIAL_INCOMPLET` (élément nommé), jamais
une approximation (FR-F80). Le bulletin est numéroté `BUL-AAAA-MM-<code client>-NNNN` (une série par client et par
période), figé (PDF + empreinte), et le **livre de paie** du mois se télécharge. Bulletins et livre de paie se
conservent au moins 10 ans [ASSUMPTION, à confirmer sur le code du travail].

#### FR-24 : La fiscalité reprend la paie

À la clôture de la période, la **base de rémunération** de chaque bénéficiaire (STORY-345) est écrite dans le module
fiscal avec la source `IMPORT` et la référence de la période de paie : aucune ressaisie, aucune donnée personnelle de
plus que ce que la base porte déjà (AD-21).

- **Ce qui part** : type de bénéficiaire, montants par rubrique, période, et l'**identifiant de bénéficiaire du
  fiscal** (créé au premier envoi, puis gardé par la paie en correspondance avec le salarié). Ni nom, ni numéro CNSS,
  ni contrat.
- Le rejeu d'une clôture ne crée aucun doublon (même période, même bénéficiaire : même version).

#### FR-25 : Les déclarations sociales (lot suivant)

La déclaration CNSS mensuelle (état nominatif, total, échéance), l'écriture de paie dans la comptabilité et les
ordres de virement des salaires viennent au lot suivant.

## 5. Exigences transverses

- **NFR-1 — Contrat de module.** Chaque module (`financement`, `ged` étendu, `missions`, `paie`) a son manifeste
  (C1), sa garde, ses droits déclarés et attribués (`CAB_ASSOCIE`, `CAB_COLLABORATEUR`, `CAB_ARCHIVISTE`), sa
  lecture de l'état publié, ses vérifications d'installation (C13) et ses routes de démonstration si le jeu du cabinet
  les porte.
- **NFR-2 — Cloisonnement.** Tout se lit par dossier client et dans la portée du collaborateur (portefeuille) ; hors
  portée : 404.
- **NFR-3 — Montants.** Entiers en FCFA, aucun flottant, arrondi écrit une fois et testé par une valeur de
  référence.
- **NFR-4 — Documents figés.** Tout document remis à un tiers (dossier de financement, lettre de mission, facture,
  bulletin, bordereau) est figé avec une empreinte SHA-256 et se retélécharge à l'identique.
- **NFR-5 — Piste d'audit.** Toute écriture est journalisée (qui, quand, quoi, avant et après), et la piste se lit.
- **NFR-6 — Données personnelles.** Loi togolaise n° 2019-014 : salariés et pièces chiffrés au repos, accès tracé,
  pas de donnée nominative vers l'IA commune ni vers un service qui n'en a pas besoin.
- **NFR-7 — Conservation.** Les pièces et livres comptables se conservent au moins 10 ans (OHADA) ; rien ne se
  supprime sans procédure visée (lot suivant).
- **NFR-8 — Référentiels sourcés.** Exigences bancaires, modèles de lettre et référentiel social sont versionnés,
  datés, publiés par la console ; un objet garde la version lue à sa création.
- **NFR-9 — Écrans.** Maquette d'abord (`prototypes/prospera-prototype.html`, validée par l'utilisateur) ; types
  générés depuis l'OpenAPI vivant ; gate d'intégration sur vrai backend en fin d'épic. La console a son propre
  prototype (AP-30).

## 6. Non-objectifs (jour 1)

- Aucune transmission électronique à une banque, aucun accès banque, aucune **note de finançabilité** (vision 2027,
  module Risque).
- Aucun portail du client final (le client n'a pas de compte).
- Aucune signature électronique qualifiée.
- Aucun virement des salaires, aucune télédéclaration CNSS ou OTR.
- Aucune destruction d'archives.
- Aucun suivi du temps passé.

## 7. Périmètre : cinq lots de quatre stories

| Lot | Service | Contenu |
|---|---|---|
| **F1** | Financement | le dossier et ses états (FR-1) ; le tableau d'amortissement, les indicateurs de dette, le plan de financement et le scénario retenu (FR-3, FR-4, FR-6) ; le référentiel des exigences bancaires (console, FR-17) ; l'écran du dossier |
| **F2** | Financement | les pièces exigées et la complétude (FR-2) ; le dossier assemblé et figé (FR-4, FR-5) ; les écrans de l'analyse et de l'assemblage |
| **G1** | Archivage | la GED ouverte au cabinet ; l'archive physique ; la consommation vue par la console ; l'écran des archives du client |
| **M1** | Missions | catalogue, mission et lettre ; factures, avoirs et encaissement ; les modèles de lettre (console) ; l'écran des missions et factures |
| **P1** | Paie | le socle et les salariés ; le bulletin et la reprise fiscale ; le référentiel social (console) ; l'écran de la paie du mois |

**Lots suivants nommés** (non détaillés) : F3 (partage consenti avec la banque), G2 (conservation, destruction visée,
restitution numérique), M2 (temps passé, rentabilité, portail client), P2 (déclaration CNSS, écriture de paie,
virements).

Prérequis frontend : les écrans du prévisionnel déjà écrits (FE-035 hypothèses, FE-036 projection et scénarios) sont
tirés avant le lot F2.

## 8. Indicateurs de réussite

| Indicateur | Cible à 3 mois d'usage | Contre-indicateur |
|---|---|---|
| Dossiers de financement figés par cabinet et par mois | ≥ 2 | dossiers refusés par la banque pour pièce manquante (doit tendre vers 0) |
| Délai de préparation d'un dossier de financement | ≤ 1 jour ouvré quand les exercices sont dans Prospera | dossiers figés puis refaits (versions > 2) |
| Pages versées dans les fonds d'archives | suivi mensuel | pièces versées sans contrôle qualité (doit être 0) |
| Part des clients sous lettre de mission signée | ≥ 80 % des dossiers actifs | avoirs émis / factures émises |
| Bulletins produits par mois | suivi mensuel | bulletins corrigés par rappel |

## 9. Décisions retenues par défaut (contestables)

- **D-SC-1** — `financement` est un module neuf (M49 proposé) porté par `bilan-service`, qui a déjà les états, le
  prévisionnel et l'analyse.
- **D-SC-2** — Le cabinet prépare, Prospera fige, **le cabinet remet** : aucune transmission ni compte banque au jour
  1 ; la note de finançabilité reste à la vision (banque en dernier).
- **D-SC-3** — Les exigences bancaires sont un référentiel de la console, avec une « banque générique UEMOA » par
  défaut ; le contenu initial est à relire par une banque.
- **D-SC-4** — Une seule GED : le module `ged` existant s'ouvre à la verticale cabinet ; le porteur d'une pièce devient
  générique (dossier sinistre ou dossier client) ; les pièces déjà déposées apparaissent par référence.
- **D-SC-5** — Le mot « archiver » est déjà pris (fermer un dossier client) : l'écran dit « **Archives du client** » et
  « fonds d'archives ».
- **D-SC-6** — Pour le cabinet, le stockage est hébergé par Money Vibes (pas le NAS du client) et **toutes** les
  pièces sont chiffrées au repos [ASSUMPTION].
- **D-SC-7** — Le code du module M39 devient `missions` (au lieu de `portail-cabinet`) ; le portail client devient un
  interrupteur ultérieur `portail-client`. Service neuf `prospera-cabinet-service`.
- **D-SC-8** — Le cabinet est créancier de ses factures ; l'encaissement passe par les créances de `paiement-service`
  (le moteur d'abonnement, aujourd'hui réservé à Money Vibes, s'ouvre à un créancier cabinet).
- **D-SC-9** — Pas de compte pour le client au jour 1 : il signe par scan ou par un lien d'acceptation à usage unique.
- **D-SC-10** — La paie entre dans Prospera (PO, 2026-11-18, renverse FR-F28) dans un service neuf
  `prospera-paie-service` ; le fiscal reste le destinataire de la base de rémunération (source `IMPORT`).
- **D-SC-11** — Aucun taux de paie dans le code : tout vient du référentiel social sourcé ; une valeur absente refuse
  le calcul qui en dépend.
- **D-SC-12** — Cinq lots de quatre stories (F1, F2, G1, M1, P1), chacun avec du backend et au moins un écran ; la
  console a une story dans quatre lots sur cinq.

## 10. Questions ouvertes (non bloquantes)

| # | Question | Qui | Avant |
|---|---|---|---|
| Q-SC-1 | Les exigences réelles de deux ou trois banques du Togo (pièces, ratios, seuils) | l'utilisateur, avec un cabinet partenaire | la première vente du module `financement` |
| Q-SC-2 | Existe-t-il un modèle de lettre de mission de l'ONECCA Togo ? | l'utilisateur | M1 |
| Q-SC-3 | L'article de l'AUDCIF 2017 sur la durée de conservation (10 ans) | A, sur le texte officiel | G2 |
| Q-SC-4 | Taux CNSS par branche, plafond, AMU (décret 2023-096), barème de la retenue sur salaires, SMIG (52 500 FCFA ?) : sources officielles | A, sur le CGI 2025 et les textes CNSS | P1 (la console publie « à compléter » sinon) |
| Q-SC-5 | Le quota d'archivage de l'offre cabinet et son prix | l'utilisateur | G1 |
| Q-SC-6 | Créer les dépôts `prospera-cabinet-service` et `prospera-paie-service` (geste réservé) | l'utilisateur | M1, P1 |

## 11. Hypothèses

| # | Hypothèse | Où |
|---|---|---|
| H-SC-1 | La signature par scan ou lien d'acceptation suffit au jour 1 | FR-13 |
| H-SC-2 | Numérotation des factures `HON-AAAA-NNNNNN`, continue par cabinet | FR-14 |
| H-SC-3 | Exigences bancaires initiales tirées de la pratique, pas d'une banque | FR-17 |
| H-SC-4 | Stockage hébergé par Money Vibes pour le cabinet ; toutes les pièces chiffrées | D-SC-6 |
| H-SC-5 | 10 ans de conservation OHADA (article à confirmer) | FR-11, NFR-7 |
| H-SC-6 | TVA 18 % sur les honoraires, paramètre | FR-12 |
