# STORY-1109 : Les documents générés du dossier — note de présentation, plan d'affaires, lettres, décision des associés

Status: ready-for-dev — **créée le 2026-11-21** à la demande de l'utilisateur, après validation de la maquette de FE-140
(PR #741). Non slottée : à placer au prochain plan.

**Service :** `prospera-bilan-service`, module `financement` (modèles et remplissage) + `document-service` (rendu Word et PDF,
demande à C) · **Points :** 13
**Dépend de :** STORY-1104 (projet, contrat des documents), STORY-1105 (banques, profil), STORY-1106 (garanties), STORY-1111 (la
projection retenue et le questionnaire), STORY-1110 (la trésorerie mensuelle).
**Débloque :** STORY-1085 (les pièces « générées » comptent comme fournies), STORY-1086 (le dossier reprend la note ou le plan), FE-156.
**Écran :** FE-156 (l'éditeur de la note et du plan, et les lettres, étape 3 « Les pièces »).
**Suite :** STORY-1086.

---

## Pourquoi

Une bonne part des pièces d'un dossier de prêt **s'écrit** : la note de présentation du projet (société établie), le plan d'affaires
(jeune société), la lettre de demande de crédit, la lettre d'affirmation du dirigeant, la décision des associés qui autorise
l'emprunt, l'engagement de domicilier les recettes. Le cabinet les rédige aujourd'hui à la main dans Word, en recopiant des chiffres
qui sont déjà dans Prospera.

**Décisions de l'utilisateur (20-21/11) :**
- le plan d'affaires et la note de présentation sont **pré-remplis** avec les données du dossier, **téléchargeables en Word** pour
  être modifiés, puis **redéposés** ;
- les textes proposés sont des **modèles remplis avec les données**, **sans IA** (l'option d'une aide par IA est à décider par
  l'utilisateur ; elle relève du PRD de l'assistant IA, FR-IA07 et FR-IA09, pas de cette story) ;
- **tout ce qui est généré se voit dans l'application avant tout téléchargement**, et **tout dépôt est un vrai téléversement**.

## Ce qui est attendu

1. **Six documents** générés depuis le dossier, avec des **blocs « à compléter »** et un compteur.
2. **Le questionnaire court de la jeune société** (huit questions) qui alimente le plan d'affaires et les hypothèses du prévisionnel.
3. **Le Word modifiable et le PDF** de chaque document ; **un aperçu** dans l'application avant tout téléchargement.
4. **Le dépôt de la version modifiée**, qui remplace la générée, les deux restant dans l'historique (date, auteur).
5. **Aucun appel à une IA**, ni dans cette story ni dans ses tests.

## Décisions retenues par défaut (contestables)

- **D-1109-1 — Les six types** (`type`), leur portée et le profil concerné (STORY-1105) :

  | Type | Portée | Profil | Pièce exigée correspondante (STORY-1085) |
  |---|---|---|---|
  | `NOTE_PRESENTATION` | un par dossier | société établie | « Note de présentation du projet » |
  | `PLAN_AFFAIRES` | un par dossier | jeune société | « Plan d'affaires complet » |
  | `LETTRE_DEMANDE` | **une par banque** | tous | « Lettre de demande de crédit signée du gérant » |
  | `LETTRE_AFFIRMATION` | un par dossier | tous | « Lettre d'affirmation du dirigeant » |
  | `DECISION_ASSOCIES` | un par dossier | tous | « Décision des associés autorisant l'emprunt et pouvoir du signataire » |
  | `ENGAGEMENT_DOMICILIATION` | **une par banque** où la relation est `NOUVEAU_CLIENT` | tous | « Engagement de domicilier les recettes » |

  Hors de cette liste, **nommés sans fiche** : la déclaration de patrimoine de la caution, le modèle de CV du promoteur, les
  formulaires d'ouverture de compte et de connaissance client de la banque, le bilan d'ouverture d'une jeune société. Leur bouton
  « Générer » de la maquette reste inerte tant qu'ils n'existent pas.
- **D-1109-2 — La structure d'un document** : `sections[]` de `blocs[]`. Un bloc a un `type` : `TEXTE_FIXE`, `DONNEES` (rempli depuis le
  dossier, non modifiable à l'écran, modifiable dans le Word), `TABLEAU` (chiffres tirés de Prospera) ou `A_COMPLETER` (surligné).
  Un bloc `A_COMPLETER` porte jusqu'à **deux brouillons** (modèles remplis avec les données, jamais une IA) ; `statut` ∈
  `A_COMPLETER`, `COMPLETE`. Le **compteur** `aCompleter` = nombre de blocs encore `A_COMPLETER`. Valider le document exige un
  compteur à zéro (409 `BLOCS_A_COMPLETER`, `details.blocs`) : le texte à l'écran dit « Complétez les informations surlignées
  pour valider ».
- **D-1109-3 — La note de présentation et le plan d'affaires ont les mêmes sept sections** (maquette) :
  1 L'entreprise · 2 L'historique · 3 Le projet · 4 Le marché et les clients · 5 L'équipe · 6 Le prévisionnel sur 3 ans · 7 Les risques
  et comment ils sont couverts.
  - **1 L'entreprise** (`DONNEES`) : raison sociale, forme, activité, date de création, NIF, RCCM, régime, dirigeant. Référence : Ets
    Kossi Distribution, SARL, distribution, créée le 14/03/2019, NIF 1000745307, RCCM TG-LOM-2019-A-1204, réel, impôt sur les
    sociétés, système normal, Komlan Kossi gérant.
  - **2 L'historique** (`TABLEAU`) : sur les exercices validés ou importés, chiffre d'affaires, marge commerciale, excédent brut
    d'exploitation, résultat net, et trois indicateurs clés. Référence : CA 15 900 000 (2023, repris du fichier du client),
    16 780 000 (2024), 16 000 000 (2025) ; marge commerciale 4 780 000 puis 4 350 000 ; EBE 1 814 000 puis 1 140 000 ; résultat
    net 800 000 puis 200 000 ; marge brute 28,5 % puis 27,2 %. Pour une jeune société : un texte fixe « Société créée en 2025 : aucun
    exercice complet. Le bilan d'ouverture est joint au dossier ».
  - **3 Le projet** (`DONNEES`) : objet, pro forma (numéro, date, HT, TVA, TTC), coût, apport, prêt demandé avec mensualité et intérêts,
    garanties retenues. Référence : camion Toyota Dyna, CFAO Motors Togo, PF-2026-0142 du 05/02/2026 : HT 26 483 051 + TVA
    4 766 949 = 31 250 000 TTC ; apport 6 250 000 (20 %) ; prêt 25 000 000 sur 48 mois, mensualité 658 346, intérêts 6 600 601 ;
    couverture retenue 197 % (49 250 000).
  - **4 Le marché et les clients** et **5 L'équipe** : blocs `A_COMPLETER`.
  - **6 Le prévisionnel sur 3 ans** (`TABLEAU`) : repris des chiffres de la projection retenue (compte de résultat, plan de
    financement, trésorerie) avec la colonne « d'où vient le chiffre » et le scénario prudent en repère (couverture centrale 1,76 /
    1,56 / 1,65, prudente 1,31 / 1,12 / 1,16).
  - **7 Les risques et comment ils sont couverts** (`TABLEAU`, lignes **conditionnelles**, aucun texte libre généré) : une ligne par
    risque détecté, avec son tableau d'atténuation.
    - une hypothèse de chiffre d'affaires à justifier (STORY-1111) : « Scénario prudent présenté en annexe ; contrats ou lettres
      d'intention joints ; couverture prudente la plus basse 1,12 » ;
    - une trésorerie prudente négative (STORY-1111) : « Différé de 6 mois possible (trésorerie 2027 prudente de −754 142 à 687 296) ou
      apport plus élevé » ;
    - un montant demandé supérieur au montant soutenable : « Apport de 6 250 000 (20 %) ; garanties retenues à 197 % du prêt ; montant
      soutenable estimé à 20 492 000 » ;
    - un matériel financé : « Assurance tous risques avec délégation au profit de la banque » ;
    - un dirigeant caution : « Assurance décès-invalidité avec délégation au profit de la banque ».
  - Dans la **note** (société établie), les sections 4 et 5 ne portent qu'un court bloc chacune ; trois blocs sont à compléter dans
    la référence (le chiffre d'affaires du camion appuyé sur des contrats ou des tournées prévues, la clientèle visée, le
    gérant et le chauffeur-livreur à recruter). Dans le **plan d'affaires** (jeune société), les sections 4 et 5 sont développées, et
    la section 6 couvre 3 ans à partir du questionnaire.
- **D-1109-4 — Les brouillons proposés** sont des **modèles de phrases à trous**, remplis avec les données du dossier (nom du client,
  activité, matériel, ville, noms du gérant) et choisis dans une table du code ; **aucun modèle de langage n'est appelé**. Deux
  brouillons par bloc `A_COMPLETER`. Exemple de référence : « Le chiffre d'affaires du camion s'appuie sur les lettres d'intention de
  clients jointes au dossier et sur les tournées prévues vers Kara et Sokodé. » (les lieux viennent du dossier ou restent à saisir ;
  un trou non renseigné laisse le bloc `A_COMPLETER`.) « Accepter le brouillon » pose le texte et passe le bloc `COMPLETE` ; le
  cabinet peut ensuite l'éditer. Un test d'invariant échoue si le module importe un client d'assistant IA.
- **D-1109-5 — Le questionnaire de la jeune société** (`PUT /{id}/questionnaire`, huit questions, entiers FCFA) : produits et prix
  moyen, volume mensuel (ventes), clients visés, charges mensuelles, salaires mensuels, loyer mensuel, investissement, apport. Il
  déduit **sans appel externe** : CA annuel visé = prix moyen × volume mensuel × 12 ; marge brute = 25 % (paramètre, AP-50) ; charges
  fixes annuelles = (charges + salaires + loyer) × 12 ; excédent brut estimé = marge brute − charges fixes. **Référence** : CA annuel
  visé **75 600 000** ; marge brute (25 %) **18 900 000** ; charges fixes annuelles **15 000 000** ; excédent brut estimé
  **3 900 000**. Les hypothèses déduites alimentent la création de la projection (STORY-1111, origine `QUESTIONNAIRE`).
- **D-1109-6 — Les lettres.** Chacune est un modèle rempli, un seul bloc d'en-tête de la banque destinataire pour la lettre de demande
  et l'engagement de domiciliation (une par banque), puis le corps :
  - **lettre de demande** : objet du crédit, montant demandé, durée, différé, apport, garanties proposées, liste des pièces jointes
    (celles de STORY-1085 pour cette banque) ;
  - **lettre d'affirmation** : le gérant confirme l'exactitude des informations remises à la banque ;
  - **décision des associés** : autorise l'emprunt du montant demandé, auprès des banques consultées, et donne pouvoir au
    signataire ;
  - **engagement de domiciliation** : le client s'engage à domicilier ses recettes (modèle sans chiffre inventé : le pourcentage
    de recettes domiciliées est un trou, bloc `A_COMPLETER`).
  Ces documents sont **à imprimer, signer, puis déposer signés** : la pièce signée est le dépôt de la pièce exigée (STORY-1085), pas
  la version générée.
- **D-1109-7 — Le rendu et le format.** Chaque document se produit en **DOCX (modifiable)** et en **PDF**. `bilan-service` assemble le
  contenu structuré ; `document-service` rend les fichiers (route de rendu à créer, **demande à C** inscrite au journal) et les range
  (contrat de STORY-1104, D-1104-9 : `origine = GENERE`, `cible = DOCUMENT_GENERE`). Les mentions fixes (« préparé par
  <cabinet> », date) figurent sur chaque document. Aucune donnée n'est recalculée à la lecture d'une version rendue.
- **D-1109-8 — L'aperçu avant téléchargement** (exigence de l'utilisateur) : un document généré s'ouvre dans l'application par
  `GET /documents/{documentId}/apercu` (D-1104-9) avant tout téléchargement ; il en va de même pour la version modifiée déposée. Le
  Word est converti en PDF pour l'aperçu.
- **D-1109-9 — Le dépôt de la version modifiée.** `POST /documents` (D-1104-9, vrai téléversement : sélecteur de fichier et
  glisser-déposer, types DOCX et PDF, taille maximale nommée) avec `cible = DOCUMENT_GENERE`, `cibleId` = le document généré :
  - le fichier déposé devient la **version courante** (`origine = MODIFIE`) ; la version générée passe `REMPLACE` et **reste lisible** ;
  - l'**historique** du document liste chaque version avec sa date, son auteur et son origine (`GENERE`, `MODIFIE`) ;
  - **régénérer** après une modification demande une confirmation explicite (`confirmer: true`), sinon 409 `VERSION_MODIFIEE_EXISTE` : la
    version modifiée n'est jamais écrasée par accident ; une régénération crée une version `GENERE` de plus, sans toucher aux autres.
- **D-1109-10 — Les routes** (sous `/api/v1/dossiers/{dossierId}/financements/{financementId}`, mêmes gardes, portée et droits que 1083 ;
  génération et édition en `BROUILLON` seulement, lecture à tout moment) :

  | Route | Droit | Effet |
  |---|---|---|
  | `GET /documents-generes` | consulter | les documents du dossier, leur type, leur compteur `aCompleter`, leur version courante |
  | `POST /documents-generes/{type}` | préparer | génère (`banqueId` pour les types par banque) ; 201 |
  | `GET /documents-generes/{docId}` | consulter | le contenu structuré (sections, blocs, brouillons) |
  | `PUT /documents-generes/{docId}/blocs/{blocId}` | préparer | pose le texte d'un bloc, ou accepte un brouillon (`brouillon: 1 ou 2`) |
  | `POST /documents-generes/{docId}/valider` | préparer | exige un compteur à zéro |
  | `POST /documents-generes/{docId}/rendus` | préparer | produit DOCX et PDF (documents D-1104-9) |
  | `GET /documents-generes/{docId}/historique` | consulter | les versions, avec date, auteur, origine |
  | `PUT /questionnaire` · `GET /questionnaire` | préparer · consulter | D-1109-5 |

  Refus : 404 `DOCUMENT_GENERE_INTROUVABLE`, `BLOC_INTROUVABLE` ; 409 `BLOCS_A_COMPLETER`, `VERSION_MODIFIEE_EXISTE`,
  `DOSSIER_FINANCEMENT_NON_MODIFIABLE` ; 422 `TYPE_DOCUMENT_INCONNU`, `PROFIL_NON_CONCERNE` (note pour une jeune société, plan
  d'affaires pour une société établie, sauf surcharge du profil), `BANQUE_REQUISE` (type par banque sans `banqueId`),
  `DONNEES_MANQUANTES` (`details.champs` : pas de projection retenue, pas de pro forma, etc.), `RENDU_INDISPONIBLE` (le service de
  rendu ne répond pas), `QUESTIONNAIRE_INCOMPLET` (`details.questions`).
  Piste d'audit : `FINANCEMENT_MODIFIE` avec `document` et `geste` (`GENERATION`, `EDITION_BLOC`, `VALIDATION`, `DEPOT_MODIFIE`). Le
  manifeste M49 passe en 0.3.0 (lectures en lecture seule).
- **D-1109-11 — Les documents sont figés avec le dossier.** Les versions courantes à la date du figement (STORY-1086) sont incluses
  dans le dossier remis à chaque banque, par empreinte.

## Critères d'acceptation

- **AC-1** : la note d'Ets Kossi est générée avec les chiffres de référence de D-1109-3 (trois blocs à compléter, compteur 3) ; le
  compteur passe à 0 quand les trois sont complétés ; la validation est refusée tant qu'il reste un bloc.
- **AC-2** : le questionnaire de référence produit CA 75 600 000, marge brute 18 900 000, charges fixes 15 000 000, excédent
  3 900 000, écrits en dur dans le test.
- **AC-3** : une société établie ne génère pas de plan d'affaires, une jeune société ne génère pas de note (`PROFIL_NON_CONCERNE`) ;
  la lettre de demande est une par banque ; l'engagement de domiciliation n'existe que pour une banque `NOUVEAU_CLIENT`.
- **AC-4 (aucune IA)** : un test d'invariant échoue si un module d'IA est importé ou appelé ; les brouillons sortent d'une table de
  modèles.
- **AC-5 (voir)** : chaque document généré (six types, Word et PDF) a un aperçu dans l'application, **avant** tout téléchargement ;
  `…/fichier` rend les octets rendus.
- **AC-6 (upload)** : la version modifiée se téléverse (vrai fichier, mêmes refus nommés que STORY-1104), devient la version courante,
  la générée reste dans l'historique avec date et auteur ; régénérer sans confirmation est refusé `VERSION_MODIFIEE_EXISTE`.
- **AC-7** : droits et portée comme 1083 ; contrat publié, typé dans l'OpenAPI, annoncé dans « ⚠ Contrats » avant le code.

## Hors périmètre

- Une aide à la rédaction par IA (option à décider par l'utilisateur, PRD assistant IA FR-IA07 et FR-IA09).
- La déclaration de patrimoine, le modèle de CV, les formulaires de la banque, le bilan d'ouverture (nommés, sans fiche).
- La signature électronique : le cabinet imprime, fait signer, redépose le scan.
- La traduction des documents.
