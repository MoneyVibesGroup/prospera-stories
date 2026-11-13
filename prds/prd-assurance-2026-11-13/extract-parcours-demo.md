# Extraction des parcours validés de la démo — chaîne sinistres IARD (zone CIMA, Togo)

Sources : `prospera-font-end/prospera-assurance/docs/` — `DEMO_SIN-2026-9002.md` (guide corrigé, rejoué le 21/09/2026), `SCENARIOS_DEMONSTRATION.md`, `retour-demo-SIN-2026-9002/` (README, 00 à 16, 99, rejeu-2, scripts, captures).
Convention : « la compagnie » = la compagnie cliente (jamais nommée). Chiffres, noms de statuts et messages repris tels quels.

Lecture des sources : le guide `DEMO_SIN-2026-9002.md` décrit l'état **validé après corrections** (rejeu 2 : 94 vérifications, 0 échec). Les fichiers `00` à `16` et `99` décrivent l'état **avant corrections** (conservés comme trace) : ils servent ici aux remarques/défauts (section 5) et aux données observées.

Cadre général de la démo : temps figé au **12 septembre 2026** (journal, délais, archives). Mot de passe unique : `password123`. Bouton « Changer de profil » (barre latérale) ramène aux cartes de connexion et remplace la session ; bouton « Réinitialiser la démo » (grisé tant que rien n'a été fait) remet à zéro, propre à chaque navigateur. URL : `http://localhost:3100` (pas `127.0.0.1`).

---

## 1. Profils joués dans les parcours (les 11 profils de connexion : section 1bis)

Profils joués dans les guides (le tableau complet des 11 profils de connexion de l'application est en section 1bis).

| # | Profil — rôle | Ce qu'il fait | Ce qu'il voit / ne peut pas faire |
|---|---|---|---|
| 1 | **Afi Tchalla** — Accueil (guichet) | Réception de la déclaration, constat des pièces manquantes, « Ouvrir en attente de pièces », dépôt des pièces, « Reprendre le circuit — pièces reçues » (ouverture), « Constater la remise au bénéficiaire » (identité + pièce d'identité) | Ne choisit pas le gestionnaire ; « Ouvrir et orienter » fermé sans les 5 pièces obligatoires ; après l'ouverture plus aucune action ; « Prendre le dossier en instruction » affiché fermé (« réservée à : gestionnaire, responsable ») |
| 2 | **Komi Adjovi** — Responsable (encadrement) | Attribue le dossier (motif obligatoire), ordonne la contestation / contre-expertise, désigne les experts, prépare la fiche de décision, valide l'indemnisation (≤ 2 000 000 FCFA) et émet l'ordre de règlement (motif obligatoire), reconstitue (démo 4) | Ne prend pas le dossier en instruction (« doit avoir été attribué ») ; refusé au-delà de 2 000 000 FCFA (« seule la direction peut valider ») ; ne peut pas certifier sa propre reconstitution |
| 3 | **Akouvi Sossou** — Direction | Valide au-delà de 2 000 000 FCFA (39 500 000 ; 12 500 000), certifie les reconstitutions | Seule autorisée au-delà du seuil de délégation |
| 4 | **Edoh Agbo** — Gestionnaire volet corporel | Instruit (SIN-2026-9001, 9004), valide les rapports, arrête le montant | Évaluation bloquée tant qu'une expertise est ouverte |
| 5 | **Estelle Lawson** — Gestionnaire volet matériel | Instruit (SIN-2026-9002), enregistre les rapports reçus par courrier, décide sur les missions (complément, contestation, accepter, valider), orientation assistée, garantie, évaluation au barème, transmission au pôle recours, clôture | Ne peut pas ordonner la contre-expertise, ne valide pas l'indemnisation (« réservée à : responsable, direction »), n'émet pas le règlement, ne verse pas au fonds |
| 6 | **Yao Amegan** — Gestionnaire risques divers | Instruit (SIN-2026-9003, incendie) | idem gestionnaire |
| 7 | **Cabinet SAREX** — portail expert (cabinet externe) | Accepte la mission, dépose son rapport depuis son portail | Ne voit que ses missions ; ni provision ni reste du dossier ; son périmètre = la mission |
| 8 | **Komlan Aziagbé** — Expert interne (« Expertise interne — auto & responsabilité ») | Accepte la mission, **rédige son rapport dans l'application**, rubrique par rubrique | Ne peut pas recevoir une contre-expertise (« panel interne » refusé) ; « expert interne : aucun honoraire à engager » |
| 9 | **Pascal Ayite** — Comptabilité | Émet quittance et chèque (n° de chèque + banque) | « Celui qui décide ne paie pas » |
| 10 | **Mensah Kpodo** — Numérisation & archives (GED / archiviste) | Poste Dépôt & lecture (`/depot`), versement au fonds + attribution du numéro `ARC-…`, localisation de la chemise, reconstitution (démo 4) | Seul à verser au fonds (« le versement relève de l'archiviste ») |

Cabinet AUTO-CONTROL Togo (expert de la mission 9201) n'a **pas** de compte/portail : son rapport arrive par courrier, saisi par la gestionnaire. Autres cabinets cités dans le classement de désignation : TOGO-SINISTRE ; experts internes (avec réserve).

---

## 2. Parcours SIN-2026-9002 (état validé, guide corrigé)

### 2.0 Le dossier

| | |
|---|---|
| Référence | `SIN-2026-9002` |
| Nature | Collision automobile — dommages matériels |
| Volet | Matériel · gravité modérée |
| Assuré | Mawuli DOGBE — Nissan Almera 1.5, `TG-7733-CD`, mise en circulation 2013 |
| Police | `AUT-2025-07733` — Automobile, tous risques · plafond dommages 9 000 000 FCFA, franchise 10 % (minimum 50 000) |
| Tiers | Société TRANS-GOLFE, Mercedes Sprinter `TG-2291-TR` — Union Assurances Togo |
| Sinistre | 9 juin 2026, 8 h 15 — route de Kpalimé, PK 12, Lomé |
| Responsabilité | Partagée |
| Provision | 780 000 FCFA |
| Montant à arrêter | 445 500 FCFA |

État initial : `DÉCLARÉ`, aucune pièce versée, aucun gestionnaire, une mission `EXP-2026-9201` (cabinet AUTO-CONTROL Togo, rapport attendu). Durée de jeu : 25 minutes. Trois expertises de nature différente : initiale (9201), contre-expertise (C0001), lecture interne des circonstances (D0001).

### 2.1 Documents (12 fichiers, `public/vitrine/SIN-2026-9002/`, aussi téléchargeables depuis « Dépôt & lecture »)

Sept pièces apportées par l'assuré : `01-declaration-sinistre.pdf` (signée) ; `02-constat-amiable.pdf` (cases 12 et 15 cochées) ; `03-carte-grise.pdf` ; `04-attestation-assurance.pdf` ; `05-photos-dommages.pdf` ; `06-devis-reparation.pdf` (Garage LA CONFIANCE — 1 273 000 FCFA) ; `09-contestation-assure.pdf`.

Cinq documents produits par la procédure (jamais « attendus » du dossier ; ajoutés le jour où ils sont déposés, depuis la mission) : `07-lettre-mission-auto.pdf` ; `08-rapport-expertise-auto.pdf` (445 500, incomplet, déposé par Estelle, reçu par courrier) ; `10-lettre-mission-contre-expertise.pdf` ; `12-rapport-contre-expertise.pdf` (445 500, complet, déposé par SAREX depuis son portail) ; `11-rapport-expertise-responsabilite.pdf` (version papier du rapport rédigé en ligne par Komlan Aziagbé ; personne ne le dépose).
Règle : un rapport d'expertise ne se dépose jamais parmi les pièces du dossier ; il se dépose depuis sa mission et rejoint alors les pièces.

### 2.2 Étapes

Grille : acteur · écran · action/données · règle · statut avant → après · documents/traces.

**Étape 1 — Accueil (Afi Tchalla) : la déclaration arrive**
- Écran : fiche dossier ; bandeau « Ouverture bloquée : 5 pièces obligatoires manquantes » ; bloc « Actions possibles ».
- Règle : « Ouvrir et orienter vers le volet » est dans les actions fermées, motif *« Toutes les pièces obligatoires doivent être reçues »* ; non forçable. Seule ouverte : « Ouvrir en attente de pièces ».
- Statut : `DÉCLARÉ` → `PIÈCES INCOMPLÈTES`. « Reprendre le circuit — pièces reçues » apparaît, fermé tant que les pièces manquent.

**Étape 2 — Accueil : le téléversement**
- Écran : onglet « Pièces du dossier », cadre « Déposer les pièces reçues — plusieurs à la fois » (glisser ou « Choisir des fichiers »), 7 pièces d'un coup.
- Pour chaque pièce l'application affiche ce qu'elle a reconnu, la confiance, la pièce attendue rattachée. Devis : `Total du devis : 1 273 000 FCFA` ; déclaration : n° de police, immatriculation, n° de châssis. Lecture dans le contenu, pas le nom du fichier. Test qui convainc : renommer `06-devis-reparation.pdf` en `IMG_20260618.pdf` → « Devis de réparation, 96 % ».
- Règle : « Verser au dossier » grisé (« Lecture en cours… ») tant qu'un document est en lecture.
- Après versement : colonne OCR « Texte extrait » ×7 ; complétude **100 %** (5 pièces obligatoires sur 5).

**Étape 3 — Accueil : l'ouverture**
- « Reprendre le circuit — pièces reçues » ouverte, confirmation. Statut → `OUVERT`.
- Règle : **aucun gestionnaire désigné** (« pas au guichet de décider qui instruit »). « Prendre le dossier en instruction » affiché fermé, « réservée à : gestionnaire, responsable ».

**Étape 4 — Responsable (Komi Adjovi) : l'attribution**
- « Prendre le dossier en instruction » fermé aussi pour lui : *« Le dossier doit avoir été attribué à un gestionnaire par l'encadrement »*.
- Carte « Attribuer le dossier » → Estelle Lawson + motif ; bouton actif seulement avec motif.
- Trace : journal « Affectation du dossier · Non affecté → Estelle Lawson », avec motif.

**Étape 5 — Estelle Lawson : l'instruction**
- Prend le dossier : → `EN ÉTUDE`.
- Règle : évaluation fermée : *« Toute expertise ouverte doit avoir rendu son rapport et être validée »* (`EXP-2026-9201` attend son rapport).

**Étape 6 — Estelle : premier rapport reçu par courrier**
- AUTO-CONTROL Togo sans portail ; la gestionnaire enregistre. Onglet « Missions d'expertise » → `EXP-2026-9201` → « Enregistrer le rapport » → `08-rapport-expertise-auto.pdf`.
- Lu : n° de rapport, montant retenu (**445 500 FCFA**, pré-rempli), point de choc, date de visite (observé avant corrections : rapport `REV-2026-0703`, point de choc « latéral droit — frottement longitudinal », visite 29/06/2026).
- Complétude **88 %, sous réserve** : 2 points rouges — *méthode d'évaluation*, *valeur vénale* (PDF : « Non précisée » / « Non renseignée ») : rubriques présentes mais vides lues par le contrôle.
- Après enregistrement : mission → « Rapport à analyser », bouton « Décider » apparaît (la fiche se met à jour d'elle-même — corrigé).
- Document : pièce « Rapport d'expertise — EXP-2026-9201 » rejoint les pièces (2 pages, texte extrait, déposant Estelle Lawson).

**Étape 7 — Estelle : écart, portefeuille, complément**
- Bloc « Le rapport face au dossier » : **« Chiffrage de l'expert inférieur de 65 % au devis du garage »** (445 500 vs 1 273 000, source devis Garage LA CONFIANCE du 18 juin 2026), question rédigée à l'expert (« Quels postes du devis avez-vous écartés, et pour quel motif ? ») ; second écart « rapport remis 65 jours après la date attendue ».
- Fiche dossier, carte « Analyse IA », ligne « Devis au-dessus des références » : puce « Historique interne : … devis comparables — pare-chocs » → fenêtre « Ce que le portefeuille a payé » : histogramme des prix relevés, prix du devis placé dessus, quartiles en clair, phrase *« une comparaison n'est pas une règle »*.
- Décider → « Demander un complément » : 3 demandes rédigées et cochées (méthode d'évaluation ; valeur vénale / caractère économiquement réparable ; postes du devis écartés). Après envoi : « Complément demandé à l'expert », mission `COMPLEMENT_DEMANDE`.

**Étape 8 — Contestation : qui peut ordonner**
- Estelle : Décider → Contester le rapport, motif, « ouvrir une contre-expertise » coché → refusé : *« Seuls le responsable et la direction peuvent ordonner une contre-expertise. »*
- Komi Adjovi : accepté ; 9201 → `CONTESTÉE` (« Rapport d'expertise contesté ») ; naît `EXP-2026-C0001` : type contre-expertise, priorité urgente, poids 1,5, budget prévisionnel 90 000 FCFA, objet « Se prononcer contradictoirement sur les conclusions du rapport EXP-2026-9201 de Expert AUTO-CONTROL Togo ».
- C0001 → « Désigner un expert » : classement SAREX #1, TOGO-SINISTRE #2, puis experts internes avec réserve orange. Ligne grisée en bas : **« Expert AUTO-CONTROL Togo — écarté : a produit le rapport contesté »**. « Désigner » Komlan Aziagbé → refusé : *« Une contre-expertise ne peut pas se confier au panel interne »*. Désigner Cabinet SAREX → « Expert désigné ».
- Règle de base : contre-expertise contradictoire (article 8 de la convention d'expertise).

**Étape 9 — Cabinet SAREX : contre-expertise depuis le portail**
- Tableau de bord limité à ses missions, C0001 en tête de « Missions à accepter ». « Accepter la mission », puis « Déposer mon rapport » → `12-rapport-contre-expertise.pdf`.
- Complétude **100 %** : méthode et valeur vénale présentes ; réponse point par point à la contestation de l'assuré (facture de jante : jante de 14 pouces, véhicule en 15) ; **confirme 445 500 FCFA**.
- Le cabinet ne voit ni la provision ni le reste du dossier.

**Étape 10 — Estelle : la contre-expertise tranche**
- Mission C0001 → Décider → Accepter les conclusions → Valider le rapport. 9201 → **`ARBITRÉE`** — « Contestation tranchée par la contre-expertise EXP-2026-C0001 » ; ne bloque plus rien.

**Étape 11 — Estelle : seconde expertise (orientation assistée)** — voir aussi section 4
- Missions d'expertise → « Orientation assistée » : besoin proposé **Responsabilité & circonstances**, « à confirmer » : *« Responsabilité partagée alors que le constat amiable est au dossier : une lecture contradictoire des circonstances peut suffire, sans mission extérieure. »*
- L'assistant ne crée rien ; « Retenir ce besoin » crée `EXP-2026-D0001`. Retenir deux fois : « Mission déjà ouverte ».

**Étape 12 — Responsable puis Komlan Aziagbé : rapport de responsabilité**
- Komi → D0001 → Désigner → Komlan Aziagbé, « expert interne : aucun honoraire à engager » : **90 000 FCFA d'honoraires non engagés, sur décision motivée** (cabinet externe classé premier : 110 000).
- Komlan : « Accepter la mission » → « Rédiger mon rapport » (saisie dans l'application, complétude calculée à mesure). Grille propre à la responsabilité (pas de méthode d'évaluation) : **séquence reconstituée** + **imputation motivée**. Contenu : localisation des chocs (flanc droit de A sur toute sa longueur, angle avant gauche de B → même hauteur) ; **70 % au tiers** (changement de direction sans s'assurer de pouvoir le faire sans danger) ; **30 % à l'assuré** (dépassement poursuivi) ; recours contre Union Assurances Togo fondé à hauteur de 70 %.
- Champ chiffré « Part de responsabilité du tiers » : **70**. Sans cette part, dépôt bloqué.
- Complétude 100 %. Dépôt : rapport **mis en page en PDF à l'instant du dépôt**, ajouté aux pièces (« Rapport d'expertise — EXP-2026-D0001 », texte extrait, bouton Voir) ; sera versé au fonds.
- Estelle valide : **responsabilité requalifiée** — badge « Responsabilité partagée · 70 % au tiers » ; journal « Responsabilité requalifiée sur rapport d'expertise » ; ouvre le recours au prorata.

**Étape 13 — Estelle : garantie puis évaluation**
- Onglet « Garanties & recevabilité » : contrat valide ; garantie « dommages tous accidents » acquise ; **déclaration tardive (95 jours pour un délai contractuel de 5)** ; franchise 10 % ; six exclusions à écarter. « Décision de garantie » : garantie acquise + motif + enregistrer (acte opposable à l'assuré).
- Évaluation ouverte (3 missions closes : 2 validées, 1 arbitrée). « Enregistrer l'évaluation au barème » : champ pré-rempli **445 500 FCFA — chiffrage validé par l'expertise** ; calcul d'instruction technique (**775 000**) affiché en repère, pas dans le champ.
- Règles : champ vidé → refusé *« saisissez le montant arrêté au barème »* ; montant différent → motif obligatoire. Barème appliqué seul : **BAR-MAT · Dommages moyens — mécanique** (tranche **M2**) ; provision réajustée à 445 500. Envoi en validation.

**Étape 14 — Responsable : la validation**
- « Valider l'indemnisation et émettre l'ordre de règlement » → « Préparer la fiche de décision ».
- Points forts : pièces 5/5 ; 3 expertises closes (2 validées, 1 arbitrée après contestation) ; tranche M2 du barème BAR-MAT ; cohérent avec **183 dossiers comparables (écart −20 %)** ; aucun signal de fraude significatif ; part du tiers arrêtée à 70 % : recours à engager après règlement (**311 850 FCFA**).
- Points de vigilance : **hors délai de 73 jours** ; délai de déclaration (déclaration tardive, 95 jours pour 5) ; franchise 10 % du dommage, minimum 50 000 FCFA, à déduire de l'indemnité ; six exclusions à écarter avant d'engager la garantie.
- Règles : Confirmer grisé tant que le motif est vide ; 445 500 < seuil de délégation **2 000 000 FCFA** → le responsable valide lui-même ; l'ordre part à la comptabilité. Estelle voit l'action fermée « réservée à : responsable, direction ».

**Étape 15 — Pascal Ayite : le règlement**
- « Émettre le règlement — quittance et chèque » : n° du chèque (ex. `007001`) et banque ; sans numéro refusé (« Indiquez le numéro du chèque émis »). Quittance et chèque créés. Gestionnaire : action fermée (« celui qui décide ne paie pas »).

**Étape 16 — Afi Tchalla : la remise ; Estelle : la clôture**
- « Constater la remise au bénéficiaire » : champ « Retiré par » vide (nom en filigrane) ; vide → refusé *« indiquez l'identité de la personne qui retire le chèque »* ; nom sans pièce d'identité → refusé ; `Mawuli DOGBE` + `CNI 0147-2026` → `RÉGLÉ`.
- Estelle : deux actions ouvertes : « Transmettre au pôle recours » (70 % de 445 500 ; ouverte seulement après le rapport de responsabilité) et « Clôturer après règlement » (motif obligatoire) → `CLÔTURÉ`. Le dossier 9001 est celui qui joue le recours jusqu'au bout.

**Étape 17 — Mensah Kpodo : versement au fonds**
- Estelle : onglet Archivage « le versement relève de l'archiviste ». Mensah → onglet Archivage → « Verser au fonds et attribuer un numéro » ; dossier en tête des clos à verser. Localiser la chemise (local, travée, tablette, boîte, rang), sceller l'image, verser : numéro **`ARC-2026-MATL-…`** (observé : `ARC-2026-MATL-00542`) ; bordereau de **onze pièces** (7 de l'assuré, 3 rapports dont celui rédigé en ligne, la quittance) avec la valeur juridique de chaque original ; le dossier disparaît de la liste (verser deux fois impossible).

### 2.3 Les trois moments qui portent la démo
1. **L'écart de 65 %** : « 65 % d'écart sur un dossier de 780 000 FCFA. Sur 3 500 sinistres par an. »
2. **La contestation qui se tranche** : gestionnaire ne peut pas l'ordonner, cabinet initial ne peut pas la juger, panel interne non plus ; la contre-expertise clôt le premier ; rien ne reste en suspens.
3. **L'expertise qu'on n'a pas payée** : lecture interne proposée par l'assistant, gestionnaire décide, 90 000 FCFA.

### 2.4 Refus à provoquer (tableau du guide)
Ouvrir sans les pièces → action fermée ; verser pendant la lecture → bouton grisé ; gestionnaire s'attribue le dossier → carte non proposée ; instruire avant attribution → fermé ; attribuer sans motif → grisé ; évaluer avec expertise ouverte → fermé ; gestionnaire ordonne la contre-expertise → refus ; contre-expertise au panel interne → refus ; au cabinet initial → non proposé (« écarté : a produit le rapport contesté ») ; deux fois le même besoin → « Mission déjà ouverte » ; évaluer sans montant → « Saisissez le montant arrêté au barème » ; autre montant que le chiffrage validé → motif obligatoire ; gestionnaire valide l'indemnisation → fermé ; valider sans motif → grisé ; gestionnaire émet le règlement → fermé ; sans n° de chèque → « Indiquez le numéro du chèque émis » ; remise sans identité / sans pièce d'identité → refusé, champ nommé ; clôturer sans motif → grisé ; gestionnaire verse au fonds → « Le versement relève de l'archiviste » ; verser deux fois → plus proposé.

### 2.5 Chiffres à ne pas confondre
Devis garage **1 273 000** (ce que l'assuré demande) ; chiffrage expert **445 500** (après vétusté et postes écartés, confirmé par la contre-expertise) ; provision **780 000** (réserve comptable, réajustée à 445 500) ; calcul d'instruction **775 000** (repère, pas le montant) ; estimation comparables **555 000** (médiane de 183 dossiers réglés même nature, même volet, même gravité) ; montant arrêté **445 500** (décision du gestionnaire) ; franchise 10 %, minimum 50 000 (la déduction est une décision, pas un automatisme). Complétude du dossier = pièces obligatoires du dossier seulement (5/5) ; l'estimation par comparaison ne tient compte d'aucune pièce ; les trois chiffres restent côte à côte, jamais fondus.

Vérifications avant séance : `npm run demo:check`, `test:circuit` (228), `test:parcours` (106), `test:expert` (88) ; zéro échec.

---

## 3. Autres scénarios (SCENARIOS_DEMONSTRATION.md)

Principe : 4 dossiers démarrent à `DECLARÉ`, sans gestionnaire, sans pièce, missions sans rapport ; **51 documents** fournis (`public/vitrine/<dossier>/`) ; « 50 reconnus sur 50 » dans la vérification de lecture. Deux natures de documents : pièces de l'assuré (déposées sur le dossier) ; lettre de mission, rapport d'expertise, note d'honoraires (fabriqués par la procédure, déposés depuis la mission).

Circuit commun (10 étapes) : 1 Déclaration (Accueil constate les pièces manquantes) → 2 Téléversement (Accueil ou GED) → 3 Ouverture (Accueil ; ne choisit pas qui instruira) → 4 Attribution (Responsable ; instruction bloquée tant qu'il ne l'a pas fait) → 5 Instruction (gestionnaire du volet) → 6 Expertise (SAREX dépose ; gestionnaire valide) → 7 Évaluation (gestionnaire arrête au barème puis envoie en validation) → 8 Validation (Responsable ; Direction Akouvi Sossou au-delà de 2 000 000 FCFA ; motif exigé ; émet l'ordre de règlement) → 9 Règlement (Pascal Ayite : quittance + chèque) → 10 Remise (Accueil, pièce d'identité) puis clôture par le gestionnaire. Principe : essayer d'abord de sauter le tour ; « Un circuit qui ne refuse rien ne sépare rien. »

Dépôt : gestionnaire = onglet « Pièces du dossier » (sans quitter le dossier) ; poste de numérisation = « Dépôt & lecture » (`/depot`), reçoit une pile sans savoir à quel dossier chaque document appartient. Même moteur. Pour chaque document : ce qui est reconnu + confiance (lu dans le titre) ; données relevées (n° de dossier, n° de police, immatriculation, n° de châssis, montants, dates, taux d'IPP) ; « Voir où chaque valeur a été lue » (extrait exact).

### Démo 1 — SIN-2026-9001 « Un sinistre, deux expertises » (accident de la circulation avec blessé, Lomé ; 12 pièces + 6 documents produits)
- Accueil : `DECLARÉ`, ouverture refusée (pièces manquantes) ; dépôt des 12 pièces ; devis `Total du devis : 1 227 000 FCFA` ; rapport d'expertise `Montant retenu par l'expert : 839 450 FCFA`, n° de châssis, point de choc.
- Ouverture vers volet corporel, aucun gestionnaire. Responsable : instruction refusée *« le dossier doit avoir été attribué »* → attribue **Edoh Agbo**. Edoh prend en instruction ; évaluation bloquée (2 expertises ouvertes) : deux missions (véhicule, lésions).
- SAREX `EXP-2026-9101` : rapport automobile, complétude 100 % (points de l'article 10 honorés). Edoh : **écart de 32 %** devis/expert ; radiateur facturé 165 000 non retenu, « aucune trace de choc ni de fuite ».
- SAREX `EXP-2026-9102` : rapport médical, consolidation au 30/09/2026, **IPP 8 %** lus dans le tableau d'évaluation médico-légale.
- Edoh valide les deux rapports (le montant retenu par la compagnie n'est pas forcément celui du rapport) ; évaluation débloquée ; arrête **1 850 000 FCFA** (barème appliqué seul) ; Responsable valide avec motif ; Comptabilité : quittance + chèque ; Accueil : remise, identité exigée ; gestionnaire clôture.

### Démo 2 — SIN-2026-9002 « Le contrôle qui rapporte de l'argent » : voir section 2 (tableau court de 14 lignes ; même contenu).
Argument : « 65 % d'écart sur un dossier de 780 000 FCFA, et un rapport incomplet payé sans que personne l'ait vu. Sur 3 500 sinistres par an. » Ligne 14 du tableau : fiche de décision (3 expertises closes, déclaration tardive, franchise) avec motif ; règlement avec n° de chèque saisi ; remise avec identité et pièce ; à l'étape Réglé « Transmettre au pôle recours » ouverte (70 % de l'indemnité) ; clôture ; versement avec bordereau de 11 pièces dont le rapport rédigé en ligne.

### Démo 3 — SIN-2026-9003 « Le gros sinistre et la règle » (incendie de magasin, Kara ; 5 pièces)
- Montre la délégation : **39 500 000 FCFA** >> seuil **2 000 000 FCFA** ; le responsable ne peut pas valider.
- Accueil dépose 5 pièces, ouvre vers risques divers. Responsable attribue **Yao Amegan**. Yao : orientation assistée : enjeu au-delà du seuil → **expertise externe imposée**, avec son motif ; second besoin (perte d'exploitation) *proposé*, pas créé.
- SAREX `EXP-2026-9301` : origine retenue, point de départ, **inventaire à 39 500 000 FCFA** contre provision de 32 M. Complétude **92 %** (méthode d'évaluation manquante : vraie lacune).
- Yao valide le rapport, arrête le montant, envoie en validation. Responsable : le bouton refuse *« au-delà de 2 000 000 FCFA, seule la direction peut valider »*. Akouvi Sossou (Direction) valide, motif. Comptabilité → Accueil : régler, remettre, clôturer.

### Démo 4 — SIN-2026-9004 « De la pièce à l'archive, et retour » (accident mortel, ayants droit ; 10 pièces)
- Dépôt de 10 pièces (jugement d'hérédité, certificat de genre de mort, fiche ayant droit) ; volet corporel ; Responsable attribue Edoh Agbo ; Edoh instruit.
- SAREX `EXP-2026-9401` : rapport médical post-mortem, complétude 100 % sur la **grille du décès** (genre de mort, lien de causalité, délai ; ni consolidation, ni IPP, ni ITT) et non sur le tableau médico-légal du barème.
- Valider, arrêter **12 500 000 FCFA**, validation Direction, règlement, remise, clôture.
- GED, onglet Archivage : verser **avant** clôture refusé (« le fonds ne reçoit que du terminé ») ; après clôture, versable. `/archives/versement` : bordereau construit à partir des pièces déposées, avec valeur juridique de chaque original. Verser : numéro `ARC-2026-CORP-…`, second versement refusé.
- `/archives/reconstitution` : porter la chemise introuvable en **disant où elle a été cherchée** (sinon refusé). Responsable reconstitue : taux de complétude + réserve honnête : **les originaux irremplaçables ne sont rétablis qu'en copie**. Certification : le responsable qui a reconstitué **ne peut pas certifier son propre travail** ; la direction certifie.
- Argument : « Les documents que vous m'avez vu déposer il y a vingt minutes, je viens de les perdre et de les rétablir. »

### Capacités et limites de la lecture (SCENARIOS)
PDF né numérique : contenu lu, type reconnu, données relevées, complétude calculée — dans le navigateur, sans serveur (couche texte extraite et analysée). Scan en image : accepté et rattaché, contenu NON lu, affiché en clair ; il faudrait une reconnaissance optique (service dédié). Un rapport déposé aujourd'hui sur une mission lancée en juillet apparaît en retard (le délai court depuis la visite).

### Modèles documentaires suivis
Rapport d'expertise automobile : Convention expertise automobile, article 10 (photo du point de choc : article 11) ; Délais : article 9 — 10 j / 45 j / 75 j ; Contre-expertise : article 8 — contradictoire ; Rapport médical : tableau d'évaluation médico-légale ; Déclaration, fiche ayant droit : Fonds de garantie automobile. Données intégralement fictives (générées par `scripts/vitrine/donnees.py` + `generer.py`).

---

## 1bis. Les 11 profils annoncés (table de connexion du README de l'application, `prospera-assurance/README.md`)

Mot de passe unique `password123` ; un compte de connexion par profil ; menu latéral filtré par profil (chaque rôle a son propre menu, pas de menu commun avec entrées grisées). Le reste de l'équipe sinistres (**14 gestionnaires** : 3 corporel, 5 matériel, 3 risques divers, 3 pôle recours) n'a pas de compte de démo : présents dans corbeilles, charge par gestionnaire, page Utilisateurs, traçabilité ; dossiers entrants affectés « à tour de rôle » au sein du volet.

| # | Profil | Identifiant | Ce qu'il voit |
|---|---|---|---|
| 1 | Direction générale (Akouvi Sossou) | `direction@assurance-togo.com` | Vue consolidée, indicateurs, engagements ; écran dédié « poste de pilotage Direction » (coût des sinistres sur 12 mois après coassurance et réassurance, engagements restant à régler, part des dossiers traités dans le délai cible, conformité aux délais CIMA) |
| 2 | Responsable sinistres (Komi Adjovi) | `responsable.sinistres@…` | Charge des gestionnaires, retards, validation |
| 3 | Gestionnaire corporel (Edoh Agbo) | `gest.corporel@…` | Sa corbeille, volet corporel uniquement |
| 4 | Gestionnaire matériel (Estelle Lawson) | `gest.materiel@…` | Sa corbeille, volet matériel |
| 5 | Gestionnaire divers (Yao Amegan) | `gest.divers@…` | Sa corbeille, risques divers |
| 6 | Pôle recours | `recours@…` | Créances contre tiers, mises en demeure |
| 7 | Opérateur numérisation (Mensah Kpodo) | `ged@…` | Lots de scan, indexation, OCR, archivage |
| 8 | Accueil sinistres (Afi Tchalla) | `accueil@…` | Guichet : recherche, pièces, relances, remise de chèques |
| 9 | Comptabilité (Pascal Ayite) | `comptabilite@…` | Quittances, chèques, rapprochement, état mensuel |
| 10 | Contrôle interne | `audit@…` | Piste d'audit, traçabilité, conformité |
| 11 | Administrateur | `admin@…` | Comptes, rôles, barèmes, assistant |

Hors table des 11 mais utilisés dans le parcours : **Cabinet SAREX** (`contact@sarex.tg`, portail expert, profil « Cabinet d'expertise ») ; **Komlan Aziagbé** (`expert.auto@…`, « Expertise interne — auto & responsabilité ») ; dans les comptes du code : `medecin.conseil@…` (médecin conseil, non joué dans 9002). Cabinets d'expertise de classement : SAREX, TOGO-SINISTRE, CIRCA Investigations (externe, 110 000 FCFA), AUTO-CONTROL Togo (sans compte). Autre gestionnaire : Sélom Houngbo (présélectionné à tort dans la réaffectation avant correction).

Rôles habilités affichés dans les actions fermées : « Gestionnaire sinistres, Gestionnaire recours, Responsable service sinistres » (prise en instruction) ; « Responsable service sinistres, Direction générale » (validation de l'indemnisation) ; « Responsable, Direction » (rouvrir le dossier).

---

## 2bis. Écarts de chaque étape avant corrections (fichiers 00 à 16 — état du premier rejeu, 20/09/2026) et données observées en plus

Ces écarts ont tous été corrigés (rejeu 2) ; ils sont consignés car ils décrivent des règles que le PRD doit trancher. Données observées en complément des étapes du guide :

- **00** : serveur de dev en panne silencieuse (page de connexion 16-28 s, WebSocket HMR en échec, React non hydraté) ; `127.0.0.1` vs `localhost` (origine bloquée). Le guide parlait d'un « sélecteur de profil » inexistant : changer de profil = se déconnecter + carte (14 fois par séance). La fiche affichait « Automobile — Tous risques » là où le guide disait « tiers étendu ». Après remise à zéro : `localStorage` vide, 0 pièce sur 5, aucun gestionnaire.
- **01** : « Ouvrir et orienter vers le volet » passait sans pièces (transition `DECLARE → OUVERT` n'avait qu'une condition `CONTRAT_VERIFIE` ; la garde pièces n'existait que sur `PIECES_INCOMPLETES → OUVERT`, « les pièces sont exigées à l'évaluation, pas à l'ouverture ») ; bandeau « Ouverture bloquée » affiché alors que l'ouverture n'était pas bloquée.
- **02** : l'Accueil n'avait pas la zone de dépôt multiple (réservée aux profils hors « lecture limitée », dont Accueil et GED) : 5 boutons « Téléverser » + « Ajouter un justificatif » ; dépôt fait par Mensah Kpodo via « Dépôt & lecture ». Lecture observée : déclaration 96 % (châssis `JN1CJAN16U0077331`, date 09/06/2026), constat 96 %, carte grise 96 %, attestation 96 %, photos (pas de score, pas de titre lisible mais rattachées), contestation 96 %, devis renommé `IMG_20260618.pdf` 96 % avec **Total du devis : 1 273 000 FCFA** ; lecture < 2 s ; « Voir où chaque valeur a été lue ». Le devis ne donne que dossier, immatriculation et total ; police et châssis sont lus sur la déclaration. Piège : « Verser les N documents » apparaissait dès le 1er fichier lu → 2 pièces (devis, contestation) laissées de côté, dossier à 80 %. Le panneau « Pièces attendues » ne se rafraîchit pas après versement (**seul reste cosmétique ouvert**). Journal : déposant « Mensah Kpodo ».
- **03** : après dépôt, complétude 100 % ; « Reprendre le circuit » passe en actions ouvertes ; `gestionnaireId` vide ; date d'ouverture « 13 sept. 2026 » (horloge figée). Le mot « orienter » promet un choix de volet que l'écran ne propose pas (le dossier est déjà `MATERIEL`).
- **04** : carte « Attribuer le dossier » : « Aucun gestionnaire désigné — l'instruction ne peut pas commencer » ; propose les **cinq** gestionnaires du volet matériel ; `gestionnaireId = u4` ; journal « Réaffectation du dossier · Non affecté → Estelle Lawson · motif » (libellé corrigé en « Affectation »). La carte n'apparaît ni pour l'Accueil ni pour la gestionnaire.
- **05** : actions d'Estelle à l'étape `EN ÉTUDE` : demander des pièces complémentaires, classer sans suite, transmettre au pôle recours, signaler une suspicion de fraude ; « Enregistrer l'évaluation au barème » fermé. Lien mission : `/expertises/mis-vit-SIN-2026-9002-1`. L'action fermée nomme la règle, pas la mission bloquante.
- **06** : le portail SAREX montrait 89 missions à faire / 22 rapports à déposer mais pas 9201 (confiée à AUTO-CONTROL Togo, `utilisateurId: null`) ; « Écran réservé à d'autres profils — Cet écran ne fait pas partie du périmètre « Cabinet d'expertise » ». Rapport `08` lu : dossier, police, immatriculation, châssis, réf. mission `EXP-2026-9201`, n° de rapport `REV-2026-0703`, 445 500 FCFA, point de choc « latéral droit — frottement longitudinal », visite 29/06/2026 ; complétude 88 % « Sous réserve » (« Méthode d'évaluation ou barème retenu », « Valeur vénale et valeur à neuf ») ; bandeau « Rapport enregistré — analyse disponible ». Statut de la page non rafraîchi sans F5 (mission mémorisée sur son seul identifiant).
- **07** : mot « BLOQUANT » absent de l'écran (le guide le promettait) ; puce des comparables sur la fiche dossier (« Analyse IA du dossier »), pas sur la fiche mission ; observé : « Devis au-dessus des références : le prix « pare-chocs » est supérieur de 279 % à la médiane observée sur 776 dossiers » ; fenêtre : « Ce devis : 265 000 FCFA — plus élevé que 83 % des 776 dossiers observés », minimum 5 000, quartiles 35 000 / 70 000 / 180 000, maximum 7 155 000, effectifs 672, 34, 29…. Défauts avant correction : barres de l'histogramme non dessinées ; puce « 1971 devis comparables » contre fenêtre « 776 » ; poste critiqué tiré au sort à chaque rendu (pare-chocs 279 %, puis « optique / feux » 118 % ou 273 %). Trois demandes de complément (pas deux) : méthode et références de prix/barème ; valeur vénale avant sinistre pour apprécier le caractère économiquement réparable ; postes écartés.
- **08** : refus qui tiennent (voir étape 8). Impasse avant correction : 9201 `CONTESTÉE` sans aucune action sauf la note d'honoraires ; l'évaluation exigeait toutes missions non annulées `VALIDÉE` (`workflow.ts:245`) ; `validerRapport` refusait tout statut hors `RAPPORT_RECU` / `COMPLEMENT_DEMANDE` (`expertises-actions.ts:833`) ; aucune sortie de `CONTESTEE`. Corrigé par le statut **Arbitrée** + action « Arbitrer la contestation » (le responsable peut aussi retenir les conclusions initiales) ; l'évaluation compte les missions arbitrées comme closes.
- **09** : écran `/expertises/orientation?ref=SIN-2026-9002` : trois besoins : Automobile & dommages matériels — Nécessaire, confiance haute, 60 000 FCFA, « Mission déjà ouverte (9201) » ; **Responsabilité & circonstances — À confirmer, confiance moyenne, 90 000 FCFA, Retenir / Écarter** ; Investigation & fraude — Non identifié, confiance moyenne, 265 000 FCFA, « aucun signal ». Sources citées : « Constat amiable au dossier », « Responsabilité : partagee ». D0001 : domaine `RESPONSABILITE`, statut « à désigner », priorité normale. Bandeau : « Mission « Responsabilité » ouverte — un expert reste à désigner ». Incohérence avant correction : le panneau de désignation classe CIRCA Investigations (externe, 110 000 FCFA) en #1 devant Komlan Aziagbé (#2).
- **10** : tableau de bord expert interne distinct du portail cabinet ; « Accepter ou décliner cette mission — tant que vous n'avez pas répondu, le délai de rapport ne court pas » ; accepté : rapport attendu le **26 sept. 2026**, délai cible **14 jours**. Formulaire « Rédiger mon rapport » : 8 rubriques (identification du sinistre, date de l'intervention, description des constatations, méthode d'évaluation ou barème retenu — retirée depuis, conclusion explicite, signature et numéro d'agrément, reconstitution de la séquence, imputation motivée), conclusion, montant facultatif, complétude « 0 % · Non exploitable en l'état » au départ → 100 % exploitable. Message : « Rapport déposé. Le service sinistres en est informé. » Bloc « Le rapport face au dossier » : « La responsabilité était déjà arrêtée au dossier avant ce rapport — Référence : partagee ». Validations : D0001 « Rapport validé » ; 9201 (complément demandé jamais revenu) validé avec montant 445 500 pré-rempli et motif, sans avertissement (avertissement ajouté depuis). Collision de suffixes : quittance `QUI-2026-D0001` / mission `EXP-2026-D0001`.
- **11** : onglet Garanties : « Dommages tous accidents » applicable, plafond 9 000 000, **déclaration tardive (95 jours pour un délai contractuel de 5 jours)**, franchise 10 % min 50 000, six exclusions à examiner, tableau « Effet de la garantie sur 780 000 : franchise −78 000, indemnité 702 000 ». La transition vers `ÉVALUÉ` n'exige qu'une garantie « engageable » calculée d'office : la décision de garantie peut être sautée. Avant correction : montant pré-rempli 775 000 (« Proposé par l'instruction technique : 775 000 FCFA · Dommages moyens — mécanique ») passait sans saisie. Après 445 500 : `ÉVALUÉ`, `baremeCode = BAR-MAT`, tranche « Dommages moyens — mécanique » (« M2 » seulement sur la fiche de décision), provision réajustée 780 000 → 445 500 (« Provision réajustée à l'évaluation »), bandeau Règlement : montant évalué 445 500, reste à payer 445 500. « Envoyer en validation » → `VALIDATION` ; Estelle n'a plus que « Signaler une suspicion de fraude ». La franchise de 78 000 n'est pas déduite du montant arrêté et rien ne le dit (question ouverte).
- **12** : action « Valider l'indemnisation et émettre l'ordre de règlement » : « Ordre de règlement de 445 500 FCFA au bénéfice de Mawuli DOGBE. L'émission du paiement revient à la comptabilité. » ; bouton violet « Préparer la fiche de décision » (délai ≈ 2 s ; fiche non affichée d'office) ; fiche : « 183 dossiers similaires · médiane 555 000 FCFA » ; « Art. 28 du Code CIMA : prescription le 08 juin 2028 » ; « Séparation des fonctions : l'émission reviendra à la comptabilité » ; bouton « Rédiger le motif avec l'IA ». Confirmer grisé sans motif ; avec motif : `ORDRE DE RÈGLEMENT ÉMIS`. Actions de secours : « Renvoyer en instruction — réévaluation demandée », « Demander des pièces avant validation ». Carte « Réaffectation » ouverte au responsable à cette étape (collègue Sélom Houngbo présélectionné avant correction). Avant correction, 2 expertises (pas 3) et pas de points de vigilance déclaration tardive/franchise/exclusions.
- **13** : comptable : « Émettre le règlement — quittance et chèque » et « Rejeter l'ordre — anomalie comptable » ; émission → `CHÈQUE À REMETTRE` ; quittance `QUI-2026-D0001`, bénéficiaire Mawuli DOGBE · +228 92 18 44 06, 445 500 FCFA, chèque n° 007001, Ecobank Togo, « Prête, émise par Pascal Ayite » ; onglet « Règlement » : quittance + chèque, date d'édition, puis remise et accusé signé. (Avant correction le n° et la banque étaient posés d'office.)
- **14** : formulaire de remise : rappel « Chèque n° 007001 · 445 500 FCFA · Mawuli DOGBE » ; champs « Retiré par », « N° pièce d'identité », case « Accusé de réception signé par le bénéficiaire », observation. Avant correction : « Retiré par » pré-rempli, pièce d'identité non exigée. Clôture : motif obligatoire ; `CLÔTURÉ` + `dateCloture` ; « Rouvrir le dossier — Réservée à : Responsable, Direction » ; historique des actions : **23 lignes** (profil, geste, avant/après, motif). Avant correction « Transmettre au pôle recours » fermé : *« La responsabilité du tiers doit être arrêtée : une part partagée ou indéterminée se qualifie avant de se réclamer »*.
- **15** : tuiles du fonds : **1 553 unités, 472 dossiers clos à verser, 273 sans image, 63 % d'images scellées, 113 chemises introuvables** ; liste des dossiers clos (9002 en tête, « clos le 13 sept. 2026, image au fonds ») ; formulaire : local (Siège — sous-sol / annexe / Dépôt Akodésséwa), travée (A–F), tablette, boîte, rang, case « sceller l'image » ; message : *« Dossier versé au fonds. Numéro d'archivage attribué : ARC-2026-MATL-00542 — ce numéro ne sera jamais réattribué, et une reconstitution le reprendra suffixé de sa version. »* ; onglet Archivage : support papier « En rayonnage · Siège — sous-sol · travée A · tablette 3 · boîte 2026-047/12 », archive numérique « Fait foi · Scellée » avec empreinte, « Si la chemise venait à manquer : 100 % rétablissable — 9 des 9 pièces, dont 3 en copie seulement » (avant correction 9 pièces ; **11 après**), règle de conservation `MATERIEL`, échéance **2031**. Valeurs juridiques : déclaration et constat = originaux irremplaçables ; carte grise et attestation = originaux rééditables ; photos, devis, contestation = copies ; quittance `QUI-2026-D0001` = original irremplaçable. Avant correction : archive « attribuée le 12 sept. 2026 » pour un dossier « clos le 13 sept. 2026 » (deux horloges) ; bouton de versement proposé à la gestionnaire menant à « Écran réservé à d'autres profils » ; rapport de responsabilité absent du bordereau.
- **16** : remise à zéro : boîte de dialogue « Supprimer les dossiers créés, les fichiers téléversés et les actions faites pendant la démonstration ? » ; `localStorage` vide, redirection tableau de bord ; dossier `DÉCLARÉ`, complétude 0 %, 0/5, aucun gestionnaire ; onglet Missions ne porte plus que 9201 ; D0001, C0001, quittance et unité d'archives disparus ; fichiers PDF du navigateur (IndexedDB) vidés. Remise à zéro **par navigateur**.

### Ce que le rejeu 2 a validé (rejeu-2/README.md, verifications.txt)
104 vérifications (94 au premier compte-rendu, 104 après fermeture des points 8 et 15), 0 échec, aucune erreur JavaScript ; 35 captures. Tests projet : `test:circuit` 228, `test:parcours` 106, `test:expert` 88, types OK. Tableau de corrections : arbitrage (statut Arbitrée) ; contre-expertise à SAREX par le portail (`12-rapport-contre-expertise.pdf`) ; ouverture directe exigeant les pièces ; relecture de la mission à chaque version ; pré-remplissage = chiffrage validé ; une seule horloge monotone qui ne franchit pas minuit ; zone de dépôt multiple pour tout agent ; bouton Verser grisé en lecture ; avertissement « complément non reçu » ; franchise et déclaration tardive dans les points de vigilance ; histogramme avec barres (« 776 devis comparables — pare-chocs ») ; bouton « Changer de profil » ; « Retiré par » vide et pièce d'identité exigée ; versement réservé à l'archiviste ; grille de responsabilité sans méthode d'évaluation ; « Affectation » ; « Responsabilité partagée » ; n° de chèque et banque saisis ; remise à zéro toujours visible ; cabinet initial grisé ; « — Choisir un gestionnaire — » ; `npm run demo:check` (sonde les six écrans) ; numérotation par série (C…, D…) ; part du tiers saisie (obligatoire) + requalification + recours au prorata ; PDF du rapport rédigé généré dans le navigateur (`pdf-simple.ts`, `rapport-pdf.ts`, couche texte WinAnsi).

---

## 4. L'IA dans les parcours

Principe général affiché par la démo : **l'IA propose, l'humain décide ; rien n'est créé sans geste du gestionnaire**. « Une comparaison n'est pas une règle. »

| # | Fonction IA / assistée | Étape | Ce que l'IA propose / affiche | Qui valide | Garde-fous |
|---|---|---|---|---|---|
| 1 | **Lecture de documents (lecture du contenu)** | 2, 6, 9, 12 | Type de pièce reconnu + confiance (ex. 96 %) ; données relevées (dossier, police, immatriculation, châssis, montants, dates, taux d'IPP, n° de rapport, point de choc, date de visite, part du tiers « est fondé à hauteur de 70 % ») ; rattachement à la pièce attendue ; « Voir où chaque valeur a été lue » (extrait exact) | Le déposant (« Verser au dossier ») | Lecture sur le contenu, jamais sur le nom (test du renommage, 50/50 reconnus) ; bouton grisé pendant la lecture ; fonctionne sur le PDF né numérique seulement (couche texte) ; **un scan sans couche texte est annoncé comme tel**, contenu non lu |
| 2 | **Contrôle de complétude du rapport d'expertise** | 6, 9, 12, démos 1, 3, 4 | Pourcentage (88 % « sous réserve » ; 100 % ; 92 % en 9301 ; 100 % sur grille du décès) ; points rouges ; **lit les rubriques présentes mais vides** (« Non précisée », « Non renseignée ») ; grille selon la question : automobile (art. 10 convention), médico-légale, décès (genre de mort, lien de causalité, délai), responsabilité (séquence reconstituée + imputation motivée + part du tiers) | Le gestionnaire (« Décider ») | Le rapport incomplet n'est pas payé « sans que personne l'ait vu » ; pré-remplissage « lu dans le document » modifiable |
| 3 | **Détection d'écart rapport / dossier** (bloc « Le rapport face au dossier ») | 7, démo 1 | « Chiffrage de l'expert inférieur de 65 % au devis du garage » ; écart de 32 % (9001) ; « rapport remis 65 jours après la date attendue » ; question à l'expert rédigée ; 3 demandes de complément prérédigées et cochées | Le gestionnaire : demande un complément, accepte, conteste | Constat présenté comme constat, pas comme gravité (« BLOQUANT » absent) ; le montant retenu par la compagnie n'est pas forcément celui du rapport |
| 4 | **Analyse IA du dossier / historique interne** | 7, 14 | Ligne « Devis au-dessus des références » (ex. +279 % vs médiane de 776 dossiers) ; puce « Historique interne : 776 devis comparables — pare-chocs » ; fenêtre « Ce que le portefeuille a payé » : histogramme, quartiles (35 000 / 70 000 / 180 000), « plus élevé que 83 % » ; estimation comparables **555 000** (médiane 183 dossiers) | Le gestionnaire | « une comparaison n'est pas une règle » ; l'estimation par comparaison ne tient compte d'aucune pièce du dossier ; trois chiffres (instruction 775 000, validé 445 500, comparables 555 000) jamais fondus ; signaux de fraude (« Aucun signal de fraude significatif ») |
| 5 | **Orientation assistée** (« Orientation assistée » dans Missions d'expertise) | 11, démo 3 | 3 besoins avec recommandation (Nécessaire / À confirmer / Non identifié), confiance (haute/moyenne), budget indicatif (60 000 / 90 000 / 265 000 FCFA), justification et sources (« Constat amiable au dossier », « Responsabilité : partagée ») ; propose une lecture interne plutôt qu'un cabinet extérieur « par réflexe » (sous le seuil, sans soupçon de fraude) ; au-delà du seuil de 2 000 000 : **expertise externe imposée avec son motif** ; second besoin (perte d'exploitation, 9003) proposé, pas créé | Le gestionnaire : « Retenir ce besoin » / « Écarter » | L'assistant ne crée rien ; double retenue impossible (« Mission déjà ouverte ») ; classement de désignation distinct, avec règles dures (panel interne refusé en contre-expertise, cabinet initial écarté) ; écart à signaler : le classement de désignation plaçait l'externe (110 000) devant l'interne |
| 6 | **Classement des experts à la désignation** | 8, 12 | Classement (SAREX #1, TOGO-SINISTRE #2, internes avec réserve) ; « expert interne : aucun honoraire à engager » | Le responsable | Contre-expertise : jamais au panel interne ni au cabinet initial (règle dans l'action, pas seulement dans la liste) ; décision motivée |
| 7 | **Fiche de décision préparée** (points forts / points de vigilance) | 14 | Points forts : pièces 5/5, 3 expertises closes, tranche M2 du barème BAR-MAT, cohérence 183 comparables (−20 %), pas de fraude, part du tiers/recours 311 850 ; vigilance : hors délai 73 jours, déclaration tardive (95 pour 5), franchise, six exclusions ; « Art. 28 du Code CIMA : prescription le 08 juin 2028 » ; séparation des fonctions | Le responsable (ou la direction) | Confirmer grisé sans motif ; seuil de délégation 2 000 000 FCFA |
| 8 | **« Rédiger le motif avec l'IA »** | 12 (fiche de décision) | Rédaction du motif de validation | Le responsable (motif obligatoire à confirmer) | Le motif reste obligatoire et humain à la confirmation |
| 9 | **Barème appliqué seul** | 13 | Tranche et code barème (BAR-MAT M2 « Dommages moyens — mécanique ») ; réajustement de la provision | Le gestionnaire arrête le montant | Écart avec le chiffrage validé : motif obligatoire |
| 10 | **Analyse de fraude** | 5, 12, scoring | Signal « Aucun signal de fraude significatif » ; action « Signaler une suspicion de fraude » ; besoin « Investigation & fraude » 265 000 FCFA (non identifié) | Gestionnaire / contrôle interne | Scoring et revue de fraude dans le contrôle interne (`controle-hub.ts`), séparation des fonctions `SEP-01` |
| 11 | **Assistant (admin)** | — | Profil Administrateur gère « Comptes, rôles, barèmes, assistant » | Administrateur | (non joué dans 9002) |

Limites déclarées : la lecture tourne dans le navigateur, sans serveur ; pas de reconnaissance optique ; un « poste critiqué » de l'analyse IA était tiré au sort à chaque rendu avant correction (à figer : l'analyse d'un dossier ne doit pas changer entre deux consultations — constat 99 n° 11, statut final non détaillé).

---

## 5. Retours et remarques critiques (exhaustif)

### 5.1 `README.md` du dossier retour — cinq constats (tous corrigés le 21/09/2026)
1. Le guide envoie SAREX déposer le rapport 9201 alors que la mission est à AUTO-CONTROL Togo, sans compte ; le portail répond « Écran réservé à d'autres profils » (README ; 06).
2. Contester le rapport condamnait le dossier : mission `CONTESTÉE` sans action, évaluation exigeant toutes les missions `VALIDÉE` ⇒ jamais évaluable (README ; 08).
3. « Ouvrir et orienter vers le volet » n'était pas refusé sans les pièces (README ; 01).
4. La page mission ne se rafraîchissait pas après une action, sans F5 (README ; 06).
5. Montant d'évaluation pré-rempli à 775 000 au lieu de 445 500 (README ; 11).
Résultat en une phrase : le circuit va de la déclaration à l'archive et **chaque refus de séparation des fonctions tient** ; le guide décrivait quatre choses que l'écran ne faisait pas.

### 5.2 `99-retour-personnel.md`

**§1 Présentateur.** Ce qui porte : devis renommé reconnu à 96 % avec 1 273 000 ; complétude 88 % avec deux rubriques « présentes mais vides » et trois demandes de complément prérédigées ; fiche de décision (pièces, expertises, barème, comparables, fraude, prescription CIMA, séparation des fonctions). Les refus tiennent (gestionnaire ne s'attribue pas, ne valide pas, ne règle pas ; contre-expertise interdite au gestionnaire et au panel interne ; identité exigée à la remise ; motif obligatoire à l'attribution, à la validation et à la clôture). Ce qui aurait fait perdre la salle : 4 comportements annoncés non conformes (ouverture sans pièces ; SAREX/9201 ; contester condamne ; Komlan dépose un PDF au lieu de rédiger) + 3 pièges silencieux (page mission sans mise à jour ; 775 000 pré-rempli ; nom du bénéficiaire pré-rempli rendant le « refus sans identité » invisible sans vider le champ) ; `test:circuit` et `test:parcours` n'auraient pas prévenu (« ils testent la logique, pas l'écran »). Avant la séance : rejouer la veille sur le poste de la salle, réécrire étapes 1, 6, 8, 10, décider de ne pas enregistrer la contestation, se noter « à l'évaluation, effacer 775 000, taper 445 500 ». Temps : 20 minutes promises, **~35 minutes** réelles (14 changements de profil par déconnexion, rechargements, deux détours).

**§2 Questions probables de l'équipe sinistres (demandes de changement implicites).**
- « Pourquoi vous validez un rapport dont vous attendez encore le complément ? » (9201 validé en `COMPLEMENT_DEMANDE` sans que méthode ni valeur vénale soient revenues).
- « Et la franchise ? » (78 000 FCFA calculés en Garanties ; montant arrêté 445 500 « tout rond » ; où est-elle passée ?).
- « La déclaration est tardive de 90 jours, et on paie ? » (l'onglet Garanties le dit ; la fiche de décision ne citait que le hors-délai de traitement). [chiffre « 90 jours » du retour ; la démo affiche 95 jours pour 5 — incohérence de rédaction à ne pas reprendre.]
- « Le rapport de responsabilité dit 70 % au tiers, pourquoi le recours est bloqué ? » (responsabilité du dossier restée « partagée » ; 70 % de 445 500 FCFA non réclamés).
- « Il faut vraiment se déconnecter pour changer de rôle ? » (un responsable prend souvent la main sur le poste d'un gestionnaire).
- « Pourquoi les dates disent 12 septembre ? » (horloge figée visible dans journal et archive antérieure à la clôture).
- « Le graphique est vide. » (axes sans barres).
- « D'où vient le chèque 007001 Ecobank ? » (le comptable n'a rien saisi).
Appréciés : actions fermées avec leur motif (« réservée à… », « le dossier doit avoir été attribué… ») ; onglet Garanties ; bordereau de versement avec valeur juridique de chaque pièce ; « une comparaison n'est pas une règle ».

**§3 Améliorations classées (23 points ; tous faits et vérifiés au 21/09/2026).**
- Bloquantes : 1 sortie d'une mission contestée (arbitrage ; ne plus la compter comme ouverte — `expertises-actions.ts`, `workflow.ts:245`) ; 2 recalcul de la mission à chaque version (`expertises/[id]/page.tsx:101`) ; 3 réécrire le guide aux étapes 1, 6, 8, 10 + ajouter Garanties + dire que la fiche de décision se prépare d'un clic + « Dépôt & lecture » pour le dépôt multiple ; 4 pré-remplir l'évaluation avec le montant validé par l'expert et faire confirmer un montant différent (`ActionsWorkflow.tsx:49`).
- À faire vite : 5 une seule horloge (`mock-data.ts:67`, `demo-journal.ts`) ; 6 zone de dépôt multiple pour l'Accueil (`dossiers/[ref]/page.tsx:143`) ; 7 désactiver « Verser les N documents » pendant la lecture (`depot/page.tsx`) ; 8 requalifier la responsabilité sur rapport de responsabilité validé (part du tiers) pour débloquer le recours ; 9 rappel « complément non reçu » à la validation ; 10 franchise et déclaration tardive dans la fiche de décision (`FicheDecisionIA`) ; 11 histogramme (barres ; accorder « 1971 »/« 776 » ; figer l'analyse IA — `CopiloteIA`/`DossierIA`) ; 12 changement de profil sans déconnexion (`Sidebar.tsx`).
- Finitions : 13 ne pas pré-remplir « Retiré par » + exiger le n° de pièce d'identité ; 14 griser avec motif « Verser au fonds » pour les profils sans droit ; 15 rapport rédigé en ligne = pièce (PDF) au dossier et au bordereau ; 16 grille de responsabilité sans « méthode d'évaluation » ni « n° d'agrément » pour un expert interne ; 17 journal « Affectation » / « Réaffectation » ; 18 codes qui fuient (« partagee ») ; 19 comptable saisit n° de chèque et banque ; 20 bouton « Réinitialiser la démo » visible, grisé ; 21 cabinet initial écarté montré, grisé avec motif ; 22 réaffectation sans collègue présélectionné ; 23 script « avant séance » (serveur figé trouvé au départ).
- Remarque sur les tests : `test:circuit` et `test:parcours` passaient alors que 1 à 4 existaient ; ils simulent le stockage et appellent les fonctions, ne voient ni pré-remplissage, ni page non rafraîchie, ni guide contradictoire ; les scripts Playwright (`scripts/`) sont un début de test d'écran à rejouer avant chaque séance (5 min).
- §4 Ce que je garde : « le guide et l'application ne racontent plus la même histoire, et personne ne l'a rejouée à l'écran. »

### 5.3 Remarques par fichier d'étape (au-delà des 23 points)
- `00` : script avant séance (serveur < 2 s sinon relance) ; vrai sélecteur de profil ; reset toujours visible ; « tiers étendu » (guide) vs « Automobile — Tous risques » (écran).
- `01` : décider si la transition directe exige les pièces ou si le guide dit de passer par « en attente de pièces » ; bandeau « Ouverture bloquée » ne doit pas s'afficher si non bloquée ; le chemin « en attente de pièces » raconte mieux le guichet réel (le dossier existe, on sait ce qui manque, on relance l'assuré).
- `02` : donner la zone de dépôt multiple à l'Accueil ; « N lus sur M » ; rafraîchir « Pièces attendues » (reste ouvert) ; le guide attribuait au devis des données (police, châssis) lues sur la déclaration.
- `03` : « orienter vers un volet » = vrai geste métier ? afficher un sélecteur avec volet proposé par défaut, sinon renommer ; dater les gestes du jour réel ou prévenir que la démo vit au 12 septembre 2026.
- `04` : libellé journal « Affectation » puis « Réaffectation ».
- `05` : nommer la/les missions bloquantes sur l'action fermée avec lien (« EXP-2026-9201 — rapport attendu depuis le 9 juillet »).
- `06` : décider ce que la plateforme fait des cabinets sans compte (un compte par cabinet agréé — le portail le mérite — ou la gestionnaire saisit pour eux ; **question ouverte du document « Espace expert »**) ; le guide se contredisait entre étapes 6 et 8 (AUTO-CONTROL déjà intervenu).
- `07` : « BLOQUANT » inexistant ; poste critiqué instable ; histogramme vide ; 1971 vs 776.
- `08` : le refus du cabinet initial ne se voit pas s'il n'est pas listé (désormais ligne grisée) ; on ne peut montrer que le refus du panel interne ; moment le plus fort du guide mais plante la démo 20 minutes plus tard ; sortie de contestation à définir (validation de la contre-expertise ferme la source / action « Arbitrer » : retenir le premier rapport, retenir la contre-expertise, ou annuler).
- `09` : quand l'orientation conclut « sans mission extérieure », le classement de désignation devrait mettre le panel interne en tête (ou expliquer pourquoi un externe est #1) ; afficher « 0 FCFA si panel interne » à côté du budget indicatif de 90 000 ; la nuance « 90 000 FCFA non engagés » vs budget indicatif 90 000 FCFA affiché ; code « partagee » qui fuit.
- `10` : guide (« rédige » et non « dépose ») et retirer ou justifier le fichier `11-…pdf` ; grille de responsabilité (méthode, agrément facultatifs/retirés) ; rappel « complément non reçu » ; collision de suffixe `QUI-2026-D0001` / `EXP-2026-D0001`.
- `11` : onglet Garanties absent du guide (une minute qui vaut le détour) ; tranche « M2 » vs « Dommages moyens — mécanique » ; bloc « Pourquoi ce montant ? » inexistant sous ce nom (calcul d'instruction et estimation comparables côte à côte dans « Analyse IA ») ; **la franchise de 78 000 n'est pas déduite et rien ne le dit** ; la garantie peut être sautée (transition exige seulement une garantie « engageable » calculée d'office).
- `12` : préparer la fiche de décision automatiquement ou l'annoncer ; réaffectation sans présélection ; chemin de secours si montant faux (« Renvoyer en instruction », « Demander des pièces avant validation ») ; seuil de délégation invisible tant qu'il n'est pas atteint (c'est le dossier 9003 qui le montre).
- `13` : n° de chèque/banque saisis.
- `14` : exiger le n° de pièce d'identité ; requalification de la responsabilité sinon la « seconde expertise » ne sert à rien après clôture.
- `15` : une seule horloge ; rapport rédigé en ligne → pièce ; masquer/griser « Verser au fonds » ; guide arrêté à la clôture, archivage décrit pour 9004.
- `16` : remise à zéro par navigateur : répéter sur un poste et présenter sur un autre = états différents (force et piège).
- `rejeu-2/README.md` : reste cosmétique : panneau « Pièces attendues » de « Dépôt & lecture » non rafraîchi après versement.
- `DEMO_SIN-2026-9002.md` (guide corrigé) : « dites-le avant qu'on vous le demande » (date figée) ; ouvrir sur `localhost:3100`.
- `SCENARIOS_DEMONSTRATION.md` : « Dites-le avant qu'on vous le demande » pour la lecture sans serveur ; un rapport déposé aujourd'hui sur une mission lancée en juillet apparaît en retard (« à ne pas prendre pour un bug »).

---

## 6. « Ce qui est simulé » — à rendre réel

| # | Ce que la démo fait sans serveur | Source | À rendre réel |
|---|---|---|---|
| 1 | **Toutes les données sont générées en mémoire** par un PRNG déterministe à graine fixe (`mock-data.ts`) ; portefeuille ≈ 3 500 dossiers sur 25 000 contrats ; ≈ 300 en instance ; 4 dossiers épinglés reproduisent les écrans de la proposition (`SIN-2026-0418`, `0402`, `SIN-2025-1977`, `1840`) ; les `*-hub.ts` sont les seuls fichiers à rebrancher | README app | Backend sinistres (API `/api/v1/*` proxiée vers `127.0.0.1:3101`, schéma de `prospera-web`) ; données réelles de la compagnie |
| 2 | **Horloge figée au 12 septembre 2026** (`AUJOURDHUI`) pour éviter l'écart d'hydratation ; journal/archives/dates (13 sept. etc.) | README app ; 03, 15, 99 | Horloge réelle ; délais réglementaires calculés sur dates réelles ; une seule horloge pour journal, décisions, archives |
| 3 | **L'état de la démo vit dans le `localStorage` du navigateur** ; fichiers PDF dans **IndexedDB** ; remise à zéro propre à chaque navigateur ; « le stockage est simulé en mémoire » dans les tests | README retour ; 16 ; SCENARIOS | Persistance serveur partagée entre postes et utilisateurs ; GED réelle |
| 4 | **Authentification** : comptes de démo, mot de passe unique `password123`, profils = cartes ; changement de profil sans mot de passe | DEMO ; 00 | Authentification réelle, rôles/habilitations, sessions, traçabilité par utilisateur ; comptes pour cabinets d'expertise (AUTO-CONTROL n'a pas de compte : question ouverte) |
| 5 | **Lecture des documents dans le navigateur** (couche texte du PDF, pdf.js), sans serveur ; scan en image non lu | SCENARIOS | Service OCR/lecture dédié (reconnaissance optique pour scans, photos, constats manuscrits) ; l'étape « OCR » de la colonne est un libellé (« Texte extrait ») |
| 6 | **PDF générés pour la démo** (50 + 1 = 51 documents, `scripts/vitrine/generer.py`) et **PDF du rapport rédigé en ligne généré dans le navigateur** sans bibliothèque (`pdf-simple.ts`, `rapport-pdf.ts`) | SCENARIOS ; rejeu-2 | Génération documentaire serveur (lettres de mission, rapports, quittances, chèques, courriers, bordereaux) avec modèles de la compagnie |
| 7 | **Données fictives** : assurés, immatriculations, constats, rapports ; `TG-7733-CD`, `Mawuli DOGBE`, `Union Assurances Togo`, `AUTO-CONTROL Togo`, `SAREX` etc. | SCENARIOS | Référentiels réels (tiers, assureurs adverses, cabinets d'expertise agréés, garages) |
| 8 | **« Envoi simulé »** : « Le service sinistres en est informé », « Complément demandé à l'expert », « Expert désigné », courrier postal du rapport 9201 (reçu par courrier, saisi à la main) — aucune notification/courrier/SMS réel (le bénéficiaire a un téléphone +228 92 18 44 06 affiché) | 07, 10, 13 | Notification (e-mail/SMS/courrier) à l'expert, à l'assuré, à la comptabilité ; suivi des délais ; portail ou courrier numérisé |
| 9 | **Comptabilité simulée** : quittance, chèque (n° saisi, banque Ecobank Togo), rapprochement, état mensuel ; aucun flux bancaire réel ; provision réajustée à l'évaluation sans écriture comptable | 13 | Écritures comptables, émission réelle du chèque/virement, rapprochement bancaire, états CIMA |
| 10 | **Barème** (BAR-MAT, tranche M2 « Dommages moyens — mécanique ») appliqué sur un référentiel mock (`mock-referentiel.ts`) ; calcul d'instruction 775 000 ; estimation comparables sur portefeuille généré (183 / 776 dossiers) | 11, 12 | Barèmes de la compagnie administrables ; comparables sur dossiers réels réglés |
| 11 | **Garantie** : examen automatique (contrat valide, exclusions, franchise, déclaration tardive) sur polices mock (`AUT-2025-07733`) ; effet de la garantie « franchise −78 000, indemnité 702 000 » non appliqué au montant arrêté | 11 | Intégration au système contrats/polices ; décision de garantie opposable (acte) ; règle franchise à trancher |
| 12 | **Archivage** : fonds physique fictif (1 553 unités, 472 clos à verser, 113 chemises introuvables…), numéro `ARC-2026-MATL-…`, empreinte, scellé, localisation (Siège sous-sol, Dépôt Akodésséwa) ; reconstitution et certification simulées | 15, SCENARIOS | GED/archivage réels : scellement/horodatage, empreinte, règles de conservation (`MATERIEL`, échéance 2031), numérotation jamais réattribuée |
| 13 | **Journal / piste d'audit** simulé en local (23 lignes pour 9002) ; contrôle interne `SEP-01`, scoring de fraude générés | 14 ; README app | Journal inviolable côté serveur ; scoring de fraude réel |
| 14 | **Analyse IA** (comparables, écarts, orientation, fiche de décision, « Rédiger le motif avec l'IA ») : règles/calculs déterministes locaux, pas de modèle d'IA hébergé ; poste critiqué tiré au sort avant correction | 07, 12 | Moteur d'analyse réel avec traçabilité des sources ; garde-fous « l'IA propose, l'humain décide » |
| 15 | **Mises en demeure / recours** (pôle recours, créances, 9001 rejoue le recours) | DEMO | Module recours réel vers l'assureur adverse (Union Assurances Togo) |
| 16 | **Disponibilité** : serveur Next en dev (Turbopack), `npm run demo:check` ; rien de production ; build webpack à problèmes ; WebSocket HMR | 00 ; README app | Exploitation, supervision, performance |

Seuils et règles que la démo code en dur et qu'il faudra confirmer avec la compagnie : seuil de délégation 2 000 000 FCFA (Responsable → Direction) ; contre-expertise ordonnée par responsable/direction seulement ; jamais au panel interne ni au cabinet initial ; versement au fonds seulement dossier clos ; délais conventionnels article 9 (10 j / 45 j / 75 j) ; contradictoire article 8 ; délai de rapport cible 14 jours (expert interne) ; délai de déclaration contractuel 5 jours ; franchise 10 % min 50 000 ; prescription article 28 Code CIMA (08/06/2028, soit 2 ans) ; fiche de décision hors-délai 73 jours ; budget contre-expertise 90 000 ; honoraires expertise externe classée 110 000 vs interne 0 ; volume 3 500 sinistres par an ; « Séparation des fonctions » : instruction ≠ validation ≠ règlement ≠ remise ≠ archivage.
