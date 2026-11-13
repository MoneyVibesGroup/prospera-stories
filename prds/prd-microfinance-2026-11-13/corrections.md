# Feuille d'arbitrage — PRD Microfinance (2026-11-13)

Synthèse de cinq rapports : `reconcile-po.md` (67 décisions : 56 fidèles, 11 déformées), `reconcile-demo-credit.md` (25 écarts), `reconcile-sources.md` (62 IA : 55 couvertes, 6 vagues ; 20 écarts), `review-rubric.md` (solide ; 0 critique, 3 graves, 8 moyens, 4 mineurs), `review-adversarial.md` (« inutilisable tel quel pour l'architecture » ; 5 critiques, 11 élevés, 14 moyens, 6 faibles).

Deux listes : **P** = questions que seul le PO tranche (avec la recommandation) ; **A** = corrections appliquées d'office, parce qu'elles alignent le PRD sur une décision déjà prise, sur la démo (« ce que la démo montre, le produit le fait »), sur la réglementation, ou réparent une contradiction interne.

## Réponses du PO (2026-11-13) — elles font foi

- **P1, P2, P4, P7, P8 : acceptés** tels que recommandés.
- **P3** : deux échelles distinctes (classe de risque à l'octroi, pour information ; classes réglementaires du pays, paramétrables, barème SFD par défaut). Les **cinq classes du rapport d'exemple sont retirées** : vérifiées, elles diffèrent du référentiel SFD (Normal 1 %, Sous surveillance 10 %, Douteux, Compromises 80 %, Contentieux 100 %, sous une « Instruction 001-01-2020 » introuvable ; le référentiel SFD classe par ancienneté de l'impayé : ≤ 3 mois facultatif, ≤ 6 mois 40 %, 6-12 mois 80 %, 12-24 mois 100 %, perte au-delà). Le rapport BCEAO utilise les tranches réglementaires (état DIMF 2010 : ≤ 3, > 3 à ≤ 6, > 6 à ≤ 12, > 12 à ≤ 24 mois). Ne jamais citer l'« Instruction 001-01-2020 ».
- **P5** : l'IMF a un **contrat de maintenance payé chaque mois**, en plus de la licence à vie ; mises à jour et correctifs (sécurité, réglementation) sont livrés sous ce contrat.
- **P6** : le **DG peut définir le comité pour un dossier** (en choisir les membres), pour faciliter ; composition par défaut ROC + (DG ou RA) ; vote de chaque membre enregistré. La règle « RA d'une autre agence au-dessus d'un seuil » n'est **pas** retenue.
- **P9** : le moteur est l'**IA commune**, comme décidé en salle : une **instance locale** chez l'IMF prédit, **enregistre l'écart** entre ses prédictions et ce qui se passe, **anonymise**, **renvoie** ces écarts pour l'apprentissage et **reçoit ses mises à jour** par un **tunnel sécurisé** sortant ; le **Copilot tourne dans cette instance**.

## P. Questions au PO

| # | Question | Recommandation | Sources |
|---|---|---|---|
| P1 | **Le reste dû a trois porteurs** (échéancier officiel du cœur, Créance de `paiement`, solde recalculé) et le PRD dit tour à tour que chacun fait foi. Risque concret : un client paie au guichet du cœur, la Créance de `paiement` reste ouverte, le lien de paiement de J-3 réclame un montant périmé, il paie deux fois. | `paiement` reste **propriétaire** de la Créance (Q2). Mais son **montant exigible** est recalé sur la dernière lecture du cœur : un lien de paiement n'est émis qu'après relecture du reste dû (âge maximal en paramètre) ; un mouvement du cœur sans paiement Prospera correspondant réduit ou ferme la Créance ; en cas d'écart de montant, la valeur affichée au client est celle du cœur, et l'écart va dans la file des écarts. | adversarial K1, H1 ; reconcile-po I2 |
| P2 | **Le score bloque-t-il ?** Le PRD le dit « information » mais bloque sous 45 et majore le taux sous 60 ; un premier emprunteur (Afi, UJ-1) n'a pas d'historique de paiement (40 % du barème). | Le score est une **information et une alerte**, jamais un refus automatique ni un levier de prix en v1. Les seuls blocages automatiques sont : KYC, usure, ancienneté, taux d'effort, blocage de recouvrement. Pour un premier emprunteur, la composante « paiement » est absente et le score se calcule sur les autres, en le disant. | adversarial K5, M14 ; reconcile-po I5 |
| P3 | **Les classes de risque** : la démo en a trois échelles. (a) Classe du dossier à l'octroi (score : 75 / 55 / 35 / 15) ; (b) classes réglementaires de provision (barème SFD : 40 / 80 / 100 % à 6, 12, 24 mois) ; (c) cinq classes du rapport BCEAO d'exemple (Normal 1 %, Sous surveillance 10 %, Douteux, Compromis 80 %, Contentieux 100 %). | Garder **deux échelles distinctes et nommées** : (a) classe de risque à l'octroi, cinq classes, information seulement ; (b) classes réglementaires du pays (paramètre), barème SFD par défaut, qui servent au rapport BCEAO. Les cinq classes de l'exemple deviennent un **autre jeu de paramètres** possible, choisi par l'IMF ; la provision de 1 % sur les prêts sains est un paramètre, à 0 par défaut. | reconcile-demo-credit E-07 ; reconcile-sources B-1 ; adversarial M2 |
| P4 | **Le refinancement** (un nouveau prêt qui solde l'ancien, avec l'économie mensuelle) est montré par la démo, sans aucune exigence. | L'exiger : c'est un **nouveau dossier** qui suit tout le circuit, porte la mention « refinancement », et solde l'ancien prêt au décaissement confirmé par le cœur. L'économie mensuelle est calculée. Il est interdit sur un prêt en contentieux ou en perte. | reconcile-sources I-1 |
| P5 | **Les correctifs de sécurité et de réglementation** (plafond d'usure, listes de sanctions, textes BCEAO) sans contrat de maintenance, pour une IMF à licence à vie. | Ils sont livrés **même sans contrat de maintenance**, pendant une période de support fixée au contrat. Le reste des mises à jour suit le contrat de maintenance. | adversarial H6 ; rubric |
| P6 | **Le comité** : le ROC plus le RA de l'agence qui a instruit le dossier, c'est la même chaîne ; et le ROC compte pour deux. | Le vote de chaque membre est enregistré. Au-dessus d'un seuil (paramètre ; défaut : 1 000 000 FCFA), l'autre membre ne peut pas être le RA de l'agence qui a instruit : c'est le DG ou le RA d'une autre agence. | adversarial M5 |
| P7 | **Le blocage des cautions** (D1 : un dossier bloqué suspend les demandes du client et de ses cautions). Cela frappe des personnes qui n'ont rien fait. | Le client est bloqué en plein. Une caution n'est bloquée que si elle a été **appelée** (statut APPELE). Le client bloqué a un recours, et le blocage est réexaminé au plus tard tous les 6 mois. | adversarial M6 |
| P8 | **Le taux d'effort** : rien ne bloque le surendettement. | Plafond **bloquant** de taux d'effort (mensualités de tous les prêts connus ÷ revenu net ; paramètre ; défaut : 40 %), avec dérogation motivée du ROC. | adversarial M3 |
| P9 | **Le Copilot sans consentement à l'IA commune** (Q9 du §12.2) : où tourne-t-il ? | Sur les serveurs de l'IMF, sur ses seules données. Sans moteur disponible, l'emplacement est « bientôt » ; D-16 devient « Copilot réel si le moteur tourne chez l'IMF ». La reconnaissance vocale est désactivée sans consentement propre. | adversarial H9 ; reconcile-sources I-3 |

## A. Corrections appliquées d'office

### A.1 Contradictions internes (bloquantes)

| # | Correction | Où |
|---|---|---|
| A1 | EN_GESTION à la décision du comité, partout : retirer « le passage à EN_GESTION est refusé » de l'annexe A.1 C4 ; le cœur fictif crée le prêt et l'échéancier officiel **à l'exécution** de l'ordre, pas à l'acceptation (annexe C). | A.1 C4, annexe C |
| A2 | FR-87 : distinguer « décision du comité » (personnel prévenu) et « décaissement CONFIRME » (client prévenu). | FR-87 |
| A3 | Une **table de transitions complète** : statuts de crédit et sous-état de décaissement, acteur par ligne, gardes ; REFUSE → EN_ANALYSE (réexamen unique), retours vers EN_ATTENTE_DOCUMENTS, ANNULE possible tant que le décaissement n'est pas CONFIRME (avec message d'annulation au cœur), REFUSE « à tout moment » sauf après CONFIRME (le recouvrement prend le relais). Idem pour le recouvrement : acteur et garde par transition, clôture par solde nul même après perte (« radié puis recouvré »). | §5.11, FR-214 |
| A4 | **Ordre de décaissement rejeté, expiré ou à l'état inconnu** : état INCONNU avec rapprochement obligatoire contre le relevé du fournisseur avant toute réémission ; clé d'idempotence jamais régénérée ; au redémarrage ou après restauration, rapprochement des ordres de la dernière heure. Un ordre rejeté revient À_ORDONNER avec motif ; un dossier EN_GESTION dont le décaissement échoue peut être ANNULE. | FR-64 à FR-70, §7.9 |
| A5 | Retirer « aucune IA propre (décision du PO) » de §7.8, de l'en-tête de l'annexe A, de A.4 C11 et A.15 ; retirer « pas un modèle (décision D8) » de FR-227 (règle v0 puis modèle). | §7.8, annexe A, FR-227 |
| A6 | **KYC** : validé avant la demande (récit, phase 1) ; une seule règle dans FR-30, FR-43, FR-120, FR-66, FR-78. | FR-30, FR-43, FR-66, FR-78, FR-120 |
| A7 | **PAR** : un seul jeu de seuils de départ, dans une **table unique des paramètres** (nouvelle annexe D) citée par chaque FR ; PAR 1, 7, 30, 60, 90 disponibles (PAR 60 ajouté), alertes calibrées sur les données de l'IMF (E5). Aligner FR-173, FR-179, FR-185, FR-230, FR-231. | annexe D, FR-173 à FR-231 |
| A8 | **Rapprochement à moins de 1 %** : il choisit l'échéance, il ne la solde pas ; tout écart est un paiement partiel ou un trop-perçu ; la relance ne s'arrête que quand le reste dû est nul ; une tolérance d'arrondi (quelques FCFA) est un paramètre distinct. | FR-210, FR-256 |
| A9 | **Remise des espèces** : la collecte est un encaissement pour le compte de l'IMF ; la remise au guichet est un transfert de caisse du collecteur vers le guichet, jamais un second crédit du client ; clé d'appariement obligatoire (numéro de reçu Prospera) dans l'annexe C. | FR-135 à FR-149, annexe C |
| A10 | Restauration : une seule fréquence (FR-267 mensuelle contre NFR-4 trimestrielle) → mensuelle. | FR-267, NFR-4 |
| A11 | Créer `addendum.md` (cité huit fois, absent) : y ranger les choix techniques renvoyés (forme de l'échange, relais, idempotence, chiffrement local…). | dossier |

### A.2 Usure et produits de démo

| # | Correction | Où |
|---|---|---|
| A12 | **Méthode du TEG figée** : taux actuariel de la période × nombre de périodes dans l'année (« actuariel annuel proportionnel »), frais retenus au décaissement et assurance obligatoire inclus ; la publication d'un produit vérifie le TEG **au pire cas** (durée la plus courte, frais les plus élevés, assurance comprise). La méthode reste à faire valider par un juriste (§12.3) : tant que ce n'est pas fait, le blocage est appliqué et le motif l'affiche. | FR-10, FR-36, FR-100 à FR-111 |
| A13 | **Produits de démo conformes, vérifiés** : par exemple « Crédit Commerce » 1,25 %/mois, frais 1 %, 6 à 24 mois (TEG de 15,9 % à 18,5 %) ; aucune durée de 3 mois avec frais. Tableau de TEG de référence (3, 6, 12, 24 mois × frais 0, 1, 2 %) comme jeu d'essai. | FR-11, FR-13, FR-111 |

### A.3 Ce que la démo montre et que le PRD n'exige pas

| # | Correction | Où |
|---|---|---|
| A14 | Onglet **« Client » du dossier** : identité, mouvements du compte sur la période (lus du cœur), indicateurs (nombre de mouvements, ratio de dépôts, total des dépôts, solde maximal), localisations vérifiées, prêts antérieurs ; source des flux Mobile Money ajoutée à l'annexe C. | §5.4, annexe C |
| A15 | **Perte attendue par dossier** (encours × probabilité de défaut × perte en cas de défaut ; perte tirée des garanties) dans le rapport du ROC et la fiche, marquée « estimation ». | FR-53, FR-181 |
| A16 | L'IA propose au ROC un **montant, une durée et un taux** justifiés, bornés par le produit, l'usure et le taux d'effort ; sans IA, la proposition du CC. | FR-49, FR-53 |
| A17 | Écrans à exiger : **contrôle quotidien du ROC** et écran réseau ; **demandes en attente depuis plus de 48 h** ; **Opérations bancaires** ; **portefeuille du GP** ; liste, vue consolidée et statistiques de l'**épargne** (lues du cœur) ; vues **audit agences** et **audit BCEAO** ; onglet **Preuves** des relances ; **campagnes de relance** ; matrice onglet × rôle de la fiche dossier. | §5.14, §6.2, §6.8, §7.2, §7.3, annexe B |
| A18 | **Risque** : entonnoir d'ancienneté, carte de chaleur PAR × agence, taux de recouvrement, de défaut, de perte, restructurés du mois, taux de couverture du PAR. **Calendrier réglementaire** : liste des états avec périodicité paramétrable, ou « fait hors Prospera ». | §6.7, §6.8 |
| A19 | IA restées vagues : Copilot par rôle (questions types pour les 16 rôles), classe BCEAO prévue, vérification du comportement de crédit (sortie : note et facteurs), analyse du comportement de retard à l'ouverture de la fiche du mauvais payeur, Copilot du DAF et perte attendue, alerte de contrôle de gestion « bientôt », Copilot marketing ; IA des cahiers absentes : alerte de concentration des retards, prévision de l'encours d'épargne, segmentation des épargnants, scénarios de PAR « avec ou sans actions » ; cohésion du groupe et alerte de contagion. | FR-8 et sections citées |
| A20 | Checklist : « cautions visitées » et « dossier de chaque caution reçu ». Définition chiffrée des règles d'alerte du dossier (ex. dépôt suspect > 15 % du montant demandé 24 à 72 h avant le rendez-vous). | FR-48, FR-50 |
| A21 | Comptabilité : les sous-onglets de la démo (balance, journal, grand livre, résultat, bilan, rapprochements, suspens) sont inventoriés « bientôt » ; contrôle de gestion « bientôt ». | FR-252, FR-253 |

### A.4 Sécurité, conformité, équité

| # | Correction | Où |
|---|---|---|
| A22 | **Fraude à l'octroi** : visiteur ≠ créateur de la fiche ≠ auteur de la demande ; bénéficiaire du décaissement pré-enregistré au KYC, tout changement en double contrôle ; préparateur ≠ valideur ≠ décideur pour tous les canaux. | FR-6, §5.8 |
| A23 | **ADMIN_IMF et journal** : écrire ce qui est garanti (aucun accès par l'application) et le risque résiduel sur un serveur que l'IMF administre ; journal chaîné avec empreintes déposées hors de l'hôte. | FR-5, FR-9 |
| A24 | **Équité de l'IA** : liste fermée des variables autorisées dans le score (sans genre, situation matrimoniale, nationalité, religion) ; suivi des taux d'acceptation par genre, zone, secteur, lu par l'AUD et le RSQ ; motif communicable au client. | FR-8, FR-124 |
| A25 | Motif face à l'IA : la proposition s'affiche **après** le premier avis du CC ; alerte à l'AUD si la part d'alignement est anormale. | FR-49, FR-8 |
| A26 | Création des rôles qui touchent à l'argent ou à la décision : validée par un rôle métier (DG ou RA), pas par un second administrateur. | FR-5 |
| A27 | Application hors ligne : chiffrement local, verrouillage, effacement après un délai sans connexion, état « appareil perdu ». | FR-204, NFR-8 |
| A28 | LBC/FT : scénarios de soupçon propres à la microfinance et procédure « correspondance confirmée » (gel, déclaration, délai), à faire valider par un juriste. | FR-119 à FR-122 |
| A29 | Relais Money Vibes : accusé de réception après écriture, rejeu, rapprochement avec le relevé du fournisseur ; contenu minimal (jeton opaque, montant, durée de vie, usage unique) ; Money Vibes déclaré comme sous-traitant. | FR-263, §7.9 |
| A30 | IA du rapport BCEAO : les chiffres viennent de `risque-par` et du cœur, jamais du modèle ; l'IA n'écrit que le commentaire. | FR-190 |

### A.5 Fidélité au PO et forme

| # | Correction | Où |
|---|---|---|
| A31 | Marquer `[ASSUMPTION]` ce qui est présenté comme décidé sans l'être : Togo par défaut, chiffres des NFR (99,5 %, ×10, test d'intrusion), citations légales rattachées à FR-195. | FR-11, §8 |
| A32 | §12.3 : retirer « la démo peut glisser » (Q4 : rien n'est modifié) ; ★ inchangé (Q4). | §12.3 |
| A33 | §6.6 : dire l'intention du cœur fictif, « pour que l'IMF comprenne » ; le vrai connecteur est pour « leur démo, pas maintenant ». | §0, §6.6, §10.2 |
| A34 | « 71 questions » est juste (68 + T5 à T7) : préciser « 71 questions (68 puis 3 ajoutées) » ; « tes » → « ses » au §12.2 ; distinguer piste d'audit (AUD, DG) et journal des accès (AUD seul) ; la perte passe par quel statut ; export des écritures « au mieux » ; « Réalise UJ-1 » réservé au chemin critique. | divers |
| A35 | Index des hypothèses régénéré depuis le texte après corrections ; les comptes (FR, rôles, hypothèses) recalculés. | §13 |
