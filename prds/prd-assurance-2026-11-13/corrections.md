# Corrections à appliquer au PRD Assurance (consolidation des 5 relectures, 2026-11-13)

Sources : `review-adversarial.md` (ADV, F-01 à F-44), `review-rubric.md` (RUB), `reconcile-po-v2.md` (PO), `reconcile-demo.md` (DEMO), `reconcile-spec-cima.md` (SPEC, lignes S, P, M, R, F, G). Arbitrages : `arbitrages-relectures.md` (R1 à R15, font foi) et `plan-redaction.md` (D1 à D21).

Règles pour les trois agents d'application :
- Appliquer les corrections de **son lot seulement** ; une correction qui touche un autre lot porte la mention « coordonné avec Lx-nn » : ne pas la faire, mais écrire la même règle avec les mêmes codes.
- Codes communs à employer tels quels (créés ici) : condition `DELAI_DENONCIATION_ECOULE` ; état de règlement `INCONNU` ; état de chèque `CHEQUE_EN_OPPOSITION` ; état de déclaration `SAISIE_MANUELLE` ; code de refus `OPPOSITION_NON_ENREGISTREE` ; motif codé (liste fermée, jamais libre) pour tout message vers le LC.
- Numérotation : jamais de numéro déjà pris. Lot 1 peut utiliser FR-26 à FR-29, FR-229, FR-240, FR-242, FR-243, FR-247 à FR-249. Lots 2 et 3 : sous-règle d'une FR existante, ou FR-nnna (suffixe lettre) si indispensable.
- Toute hypothèse sur une pratique de la compagnie : balise inline `[ASSUMPTION: … ; à confirmer à la séance d'immersion]` ; toute question de droit : `[ASSUMPTION: … ; à valider par le juriste, §13.2]`.
- Ne jamais nommer la compagnie cliente, le groupe ni la compagnie du mémoire. Formule unique (R14) : « la compagnie étudiée par le mémoire de 2014 (zone CIMA) ».
- Chaque nouveau paramètre est à ajouter dans l'annexe D par le lot 3 : la liste consolidée est en **L3-40**.

## Tableau de synthèse

| Source | Nb de constats | Retenus | Non retenus |
|---|---|---|---|
| ADV (adversarial) | 44 (5 critiques, 18 hautes, 16 moyennes, 5 basses) | 42 (dont 2 retenus en partie) | 2 parties (N-01, N-02) |
| RUB (grille) | 17 (3 hautes, 6 moyennes, 8 basses) | 15 | 2 parties (N-03, N-04) |
| PO (récit, D1-D21, v2, deck) | 24 (18 partiels, 3 contredits, 3 omis) | 22 | 2 (N-05, N-06) |
| DEMO (démo existante) | 71 (52 partiels, 19 omis) | 70 | 1 (N-07) |
| SPEC (SPEC, pièces, mémoire, Code, juriste, écarts internes) | 62 (39 partiels, 3 contredits, 20 omis) | 59 | 3 (N-08, N-09, N-10) |
| **Total** | **218** | **208** | **10** |

Après dédoublonnage : **Lot 1 : 47 corrections ; Lot 2 : 56 ; Lot 3 : 41 ; Lot 4 : 16 lignes** (voir fin de fichier). Un constat relevé par plusieurs relectures n'apparaît qu'une fois, avec toutes ses sources. Les constats BASSE sont regroupés en une ligne « style » par lot (L1-47, L2-56, L3-41).

---

# LOT 1 — §0 à §4 (FR-1 à FR-29) et §7 à §8 (FR-220 à FR-264)

## 1A. Sécurité de l'argent, séparation des tâches, droits

**L1-01** · FR-220, FR-14 · ADV F-01 · **R1**
FR-220 (« Aucun ordre ne part sans accord enregistré ») : ajouter « et, au corporel VTM, aucun règlement n'est **émis** avant la fin du délai de dénonciation de 15 jours (art. 235) ; condition `DELAI_DENONCIATION_ECOULE` sur les transitions d'émission ». Dans FR-14 (ligne art. 235/236) : le délai de paiement d'un mois court **depuis la fin de la dénonciation** (arbitrage 9 de `coherence.md`). Supprimer toute `[ASSUMPTION: la compagnie n'émet pas avant la fin du délai]`. Coordonné avec L2-01.

**L1-02** · FR-220, FR-221, FR-222 · ADV F-02, F-03, F-23 · **R2**
FR-220 : la liste des états du règlement devient `A_PAYER`, `EN_COURS`, `INCONNU`, `PARTIEL`, `PAYE`, `ECHEC`. Écrire : « Chaque règlement porte une **clé d'idempotence** unique, transmise à `paiement` et **gardée à chaque nouvelle tentative**. Un règlement `INCONNU` (issue non confirmée par `paiement`) ne se relance pas et ne s'annule pas tant que le rapprochement ne l'a pas tranché (`PAYE` ou `ECHEC` confirmé). `ECHEC` n'est posé que sur refus explicite du fournisseur ; il ne se relance qu'avec la **même clé**, après confirmation de `paiement`. Un règlement `EN_COURS` ou `INCONNU` se résout d'abord, il ne s'annule pas. » FR-221 : un chèque annulé exige l'**opposition bancaire enregistrée** (référence, date) ou la restitution physique avant tout chèque de remplacement (code `OPPOSITION_NON_ENREGISTREE`). Test : deux envois du même ordre = un seul paiement. Coordonné avec L2-02 et L3-33.

**L1-03** · FR-222, FR-220, FR-7 · ADV F-08
Écrire qui est le second contrôle de l'ordre (« validé par une **autre** personne ») : un second `CPT` distinct de celui qui prépare, et, au-dessus d'un seuil paramétré (défaut `[ASSUMPTION: 5 000 000 FCFA]`), le `DG`. FR-222 : la confirmation **manuelle** d'un virement hors PI-SPI exige un **justificatif bancaire joint** et un second `CPT` ; elle ne peut pas être faite par celui qui a lancé le virement. Aligner FR-93/95 (L2-03) et la matrice B (L3-31).

**L1-04** · FR-7 · ADV F-05, F-10, F-24 · **R4**
Ajouter au tableau des cumuls interdits (qui passe de 12 à 16 lignes) : **13** instruire **et** enregistrer l'accord de l'assuré ; **14** valider **et** enregistrer l'accord ; **15** émettre le règlement **et** faire signer la quittance ; **16** lever un blocage fraude `BLOQUE` après avoir affecté, instruit, validé ou siégé au comité de ce dossier. Corriger toute occurrence de « 12 cumuls » en « 16 ». Un test par ligne. Remplacer « celui qui a instruit » par un renvoi à FR-29 (L1-13).

**L1-05** · FR-7 ligne 7, FR-7 SEP-03 · ADV F-06, F-34
Ligne 7 : aucune exception (supprimer, dans FR-50, « le gestionnaire se l'attribue ») ; un dossier non affecté depuis 1 jour ouvré va au `RESP` ; si le `RESP` instruit lui-même, il ne valide pas et ne siège pas au comité pour ce dossier. SEP-03 : le cumul qui décide du niveau = montants **acceptés et ordonnés non annulés** + montant en cours de validation (une offre remplacée jamais payée ne compte pas). Coordonné avec L2-06, L2-23.

**L1-06** · FR-8 · ADV F-07, F-09 · PO (validation à trois) · **R6** · SPEC M28
FR-8, défaut sous le seuil : « **sous 1 000 000 FCFA** : proposition de l'instructeur, **contrôle** par un second agent du volet (un autre `GEST` désigné contrôleur, ou le `RESP`), **validation** par le `RESP` ; le contrôleur et le validateur sont deux personnes distinctes de l'instructeur » `[ASSUMPTION: procédure décrite dans le récit du PO ; tout est paramétrable]`. Au-delà : comité de 4 + visa du `DT` (D8 inchangé). Nature « honoraires » : **plafond d'honoraires par niveau**, comité au-dessus ; le visa des honoraires est fait par `RESP`, **jamais par `CPT`**. Comité : membres nommés à la mise en service (liste obligatoire), **règle d'égalité** (voix du président), **suppléant** nommé par la matrice, **délai de tenue** paramétré (défaut 5 jours ouvrés) avec alerte et repli (délibération écrite) ; si le `DT` a voté au comité, le visa est donné par le `DG`. Frontière : écrire que 1 000 000 FCFA exactement relève du niveau 1 (« jusqu'à ») et signaler l'écart avec le mémoire (≥ 1 000 000 = collégial) `[ASSUMPTION]`. Coordonné avec L2-07, L2-08, L2-09, L3-11.

**L1-07** · FR-9, FR-153 (renvoi) · ADV F-12, F-13 · **R5**
Réécrire la règle et ses tests. `ACC` et `NUM` voient le **type** et l'**existence** d'une pièce médicale, jamais son contenu : ni aperçu, ni extrait de l'IA, ni résumé ; le contrôle de qualité d'une pièce médicale = lisibilité de l'image seulement (ou fait par `ARCH`/`MED`). `DG` et `DT` lisent une pièce médicale par un **accès par dossier ouvert à la validation**, journalisé (remplace « pour une décision »). Base légale : « le traitement des données de santé pour indemniser relève de l'**obligation légale** d'offre et de l'**exécution du contrat** ; le consentement est recueilli à la déclaration, mais **son absence ne bloque jamais** une obligation légale (offre, délais) ni le chronomètre » `[ASSUMPTION: à valider par le juriste, §13.2]`. Supprimer « sans lui, la pièce médicale n'est pas versée au dossier ». Coordonné avec L3-03, L2-13, L3-02.

**L1-08** · FR-25, FR-254 · ADV F-29
`MFA_ROLES` : double authentification obligatoire pour **tout rôle autorisé à lire une donnée de santé ou à enregistrer un accord** (donc aussi `GEST`, `MED`, `ACC`, `NUM`, `GREC` dès qu'ils ont ces accès), en plus de DG, DT, RESP, CPT, AUD, ADMIN et EXPE. Écrire la règle par capacité, pas par liste figée. Coordonné avec L3-30 (annexe D) et L3-31 (annexe B).

**L1-09** · FR-10 (tableau des 14 usages, ligne 2), FR-11 · ADV F-11, F-12, F-36 · PO (« défendable ») · **R5**
FR-10 ligne 2 : l'extrait de la pièce d'où vient un champ lu n'est **jamais** montré à `ACC`/`NUM` pour une pièce médicale (voir L1-07). FR-11 : (a) **filtre par volet** appliqué à toutes les comparaisons, écarts à la provision d'ouverture et fiches de décision : liste blanche des volets (matériel, risques divers), jamais de médiane, de comparable ni d'écart en % sur un dossier `corporel` ; la provision d'ouverture corporelle est **saisie par l'humain** avec motif (L2-11) ; un test **par écran**, pas par usage ; (b) un motif proposé par l'IA n'est jamais repris par clic seul : mesure du taux de motifs identiques à la proposition, signalée à `AUD` ; motif IA interdit pour les validations au-dessus du seuil du responsable ; (c) renvoi au principe FR-26. Coordonné avec L2-11, L2-25.

**L1-10** · FR-26 (nouveau) · PO écart 5 · R13
Créer **FR-26 : Toute décision est défendable**. Texte : « Toute décision (évaluation, offre, refus, classement, provision, règlement) porte ses **pièces, sa règle, son motif et son auteur**, lisibles par un tiers (l'assuré, l'auditeur, le juge) sans reconstitution. Principe de l'IA (elle explique et source, FR-11) et du journal (FR-13). » Test : un auditeur ouvre un dossier clos et retrouve les quatre éléments pour chaque décision. Ajouter la phrase au §1 (vision) ; indicateur au §9 (L4-03).

**L1-11** · FR-27 (nouveau), FR-264 · PO écart 7 · **R13**
Créer **FR-27 : Le processus évolue par paramètres, puis par version**. « Les 11 statuts et 42 transitions sont ceux du premier jour ; la compagnie fait évoluer le processus **par paramètres** (délais, seuils, délégations, pièces, modèles) sans développement ; un changement de statut ou de transition se fait par **amendement versionné** décidé à la séance d'immersion, avec rejeu des tests de FR-139. » Supprimer « figé » partout ; « 42 transitions » partout (R10). Coordonné avec L4-04.

**L1-12** · FR-28 (nouveau), FR-264 · DEMO (écran, concurrence)
Créer **FR-28 : Deux agents, un dossier**. (a) Le dossier porte un numéro de version ; un enregistrement fait sur une version périmée est **refusé** avec un message « modifié par X à hh:mm », sans perte de saisie. (b) Un geste met à jour l'écran des rôles concernés **sans rechargement**, vérifié en recette. Ajouter à FR-264 : un test de **parcours d'écran** rejoué à chaque livraison, en plus de la logique (les tests de logique ne voient pas l'écran).

**L1-13** · FR-29 (nouveau), FR-7, FR-81, FR-93 · ADV F-24
Créer **FR-29 : Partie au dossier**. Liste fermée des actes qui rendent « partie » : affecter, instruire, évaluer, valider, contrôler (niveau 1 de L1-06), enregistrer l'accord, émettre, remettre, rapprocher. Contrôler la qualité d'une pièce n'est pas un acte de partie. Un gestionnaire réaffecté en cours de route reste partie pour ses actes passés. FR-7, FR-81 et FR-93 renvoient à cette liste ; un test par acte.

**L1-14** · FR-225, §2.1 · ADV F-30 · SPEC R42, G6
FR-225 : désigner le **responsable LBC** (un rôle ou une désignation de `AUD`, jamais nommé par `ADMIN` seul), écrire la liste « qui reçoit quelle alerte » ; le contrôle de cumul (n° 6) apparaît « **non actif** » à l'écran tant que le paramètre est vide ; export annuel des alertes et suites. Art. 11 : « l'art. 11 liste les moyens à vérification minutieuse (espèces, virements, chèques de banque, chèques endossés…) ; son application aux règlements de sinistres est une transposition, à confirmer par le juriste » ; art. 4.5 : « recommande » (le texte dit « devrait permettre »). §2.1 : ajouter le responsable LBC. Coordonné avec L2-14, L3-31.

## 1B. Remise du chèque, doublons, restauration

**L1-15** · FR-221 · ADV F-23
Chèque rempli à la main : à la remise, `ACC` saisit le **nom et le montant lus sur le chèque** et le serveur les compare à l'ordre (refus `CHEQUE_NON_CONFORME_A_L_ORDRE`) ; **copie du chèque (photo) obligatoire** au dossier ; le gabarit de lettre-chèque est **imposé au corporel**. Coordonné avec L2-03.

**L1-16** · FR-224 · SPEC S19, M15 · ADV F-17, F-44 · R13
FR-224 : (a) une période comptable **ne se clôt pas** tant qu'il reste un règlement non rapproché, une remise sans accusé signé ou un chèque émis non retiré au-delà de 7 jours ; (b) les règlements de nature `HONORAIRES` se rapprochent comme les autres ; (c) **définition unique du doublon de règlement** (identique à FR-100 après L2-16) : même bénéficiaire + même **sinistre** (date, police, immatriculation), non le montant ; (d) contrôle mensuel des numéros de chèque annulés non rapprochés. Coordonné avec L2-16.

**L1-17** · FR-236, FR-252, FR-23 · ADV F-22 · RUB M (NFR)
Après restauration, les compteurs (`DEC-`, numéros de chèque, de quittance) se reprennent au **maximum** entre la base restaurée et le LC / `paiement` / le relais ; état « **restauration en cours : aucune émission** » qui bloque toute émission jusqu'au rapprochement. Valeurs provisoires `[ASSUMPTION: RPO 24 h, RTO 8 heures ouvrées ; à confirmer avec le test de FR-23]`. FR-176 (L3-35) dit « test annuel » : tout le PRD dit **mensuel** (FR-236).

**L1-18** · FR-250, FR-251 · RUB M
Poser des cibles provisoires balisées : fiche du dossier ouverte en moins de 3 s (95e centile), OCR d'un lot de 50 pages en moins de 10 minutes, resynchronisation nocturne terminée avant 6 h pour le volume de FR-23, export de FR-193 en moins de 2 minutes `[ASSUMPTION: valeurs provisoires ; à confirmer avec le test de FR-23]`. Remplacer « mesurée sur le jeu » et « aucune cible » par ces valeurs ; FR-251 garde 99,5 % `[ASSUMPTION]`.

## 1C. Réseau, relais, installation

**L1-19** · FR-237, FR-239, FR-257 · ADV F-20 · R15
Trancher « portail cabinet » / « aucun port entrant » **sans retirer le portail** : défaut `[ASSUMPTION: le portail du cabinet externe est hébergé par le relais Money Vibes (FR-239), pièces de mission chiffrées et à durée limitée, Money Vibes déclaré sous-traitant ; aucune pièce médicale n'y transite sauf nécessité de la mission ; à confirmer à la séance d'immersion et par le juriste]`. FR-239 : le relais porte aussi ce portail. La voie `TRANSMISE` (courriel sécurisé ou papier) reste le repli. Question au PO au §12.2 (L4-07). Coordonné avec L3-05.

**L1-20** · FR-237 · ADV F-39
Guichet hors liaison : formulaire papier **numéroté de secours**, saisie différée avec double date (déjà prévue en FR-34) ; la référence `DEC-` est attribuée à la saisie différée et rappelée sur l'accusé. Cohérence avec FR-39 (« une déclaration ne se refuse jamais »). Coordonné avec L2-27.

**L1-21** · FR-240 (nouveau) · PO OMIS (v2 A.6) · R13
Créer **FR-240 : Mise en service**. « Formation **par profil** (accueil, gestionnaires, responsable, direction, administrateurs, comptabilité, numérisation, archives, contrôle interne), **documentation d'usage** par rôle, **aide en ligne**, **accompagnement sur site** pendant les premières semaines. » Test de recette par rôle : chaque profil exécute son parcours de FR-16 sans aide. Durées et nombre de sessions : `[ASSUMPTION: à confirmer avec la compagnie]`.

**L1-22** · FR-242 (nouveau) · PO OMIS (v2 A.4) · R13
Créer **FR-242 : Réversibilité et remise d'exploitation**. « À la réception et sur demande : **export complet** des dossiers, pièces, journal et paramètres en **format ouvert** (JSON/CSV et fichiers d'origine), **documentation d'exploitation**, **accès administrateur remis** à l'équipe informatique de la compagnie. » Test : l'export complet est rejoué dans un environnement vide et les compteurs concordent. FR-261 renvoie à FR-240 et FR-242.

**L1-23** · FR-229 (nouveau), FR-228 · PO PARTIEL (décideurs DAF, Commercial, DSI)
Créer **FR-229 : Vue finance et vue exploitation**. Vue **finance** (`CPT`, `DG`) : engagements à décaisser (exigible / à confirmer, jamais sommés), provisions, honoraires à payer, chèques en circulation, rapprochements en retard. Vue **exploitation** (`ADMIN`, DSI) : état technique seulement (sauvegardes, versions, alertes de service, espace disque), **aucune donnée métier**. Vue **réseau** (courtiers, réclamations) : `[ASSUMPTION: hors périmètre du premier jour, dit au §10.2 ; à confirmer]`. FR-228 renvoie à FR-229. Coordonné avec L3-16.

**L1-24** · FR-20 · ADV F-21 · RUB H1 · **R7**
FR-20 : « la mise en service de chaque module se décide par un **feu vert** (comme la reprise, FR-218), avec la liste des entrées de la compagnie nécessaires et leur **date limite de livraison** ; une entrée manquante est un **risque tracé**, pas un retrait de périmètre. » Aucune fonction ne passe en « bientôt » sans décision du PO. Coordonné avec L4-05 et L3-37.

**L1-25** · FR-24 · RUB H3, ADV F-21 · SPEC F1-F19
FR-24 : ajouter un **propriétaire** et une **date cible** de la revue juridique `[ASSUMPTION: le PO désigne le propriétaire ; date cible = 4 semaines avant la mise en service]` ; « **mode dégradé** : si les tables du barème corporel ne sont pas validées à la mise en service, le volet corporel fonctionne en **saisie manuelle motivée** (montant arrêté par le gestionnaire avec motif), échéances légales actives, écart tracé ». Coordonné avec L2-30 (FR-70) et L4-09.

## 1D. Règles transverses, valeurs, textes

**L1-26** · FR-3, FR-14, §0/§2 · RUB H2 · ADV F-38, F-40 · **R10**
Aligner les **FR sur l'annexe D** (« Conflits résolus ») : FR-3 : âge maximal de lecture du LC **5 minutes** (interface) et **24 heures** (fichiers) au lieu de 15 min / 1 jour ; FR-14 : « rapport d'expert sous **7 jours** » (valeur de FR-184 ; dire que c'est le **bas** de la fourchette 7 à 10 jours du mémoire) ; « 41 transitions » → « **42** » ; test de recette « aucune valeur numérique d'un paramètre D n'est écrite en dur dans une FR » ; en cas de doute, écrire « voir `paramètre`, annexe D ».

**L1-27** · FR-14 · ADV F-25, F-37 · **R10** · SPEC G2
Délai de déclaration : « **au moins 5 jours ouvrés, 48 heures pour le vol** (art. 12-4°) » ; le plancher légal l'emporte sur toute valeur de l'annexe D (L3-39). Pénalité : « estimation, base non validée » tant que le juriste n'a pas tranché ; **une seule formulation** de la base avec le paramètre `penalite.base` (offre, indemnité, solde ; défaut : montant de l'offre `[ASSUMPTION: à valider par le juriste]`) ; ne pas intégrer ce chiffre aux états tant que la base est ouverte. « 72 heures » : écrire « **72 heures ouvrées** » `[ASSUMPTION: calendrier ouvré de la compagnie, A-18]`. Coordonné avec L2-22.

**L1-28** · FR-15, FR-16, FR-17, FR-264 · ADV F-26 · DEMO (omission n°1) · **R9**
Remplacer « 104 sur 104 » par : « les 104 vérifications du rejeu 2 sont reprises dans une **table de reprise** (nouvelle annexe E, L3-36) qui dit pour chacune : **gardée**, **réécrite** (nouvelle valeur attendue) ou **retirée** (décision citée). La recette exige **104 sur 104 de la table réécrite**. » FR-15 : ajouter le **sélecteur de profil de démonstration** (changer de profil sans se déconnecter, espace d'essai seulement) ; la remise à zéro est réservée à `ADMIN` en espace d'essai. FR-16 : renvoyer à la liste des **21 refus** de la démo (annexe E) au lieu des 7 cités.

**L1-29** · §3, §2.3 (UJ-3), FR-17, FR-262 · RUB M · **R8**
Arrondi : « l'arrondi à 5 000 FCFA ne vaut que pour les montants **calculés par le système** (provision d'ouverture, indemnité proposée par un formulaire d'instruction) ; le **montant arrêté** par le gestionnaire est **au franc près** (395 500 FCFA pour `SIN-2026-9002`) ». FR-262 et FR-17 : même règle. §3 « Évalué » : « montant arrêté par le gestionnaire ; le décompte est son repère ; un écart avec le décompte exige un motif » ; corriger UJ-3 (« l'évaluation arrêtée est le résultat de ce décompte »). Coordonné avec L2-29.

**L1-30** · FR-4, FR-5 · DEMO (modèles, calibration) · ADV F-27
FR-4 : « tout **modèle de document** (lettres, quittances, lettre de mission, bordereaux, chèques) est paramétrable et versionné » ; procédure de **mise à jour du référentiel légal** (D.5) : fournisseur du texte, relecture du juriste, **date d'effet**, double contrôle, journal. FR-5 : paramètres de calibration des grilles de provision (marge de fiabilité, amplitude, occupation, concentration, ancienneté, tranches mortes) et **alerte de grille périmée** `[ASSUMPTION: valeurs de la démo comme défauts]`. Coordonné avec L3-40.

**L1-31** · FR-12 · DEMO E14
FR-12 : ajouter la **chaîne de décision** de la fiche d'un dossier : suggestion de l'IA, modifiée, validée, émise, par qui, quand (registre de l'IA).

**L1-32** · FR-18, FR-226 · DEMO (envois), PO (ton)
Exiger le **suivi de distribution** (retourné, non remis) pour le courrier et le SMS : `notification` rend un état de distribution lisible par le dossier. Coordonné avec L2-46.

**L1-33** · FR-21 · ADV F-32
FR-21 : « **le papier fait foi tant que le juriste n'a pas validé la valeur probante de la copie numérisée** ; le scellement (FR-169) ne change pas le support de référence ». Coordonné avec L3-29.

**L1-34** · FR-19, FR-230 à FR-232 · SPEC F8
Ajouter « transferts hors Togo et notification des violations de données » au renvoi juridique (à porter au §13.2, L4-12). Aucun autre changement.

## 1E. Doublons §8 et divers

**L1-35** · §8 (FR-252 à FR-257) · RUB M
Réduire les FR de §8 qui répètent §4/§7 à un **tableau de renvois** « NFR → FR porteuse » : FR-254 → FR-25 ; FR-252 → FR-236 ; FR-255 → FR-13 ; FR-256 → FR-174 ; FR-257 → FR-232/FR-234. Ne garder en §8 que le nouveau (FR-250, FR-258 à FR-264). Les numéros restent réservés.

**L1-36** · §0, §1 · PO écart 4, DEMO, RUB basses · **R13**
§1 : tableau « **promesses du deck et de la v2 non tenues ou transformées, par décision du PO** » : blocage à l'ouverture tant que les pièces manquent (on ouvre « en attente de pièces ») ; reprise du stock papier par scan (non retenu, papier tenu) ; numéro de sinistre immédiat (remplacé par la référence `DEC-`, le numéro officiel venant du LC) ; import initial seulement (remplacé par la resynchronisation) ; appel dans la déclaration assistée (l'accueil saisit pendant l'appel) ; téléversement par l'assuré depuis son téléphone (pas de portail assuré) ; prescription « art. 28 » (terme à vérifier par le juriste). §0 : une phrase « FR-26 à FR-29 … : numéros réservés ou créés par la relecture » ; mettre à jour « Reste à faire » et `status`.

**L1-37** · FR-261, FR-238 · PO
Ajouter à FR-261 un renvoi à FR-240 et FR-242 (formation, réversibilité). Aucune autre correction.

**L1-38** · §2.3 (UJ-2) · PO PARTIEL
Remplacer « le lendemain matin, il renvoie le numéro » par « après un délai variable selon le LC (FR-198) » : le PO interdit de spéculer sur le LC.

**L1-39** · §2.1 · DEMO, PO
Ajouter le sélecteur de rôle de démonstration (FR-15), le responsable LBC (L1-14) et la correspondance DAF → `CPT`/`DG` (FR-229). Rappeler que `ADMIN` ne lit aucune donnée métier.

**L1-40** · Identifiants nus · RUB basse
Toujours préfixer les identifiants d'autres PRD (« PRD moteur FR-26 », « PRD-D FR-249 ») : les numéros nus FR-26 et FR-249 désignent des FR de ce PRD.

**L1-41** · §0, §3 · PO PARTIEL (écart au récit)
Dire que le récit du PO écrit « numéro attribué tout de suite » et que le PRD le réalise par la référence `DEC-` immédiate, le numéro officiel venant du LC. Coordonné avec L2-27.

**L1-42** · FR-23 · ADV F-21
Ajouter : « la compagnie livre ses volumes réels avant la date limite de L1-24 ; sans eux, l'hypothèse de dimensionnement reste valable et le risque est tracé ».

**L1-43** · FR-6, FR-258 · DEMO (administrateur)
`ADMIN` : ajouter « simulateur et impression des grilles ; liste des courriers sortants avec impression groupée » aux écrans d'administration ; sans lecture métier.

**L1-44** · FR-13 · ADV F-42, DEMO (horloge)
Horloge unique et croissante côté serveur ; la séquence est « sans réutilisation » et les **trous dus à une annulation sont consignés** (L2-45).

**L1-45** · Transversal §0 à §4, §7, §8 · **R14** · RUB basse
Remplacer toute occurrence de « compagnie du même groupe au Sénégal » et variantes (FR-8, §0, FR-14…) par « la compagnie étudiée par le mémoire de 2014 (zone CIMA) » ; vérifier « groupe », « Sénégal » dans le lot.

**L1-46** · FR-227, FR-232 · **R5**
Aucun message (SMS, WhatsApp, e-mail) ne cite gravité, nature des lésions ni texte libre ; rien de nominatif ni de médical vers l'IA commune ni le relais. Ajouter « motifs codés seulement » à la liste des contenus autorisés d'un message.

**L1-47** · Style (BASSE) · RUB, ADV
Découper en puces les FR longues du lot (FR-14 : une règle par puce) ; un seul vocabulaire (« partie », « accord », « offre » comme au §3).

---

# LOT 2 — §5 (FR-30 à FR-149)

Pas de numéro libre : une exigence nouvelle devient une sous-règle d'une FR existante, ou une FR avec suffixe lettre (FR-57a, FR-63a, FR-70a) lorsqu'une sous-règle ne suffit pas.

## 2A. Argent : délai de dénonciation, états du règlement, chèque, accord (R1, R2, R4)

**L2-01** · FR-86, FR-90, FR-96, FR-102, FR-92, FR-135 (transitions 14, 17, 18, 20, 42), FR-136 · ADV F-01 · **R1**
Nouvelle condition nommée `DELAI_DENONCIATION_ECOULE` dans FR-136, texte opposé : « le délai de dénonciation de 15 jours n'est pas écoulé ». Elle garde les transitions d'**émission** du règlement (17, 18, 20 : vérifier les numéros dans le tableau FR-135) pour tout dossier corporel VTM dont l'accord est une transaction (offre définitive ou provisionnelle acceptée). Date d'éligibilité = date de conclusion + 15 jours, **calculée, non modifiable**. L'ordre peut être créé à l'accord (transition 14) mais reste « différé » (non émis) jusqu'à cette date. La transition 42 (dénonciation) reste depuis `ORDRE_EMIS`, puisque rien n'est émis avant. FR-102 : le délai de paiement court depuis la fin de la dénonciation ; supprimer l'`[ASSUMPTION: la compagnie n'émet pas avant la fin du délai]`. FR-96 : « le droit de dénonciation est déjà purgé » devient vrai par construction. Un test **par moyen de paiement** (chèque, virement, paiement mobile) : l'émission est refusée jour 1 à 14, acceptée au jour 16.

**L2-02** · FR-92, FR-94, FR-95, FR-99, FR-101, FR-125, FR-130 · ADV F-02, F-03 · **R2**
FR-92 : un seul jeu d'états du règlement : `A_PAYER`, `EN_COURS`, `INCONNU`, `PARTIEL`, `PAYE`, `ECHEC`. Chaque règlement porte une **clé d'idempotence** unique transmise à `paiement` et conservée à chaque nouvelle tentative. `INCONNU` : aucune relance ni annulation tant que le rapprochement (par une personne qui n'a pas lancé le paiement) n'a pas posé `PAYE` ou `ECHEC` ; `ECHEC` n'est posé que sur refus explicite du fournisseur et ne se relance qu'avec la même clé, après confirmation de `paiement`. FR-95 : « relancer après correction des coordonnées » = même clé. FR-99 : le rejet n'agit que sur le règlement visé et jamais sur un règlement `EN_COURS`, `INCONNU` ou `PARTIEL`. FR-101 : un chèque annulé exige l'**opposition bancaire enregistrée** (référence, date) avant tout chèque de remplacement : état `CHEQUE_EN_OPPOSITION`, code de refus `OPPOSITION_NON_ENREGISTREE` à l'annulation-réémission (transition 21). **FR-125 et FR-130 s'alignent** : « suspend la remise », jamais « sans annuler le chèque » en contradiction ; la quittance passe `ANNULEE` quand l'opposition est enregistrée, et un chèque déjà émis d'un dossier devenu fraude suspectée est mis en opposition. Contrôle mensuel des numéros de chèque annulés non rapprochés (FR-94). Annexe A (L3-33). Coordonné avec L1-02.

**L2-03** · FR-93, FR-94, FR-95, FR-97 · ADV F-08, F-23
FR-93/95 : la comptabilité **prépare** l'ordre ; un **second `CPT` distinct** (et, au-dessus du seuil de L1-03, le `DG`) le valide avant exécution. FR-95 : la confirmation manuelle d'un virement hors PI-SPI exige un justificatif bancaire joint et un second `CPT`. FR-94 : le gabarit de lettre-chèque est imposé au corporel ; sans gabarit, le chèque rempli à la main est contrôlé à la remise. FR-97 : `ACC` saisit nom et montant lus sur le chèque, le serveur compare à l'ordre (`CHEQUE_NON_CONFORME_A_L_ORDRE`), photo du chèque obligatoire. Coordonné avec L1-03, L1-15.

**L2-04** · FR-86, FR-90, FR-93, FR-96, FR-81, FR-135 (transition 14) · ADV F-05 · **R4**
L'**accord** de l'assuré (offre signée, procès-verbal de transaction) est **enregistré par `ACC`** ou par un agent qui n'a ni instruit ni validé le dossier, sur la **pièce originale signée**, scannée et rattachée, avec **contrôle d'identité du signataire** ; l'empreinte de la version d'offre signée est conservée. Transition 14 : rôle `ACC` (ou agent non partie) et non `GEST`/`RESP`. Au-dessus d'un seuil paramétré, double enregistrement `[ASSUMPTION: 3 000 000 FCFA]`. La **quittance** est marquée `SIGNEE` par un agent distinct de celui qui a émis. Tests : instruire + accord refusé ; valider + accord refusé ; émettre + faire signer refusé (`SEPARATION_DES_TACHES`, lignes 13 à 15 de FR-7). Code `PIECE_ACCORD_ABSENTE` conservé. Coordonné avec L1-04.

**L2-05** · FR-81, FR-93 · ADV F-24
Remplacer les formulations « le gestionnaire qui a instruit », « instruit, évalué, validé ou enregistré l'accord » par un renvoi à FR-29 (liste des actes qui rendent partie). Un test par acte.

**L2-06** · FR-50, FR-52, FR-135 (transition 5), FR-136 (`DOSSIER_AFFECTE`) · ADV F-06
Supprimer l'exception « le gestionnaire qui fait avancer un dossier sans titulaire le prend lui-même ». Un dossier non affecté depuis 1 jour ouvré est remonté au `RESP` (alerte existante). Le test de FR-50 (prendre en instruction un dossier non affecté est refusé) reste. Si le `RESP` instruit lui-même (transition 5), il ne valide pas (SEP-01) ni ne siège au comité pour ce dossier. Coordonné avec L1-05.

## 2B. Délégation, honoraires, comité, validation (R6)

**L2-07** · FR-78, FR-90, FR-91 · ADV F-07
Honoraires dans la matrice : FR-91 ne dit plus « n'entrent pas dans le calcul de la délégation » mais « sont soumis à leur **plafond par niveau** ; au-delà, comité ». Naissance d'un règlement d'honoraires : **visa de `RESP`** (jamais `CPT`), seulement si le **rapport est validé** et la facture rapprochée de la lettre de mission ; `CPT` émet seulement. Un budget dépassé est bloquant au-dessus d'une tolérance paramétrée `[ASSUMPTION: 10 %]`, non plus seulement « signalé ». Coordonné avec L1-06, L3-11.

**L2-08** · FR-78, FR-79 · ADV F-09
Comité : liste des membres obligatoire à la mise en service (au moins un titulaire et un suppléant par siège) ; quorum 3 ; l'**instructeur est exclu du vote** ; en cas d'égalité, la voix du président (le `RESP`, sinon le `DG`) ; délai paramétré de tenue du comité (défaut 5 jours ouvrés) avec alerte au 3e jour et repli par délibération écrite ; si le `DT` a voté au comité, le **visa est donné par le `DG`**. Test : 3 présents dont l'instructeur = 2 votants, égalité, décision par la voix du président. Coordonné avec L1-06.

**L2-09** · FR-78, FR-8 (renvoi) · PO (validation à trois) · **R6**
Défaut du niveau 1 (jusqu'à 1 000 000 FCFA) : proposition de l'instructeur, **contrôle** par un second agent du volet (un autre `GEST` désigné contrôleur, ou le `RESP`), **validation** par le `RESP` ; contrôleur et validateur = deux personnes distinctes de l'instructeur ; au-delà, comité de 4 + visa `DT` (D8 inchangé). Transition 10 de FR-135 : le contrôle devient une condition (« contrôle fait »). Tout est paramétrable `[ASSUMPTION: procédure décrite dans le récit du PO]`. Test : le niveau 1 refuse la validation sans contrôle d'une troisième personne.

**L2-10** · FR-129, FR-130, FR-133, FR-7 · ADV F-10
Écarter un blocage `BLOQUE` exige l'**avis écrit d'`AUD`** et un relecteur qui n'a **ni validé, ni affecté, ni siégé au comité** du dossier (ligne 16 de FR-7). Indicateur « blocages levés par le validateur » au journal (zéro attendu). Confirmer la fraude garde l'avis écrit d'`AUD`. Coordonné avec L1-04.

**L2-11** · FR-49, FR-65, FR-71, FR-74, FR-77, FR-80 · ADV F-11 · **R5** (principe)
Filtre `volet = corporel` appliqué à **toutes** les comparaisons (FR-65, FR-74), à l'écart indemnité/provision (FR-80) et à la fiche de décision (FR-77) : liste blanche des volets (matériel, risques divers) ; sur un dossier corporel, aucune médiane, aucun comparable, aucun écart en pourcentage affiché. FR-49 : au corporel, la **provision d'ouverture est saisie par l'humain avec motif** (pas de milieu de tranche calculé par la machine). Test **par écran** : fiche, comparaison, décision, tableau de bord. Coordonné avec L1-09.

**L2-12** · FR-65 · SPEC S31 (CONTREDIT)
FR-65 se contredit : la règle de la SPEC (« jamais à une estimation concurrente ») et le cas type (écart de 65 % au devis, médiane affichée). Réécrire : « le rapport est confronté à des **contreparties nommées et sourcées** (devis versé, provision, médiane d'au moins 5 missions comparables) ; Prospera ne fabrique **jamais** sa propre estimation du dommage ; l'écart se termine par une **question, jamais par un verdict** ». Les seuils 15 % et 35 % restent. `[ASSUMPTION: à trancher avec le PO ; recommandation de la rédaction]`.

**L2-13** · FR-53, FR-47, FR-56, FR-64 · ADV F-12 · DEMO (extraction médicale) · **R5**
Contrôle des pièces et lecture de l'IA : pour une pièce médicale, `ACC`/`NUM` ne voient ni extrait ni contenu (lisibilité de l'image seulement) ; une pièce médicale est numérisée sous un type « médical » sans aperçu. FR-64 : les données extraites d'un rapport médical sont **validées champ par champ par `MED`** avant usage. Coordonné avec L1-07, L3-03.

## 2C. Numéro de sinistre et déclaration (R3)

**L2-14** · FR-100, FR-133 · ADV F-30 · SPEC R42
FR-100 : les alertes LBC vont au **responsable LBC** (L1-14), pas à un rôle inexistant ; contrôles 1 et 5 : **levée motivée** par `AUD` (comme le doublon), au lieu d'un blocage sans issue pour l'expert ou le garage mandaté ; contrôle 6 marqué « non actif » tant que le paramètre est vide. Coordonné avec L1-14.

**L2-15** · FR-36, FR-37, FR-38, FR-39 · ADV F-04, F-17 · **R3**
FR-36 : la référence `DEC-` est l'**identifiant d'idempotence** envoyé au LC (champ obligatoire de l'annexe C) : le LC renvoie le numéro existant pour une `DEC-` déjà reçue `[ASSUMPTION: capacité à exiger du LC ; sinon contrôle de doublon par Prospera avant tout rattachement]`. Une déclaration est dans **une seule voie** : envoi automatique **ou** liste « à saisir » ; le passage à la liste **annule d'abord l'envoi en attente** (état `SAISIE_MANUELLE`) ; une déclaration de la liste n'est **jamais renvoyée automatiquement** ; son rattachement se fait par report du numéro. FR-37 : un numéro reçu pour une `DEC-` déjà numérotée est un **écart** (file des écarts), jamais un second rattachement ; code `NUMERO_OFFICIEL_DEJA_ATTRIBUE` avec procédure de traitement (qui, délai, décision). Si la compagnie bascule la numérotation dans Prospera : préfixe **distinct** (`PRO-`) de ceux du LC et contrôle d'unicité contre les numéros reçus (C-9) au basculement. Coordonné avec L3-01, L3-27.

**L2-16** · FR-38, FR-39, FR-100 · ADV F-17
Contrôle de doublon de règlement : **même bénéficiaire + même sinistre** (date, police, immatriculation), non le montant ; FR-100 et FR-224 s'alignent (L1-16). Nouvelle sous-règle de FR-38 : **fusion de deux dossiers** réservée au `RESP`, avec motif, journal, un seul dossier survivant, un seul numéro LC, réunion des pièces, provisions, offres et règlements, et refus de fusion si un règlement `EN_COURS` existe. Le doublon continue de ne jamais empêcher l'enregistrement (réserve).

**L2-17** · FR-36 · PO PARTIEL (écart au récit)
Sur le numéro « attribué tout de suite » du récit du PO : une phrase en FR-36 « la référence `DEC-` est le numéro attribué tout de suite du récit du PO ; le numéro officiel vient du LC (D3) ».

## 2D. Provisions et refus (R11)

**L2-18** · FR-76, FR-49 · ADV F-18
Seuil de 2 000 000 appliqué au **cumul glissant par dossier**, pas à chaque révision ; l'**alignement à l'évaluation** de la provision est soumis au même seuil ; **pas de report** de revue de provision si un délai légal est actif ; poste « risque de pénalité » dans la provision (voir L2-26). Coordonné avec L3-09.

**L2-19** · FR-121, FR-123, FR-133 · SPEC R15 (CONTREDIT) · ADV F-18 · **R11**
« Au corporel VTM, un refus de garantie, un classement sans suite ou un rejet **ne remet pas la provision à zéro** tant que l'obligation légale d'offre demeure (art. 237 : « pour le compte de qui il appartiendra ») ; elle est maintenue ou ramenée à l'estimation de l'offre légale, avec motif et visa. Ailleurs, la provision est ramenée à zéro avec motif et visa. » Test : refus d'un dossier corporel VTM → provision non nulle ; refus matériel → zéro. L'état PSAP (FR-189, L3-09) la reprend. Ajouter la question au §13.2 (L4-12).

**L2-20** · FR-41, FR-45, FR-135 (transitions 1, 2, 4), FR-136 · ADV F-19 · SPEC R23
`CONTRAT_VERIFIE` produit une **réserve**, jamais un blocage, pour le corporel VTM (art. 210 : suspension inopposable à la victime `[ASSUMPTION: à valider par le juriste, §13.2]`) ; une projection de police **périmée** (âge > seuil) est « à relire », jamais un refus ; le refus de garantie n'arrive que par décision `REFUS_DE_GARANTIE` (FR-42). FR-45 : retirer « un contrat non valide ferme l'ouverture ». FR-41 : si l'assuré produit une attestation valable à la date du sinistre (art. 215-216, attestation provisoire 1 mois), la réserve « police non retrouvée » n'est pas un refus. FR-3 et FR-41 : « jamais bloquée » devient cohérent avec 5 min/24 h (L1-26).

## 2E. Délais, déclaration tardive, pénalité

**L2-21** · FR-43 · ADV F-25 · **R10**
FR-43 : défauts alignés sur le plancher légal : **au moins 5 jours ouvrés, 48 heures pour le vol** (art. 12-4°) ; test « une valeur sous le plancher est refusée à la configuration ». Le plancher l'emporte sur l'annexe D (L3-39).

**L2-22** · FR-85, FR-102, FR-141 · ADV F-37 · SPEC G2, G4, R14
Une seule formulation de la base de la pénalité (paramètre `penalite.base`, défaut « montant de l'offre » `[ASSUMPTION: à valider par le juriste]`) rappelée dans FR-85, FR-102 et FR-141 ; libellé « estimation, base non validée ». **Provision du risque de pénalité** : motif et ligne séparée de la provision (FR-76), alimentée par l'échéance légale dépassée (art. 334-12). Test de suspension du délai (art. 251) : « pas de suspension si aucune nouvelle demande dans les 15 jours après une réponse incomplète reçue dans les 6 semaines ». Coordonné avec L1-27, L3-09.

**L2-23** · FR-78, FR-87, FR-136 · ADV F-34
Cumul anti-fractionnement = montants **acceptés et ordonnés non annulés** + montant en cours de validation. Une contre-proposition : l'offre n°1 jamais payée ne compte plus. Test : 800 000 remplacé par 800 000 ne monte pas au comité ; 800 000 payé + 800 000 nouveau y monte. Coordonné avec L1-05.

**L2-24** · FR-75, FR-80, FR-82 · ADV F-35
Champ « **montant validé** » saisi par le signataire, au plus égal au montant évalué, motif obligatoire s'il diffère ; la délégation s'applique à ce montant ; les cinq montants restent affichés. FR-82 : « un écart entre montant proposé et montant validé est refusé » devient « sans motif ». FR-90 : l'ordre est égal au montant **accepté** ; le **reste à payer** (FR-92, FR-104) se calcule sur le montant accepté ; accord partiel et acompte permettent `REGLE` quand le reste à payer de l'accepté est zéro. Coordonné avec L2-26 (table d'états).

**L2-25** · FR-77 · ADV F-36
Le motif du signataire proposé par l'IA n'est jamais validé par clic seul : texte modifiable, taux de motifs identiques signalé à `AUD`, interdit pour les validations au-dessus du seuil du `RESP`. Coordonné avec L1-09.

**L2-26** · FR-92, FR-135, FR-88, FR-124, FR-90, FR-99 · ADV F-15, F-43 · **R2**
Table de vérité **complète** des statuts dérivés : `ORDRE_EMIS` (au moins un règlement `A_PAYER`/`ECHEC`), `CHEQUE_A_REMETTRE`, `REGLE` (tous `PAYE`), et **tous les cas** `EN_COURS`, `PARTIEL`, `INCONNU` (un dossier dont le seul règlement est `EN_COURS`, `PARTIEL` ou `INCONNU` garde `ORDRE_EMIS`). `reste à payer` = montant **accepté** − payé. Acompte en `LITIGE` (FR-88/124) : ajouter la transition explicite `LITIGE` → `ORDRE_EMIS` pour acompte, ou retirer l'acompte en litige. Transition 42 étendue depuis `CHEQUE_A_REMETTRE` (et `REGLE` avec règlement non encaissé) tant que `DELAI_DENONCIATION_ECOULE` est faux : rappel de L2-01. Transition 10 : éclater en **deux lignes** (validation ; envoi) pour que la séparation soit testable. FR-99 : renvoi en `EN_VALIDATION` ; montant validé inférieur au montant accepté reste valable sans nouvelle offre (transition 10 dispensée de l'envoi). **Faire générer la table de test à partir du tableau**, pas à la main.

## 2F. Fraude

**L2-27** · FR-34, FR-35, FR-36, FR-39 · ADV F-39 · PO PARTIEL · DEMO
FR-34 : formulaire papier de secours numéroté, saisie différée avec double date ; canal « agence » `[ASSUMPTION: à ajouter si la compagnie a des agences]` ; le canal chatbot reste retiré. FR-35 : dire que la v2 promettait la déclaration depuis l'appel ; **l'accueil saisit pendant l'appel** (pas de voix, D13). FR-36 : « sans trou et jamais réattribuée » : les trous dus à une annulation sont consignés. Coordonné avec L1-20, L1-41.

**L2-28** · FR-125, FR-133, FR-127, FR-128, FR-130, FR-135 (transitions 31-38) · ADV F-14 · SPEC G3
(a) Le refus qui suit une fraude confirmée est écrit avec le **vrai motif juridiquement exigé**, ou suit une procédure d'information définie par le juriste ; supprimer « n'emploie pas le mot fraude ; il emploie le motif retenu par la direction » `[ASSUMPTION: à valider par le juriste, §13.2]`. (b) Au corporel VTM, un **signal n'est pas un blocage** sans décision humaine sous délai : revue sous N jours ouvrés (défaut 3), sinon escalade au `DG` et à `AUD` ; un blocage de plus de N jours avant l'échéance légale d'offre est escaladé au `DG` et `AUD`, et la décision (laisser courir la pénalité, adresser une offre motivée ou sous réserve) est enregistrée. (c) Signalement de fraude possible depuis `DECLARE`, `PIECES_ATTENDUES`, `OUVERT`, `LITIGE` et `REGLE` (transitions 31-36 étendues). (d) Argent déjà versé : chèque mis en opposition (L2-02) ; le **recouvrement d'indu** est dit hors périmètre au §10.2 avec un responsable désigné (L4-04). Coordonné avec L4-04.

## 2G. Offre, recevabilité, évaluation (arrondi, postes)

**L2-29** · FR-73, FR-69, FR-75 · RUB M · **R8**
FR-73 : l'arrondi à 5 000 FCFA ne vaut que pour les montants **calculés par le système** (provision d'ouverture, indemnité proposée par un formulaire d'instruction) ; le **montant arrêté** est au franc près (395 500 FCFA pour `SIN-2026-9002` ; l'exemple de test FR-69 à 702 000 reste valide). Ajouter un cas de test avec le résultat arrondi attendu. FR-75 : définition « Évalué » comme en L1-29. Coordonné avec L1-29.

**L2-30** · FR-70, FR-24 (renvoi) · RUB H3 · SPEC P6, R26, R27, M? · DEMO
(a) **Mode dégradé** : si `TABLE_NON_VALIDEE` à la mise en service, le volet corporel s'ouvre en saisie manuelle motivée, échéances légales actives, écart tracé (L1-25). (b) Chaque poste porte **retenu / contesté** et la **période datée** (ITT/ITP) ; la consolidation enregistrée ouvre l'échéance de l'offre définitive. (c) « Lettre de garantie de frais médicaux » sur demande, dans les tarifs (art. 258) : modèle au catalogue de courriers. (d) Catégorie « personne à la charge effective » (art. 229) ou renvoi au §13.2. (e) Balise `[NOTE FOR PM: voir A-12, barème corporel à saisir]` dans FR-70. (f) Découper FR-70 (un paragraphe, ~15 articles) en puces par article.

**L2-31** · FR-63, FR-63a (nouveau si besoin) · DEMO (omission n°3) · **R13**
**Suivi médical complet** : (1) contrôle de conformité d'un certificat (date, médecin, signature, cachet, original ou copie, durée d'arrêt ; verdict `COMPLET` ou `NON_CONFORME` avec motif) ; types de certificats, destinataires, niveau d'impact (bloquant, limité, aucun), canal de relance ; (2) **chronologie médicale** du dossier (natures d'événement : accident, soins, hospitalisation, consolidation, rechute…) ; (3) convocation : envoi SMS et e-mail tracé, confirmation de la victime, **absence** et **nouvelle convocation** ; (4) compte rendu d'examen (présence, documents présentés, antécédents, lésions, examens réalisés) et séquelles codées avec taux ; (5) **suivi après consolidation** : prochain examen, IPP initiale contre nouvelle, écart, aggravation, rechute ; (6) motifs de mission médicale et planning à jalons avec échéances ; (7) contestation médicale structurée (auteur, point contesté, valeur initiale et revendiquée, statut) ; (8) statut d'évaluation de chaque expertise (`RETENUE`, `ECARTEE`, `CONTESTEE`, `ANCIENNE`). Créer **FR-63a : Le suivi médical du dossier corporel** pour ces sous-règles si FR-63 devient trop longue. `[ASSUMPTION: motifs, jalons et types repris de la démo ; à confirmer avec le médecin-conseil]`.

**L2-32** · FR-70a (nouveau), FR-86, FR-91, FR-100 · DEMO (omission n°2) · **R13**
Créer **FR-70a : Le registre des décès et des ayants droit**. Pour un dossier mortel : registre des ayants droit (qualité, fondement du droit, vérification, part successorale, mineur et représentant légal, autorisation du juge, RIB vérifié, documents : acte de naissance, hérédité, non-remariage, tutelle) ; un règlement à un ayant droit exige sa ligne **vérifiée** ; mineur : transaction soumise aux parents ou au juge des tutelles (art. 234). Test : un règlement à un ayant droit non vérifié est refusé.

**L2-33** · FR-57a (nouveau) · DEMO (omission n°4) · **R13**
Créer **FR-57a : Les sinistres majeurs**. Seuil paramétrable (défaut `[ASSUMPTION: 20 000 000 FCFA]`) ; au franchissement : **avis au réassureur selon le traité** (FR-190), **comité de suivi**, **rapports périodiques** (quotidien ou hebdomadaire), niveau de criticité, contrôle de sous-assurance ; vue dédiée dans FR-147. Test : le scénario `SIN-2026-9003` déclenche le suivi renforcé. Coordonné avec L3-24.

**L2-34** · FR-40 · DEMO (urgence) · **R13**
Urgence corporelle : au-delà de la marque, un **parcours d'urgence** saisi par l'agent (signalé, secours, orientation, admission, évaluation, soins, hospitalisation, suivi) avec alertes « admission non confirmée » et « accord assureur non transmis » `[ASSUMPTION: aucune interface avec les hôpitaux ; données saisies par l'agent ; à confirmer à la séance d'immersion]`.

**L2-35** · FR-82 à FR-89, FR-122 · DEMO (omission n°8) · PO · **R13**
**Boucle de distribution** : états d'offre `EXPIREE` (offre sans réponse au terme) et `RETOURNEE` (pli non distribué), alerte « offre retournée » ; statut de courrier `REMIS` et `RETOURNE` avec preuve (FR-122) ; une offre non reçue ne laisse pas courir le délai légal sans alerte. Alerte « évaluation incomplète » (postes non chiffrés) à FR-136/FR-145. Aligner les états de l'offre de la démo (`A_PREPARER`, `EN_VALIDATION`, `PRETE`, `ENVOYEE`, `ACCEPTEE`, `REFUSEE`, `EN_NEGOCIATION`).

**L2-36** · FR-46, FR-122 · SPEC S20, S21, P8 · DEMO · **R13**
**Courriers** : copie du courrier envoyé **archivée automatiquement** ; **impression groupée** d'un lot de courriers `A_IMPRIMER` avec bordereau de départ (chaque courrier passe `ENVOYE` à la remise au courrier, avec l'agent et l'heure) ; registre unique des courriers sortants ; catalogue des 7 modèles listé en D.3 (L3-34) avec mentions légales ; modèle de **courrier FGA / exception de garantie** (avis à la victime avec n° du contrat, actif si `FGA_ACTIF`) ; modèle de convocation d'expertise matérielle (date, lieu, documents, préavis 48 h).

**L2-37** · FR-59 · SPEC M25, M26, P5 · PO
Accord sur devis : ajouter la condition « **aucun recours ouvert ou envisagé** » avec test (un dossier avec tiers responsable ne passe pas par l'accord sur devis) ; paramètre « inspecteur technique présent à l'expertise si devis > 1 000 000 FCFA » `[ASSUMPTION: valeur de la compagnie étudiée par le mémoire de 2014, défaut vide, à confirmer]` ; paramètre « photos après réparation » `[ASSUMPTION: défaut vide]`.

**L2-38** · FR-64, FR-68, FR-62 · SPEC P2, P3, M27, M31
FR-64 (grille de complétude automobile) : « dommages préexistants distingués » et « photo du point de choc + immatriculation ». FR-68 : paramètres de carence expert (information écrite du retard à 45 j, procès-verbal de carence à 75 j) et **délai de validation du rapport** 72 h `[ASSUMPTION: défauts de la compagnie étudiée par le mémoire de 2014 ; à confirmer]`. FR-62 : au-delà d'un seuil d'honoraires ou d'enjeu, la **désignation est validée par `RESP`** ; un choix hors classement exige un motif lu par `AUD`.

**L2-39** · FR-73, FR-72 · DEMO (omission n°9)
Postes d'indemnisation hors corporel avec **état par poste** (`A_EVALUER`, `EVALUE`, `A_VERIFIER`, `JUSTIFICATIFS_ATTENDUS`) : matériel (réparation, vétusté, immobilisation, remorquage, valeur de remplacement) ; risques divers (bâtiment, contenu, perte d'exploitation, sauvetage). Alerte « évaluation incomplète » tant qu'un poste est `A_EVALUER`.

## 2H. Échéances, états, notifications, écrans

**L2-40** · FR-141, FR-142, FR-121, FR-102 · SPEC M12, M22, M29, R22 · RUB basse
FR-142 : échéance « **clôture après le dernier règlement `PAYE`** » (défaut 15 j) avec indicateur (M12) ; échéance « honoraires payés un mois après réception du rapport » (défaut 30 j, M29). FR-141 : suivi du **PV d'accident corporel** (art. 230 : 3 mois ; nature « suivi », pas réglementaire contre la compagnie ; départ : date de l'accident, arrêt : PV reçu). FR-121 : échéance interne « décision d'exclusion soumise » 48 h et courrier de refus sous 72 heures, ou justifier 2 jours ouvrés `[ASSUMPTION: procédure du mémoire]`. FR-84 et FR-102 : écrire « 48 heures **ouvrées** » et « 72 heures **ouvrées** » partout (calendrier de la compagnie, A-18).

**L2-41** · FR-103 · SPEC M34, S43 · DEMO · PO (deck) · **R13**
FR-103 : « **prévision hebdomadaire des règlements** » (ordres `A_PAYER`, chèques à remettre, honoraires visés) remise à la comptabilité chaque semaine ; **engagements de décaissement en deux colonnes séparées (exigible / à confirmer, jamais sommées)** alimentés par l'indemnité arrêtée, les missions confiées et les chèques non retirés (test : le total n'additionne jamais les deux colonnes) ; fraîcheur de l'état : continue pour la file `CPT`, quotidienne pour l'export. Coordonné avec L3-16.

**L2-42** · FR-111, FR-118, FR-114 · SPEC G5, R17, R48 · **R13**
FR-111 : l'art. 608 (déclaration au fonds dans les 3 mois) ne vaut que pour « **exception de garantie invoquée** » (FR-121) ; « auteur inconnu ou non assuré » relève des art. 605 (transaction 1 mois) et 606 (PV 60 jours) ; renommer `legal.fga_declaration_mois` (L3-39). FR-86 et FR-114 : la dénonciation et les mises en demeure ne sont reçues qu'avec **preuve de réception** par un moyen listé en paramètre (le recommandé électronique n'est pas accepté tant que le juriste n'a pas tranché).

**L2-43** · FR-135, FR-136, FR-145 · ADV F-41 · RUB
`PIECES_COMPLETES` (FR-136) : définir si une pièce « en contrôle » est « attendue » (oui : tant que le contrôle humain de FR-165 n'a pas rendu la pièce « reçue »). Éclater la ligne de la transition 10 (voir L2-26).

**L2-44** · FR-147, FR-149 · DEMO · PO
FR-147 : ajouter la **vue par étape** (11 statuts) et les vues « tiers externes », « sinistres majeurs », « dommages lourds » et « réparations » (L3-14, L2-33) ; FR-149 : file des écarts de source (L3-04).

**L2-45** · FR-36 · ADV F-42 · SPEC M8
« Séquence sans trou ni réutilisation » : écrire « sans réutilisation ; un trou dû à une annulation est **consigné** avec motif » ; le contrôle de séquence ne signale que les trous **non consignés** (pas de faux positifs). Le test de séquence est dans le plan de contrôle FR-210 (L3-17).

**L2-46** · FR-146, FR-143, FR-47 · PO (ton, B.2) · DEMO
FR-146 : délai de **première réponse** à l'assuré, **langage clair, sans jargon CIMA** dans les messages ; suivi de distribution (L1-32). FR-47/143 : la relance est **rédigée par l'IA et envoyée en un clic**, ou **envoyée automatiquement à l'échéance** (5 jours entre deux relances, 3 sans effet) `[ASSUMPTION: envoi automatique à confirmer]`.

**L2-47** · FR-123, FR-135 (transitions 25-27), FR-143 · ADV F-33
`SANS_SUITE` : relances **tracées par le serveur** (envoi réel via `notification`, pas déclarées par le gestionnaire) ; second contrôle du `RESP` au-delà d'un seuil de provision `[ASSUMPTION: 500 000 FCFA]` ; classement visible dans la file du responsable. Corporel VTM : voir L2-19.

**L2-48** · FR-61, FR-63 · ADV F-31
Une **seule machine d'états** de mission, avec sous-étapes médicales : `SUGGEREE` … `ACCEPTEE` … `VALIDEE`, `CONTESTEE` → `ARBITREE`, plus les sous-étapes médicales (`A_DESIGNER`, `CONVOCATION_ENVOYEE`, `EXAMEN_REALISE`, `RAPPORT_ATTENDU`, `RAPPORT_RECU`, `EN_ANALYSE`). La condition `EXPERTISE_VALIDEE` (« toutes les missions validées ou arbitrées ») s'évalue sur la machine unique.

**L2-49** · FR-56, FR-54, FR-108 · SPEC P1
FR-56 : champs lus du **constat amiable** (parties, assureur et n° de police de chaque partie, circonstances, croquis, signatures) ; « assureur et n° de police du tiers » est la source du **débiteur du recours** (FR-108). Le constat reste un paramètre (le Code CIMA n'en parle pas).

**L2-50** · FR-134, FR-135, FR-30 · PO (écart) · ADV F-26 · RUB basse
« 42 transitions » partout ; « 41 » est à corriger dans les FR de §5 (R10).

**L2-51** · FR-105, FR-107 · PO B.2
La clôture ajoute au dossier : « réouverture tracée » (FR-107 inchangé). Aucune correction de fond ; vérifier que les **deux numéros** (`DEC-` et numéro officiel) restent des critères de recherche.

**L2-52** · Transversal §5 · R14, RUB basse
Remplacer « compagnie du même groupe au Sénégal » et variantes (FR-78, FR-84, FR-102, FR-110…) par « la compagnie étudiée par le mémoire de 2014 (zone CIMA) ». Balise `[NOTE FOR PM: voir A-16]` aux FR de la chaîne critique si le PO le demande.

**L2-53** · FR-14 (renvoi), FR-85 · SPEC R14
Pas de correction supplémentaire ; vérifier que FR-85 reprend le plancher et les suspensions de L2-22.

**L2-54** · FR-82, FR-85, FR-108 à FR-111 · SPEC R7 · **R12**
**Corporel à plusieurs véhicules** : sous-règle de FR-82/FR-85 : saisie des véhicules et assureurs impliqués ; **désignation de l'assureur qui présente l'offre pour compte commun** (art. 231 al. 6, 267 à 270, si SÛR), **intérêts de retard à sa charge**, **répartition entre assureurs** ; le dossier bascule en « mandat pour compte d'autrui » ; le barème de responsabilité est un paramètre (à numériser, D21). Test : dossier à deux véhicules → un seul assureur meneur désigné, intérêts imputés à lui.

**L2-55** · FR-33, FR-30, FR-31 · PO écart 3 (« accord » libère l'argent)
Dans les quatre règles de FR-33 : ajouter « l'argent n'est libéré qu'après accord **enregistré par un tiers** (FR-86) et, au corporel, après la fin du délai de dénonciation ». Aucun autre changement.

**L2-56** · Style (BASSE) · RUB, ADV
Un code de refus nommé pour chaque nouvelle condition ; « 42 transitions » ; unifier « accord » / « procès-verbal de transaction » ; découper les FR longues (FR-70, FR-85) en puces.

---

# LOT 3 — §6 (FR-150 à FR-219) et annexes A, B, C, D

Pas de numéro libre : sous-règle, ou FR avec suffixe lettre (FR-185a, FR-161a…) si indispensable. L'annexe E est **nouvelle** (créée par L3-36).

## 3A. Échange avec le LC, numéro de sinistre, données de santé (R3, R5)

**L3-01** · FR-198, FR-199, FR-200 · ADV F-04 · **R3**
FR-199 : « la liste est la même que le LC reçoive ou non par la suite » ne vaut que pour la **liste** ; ajouter « une déclaration est dans **une seule voie** : envoi automatique **ou** liste « à saisir » ». FR-200 : « une coupure ne perd aucun envoi ; les envois attendent dans une file et partent à la reprise » **sauf** les déclarations passées à la liste, dont l'envoi en attente est **annulé** (état `SAISIE_MANUELLE`) ; une déclaration de la liste n'est jamais renvoyée automatiquement. FR-198 : un numéro reçu pour une `DEC-` déjà numérotée est un **écart** (file des écarts), jamais un second rattachement ; la `DEC-` est l'**identifiant d'idempotence** : le LC renvoie le numéro existant `[ASSUMPTION: capacité à exiger du LC ; sinon contrôle de doublon par Prospera avant tout rattachement]`. Coordonné avec L2-15, L3-27.

**L3-02** · Annexe C (C-13, C-14, C-17), FR-196 · ADV F-13 · **R5**
C-13 : **retirer** la gravité (léger, modéré, grave, mortel), le type de sinistre corporel et le nom de la victime d'un dossier corporel si le LC n'en a pas strictement besoin ; envoyer seulement le **code de volet**, les montants et des **motifs codés**. C-14 et C-17 : « motif » devient un **motif codé** (liste fermée en D.3), jamais un texte libre. FR-196 : « le LC ne reçoit **aucune donnée médicale** : ni gravité, ni nature des lésions, ni texte libre ; seulement le volet, les montants et des motifs codés » ; test sur le LC fictif : aucun champ de santé dans les échanges sortants. Base légale : voir L1-07.

**L3-03** · FR-153, FR-154, FR-155, FR-164, FR-165, FR-211 · ADV F-12 · **R5**
Rendre les écrans conformes à FR-9 (L1-07) : FR-164/165 : `ACC` et `NUM` ne reçoivent **aucun extrait** d'une pièce médicale ; le contrôle de qualité d'une pièce médicale = lisibilité de l'image seulement (ou fait par `ARCH`/`MED`) ; une pièce médicale est classée sous un type « médical » qui ne s'affiche jamais en aperçu. FR-154 : le résumé sourcé **exclut** les champs de santé pour les rôles hors FR-9 ; `DG`/`DT` : accès par dossier ouvert à la validation, journalisé. FR-155 : la recherche en langage naturel **ne filtre ni ne retourne** de champ de santé (« dossiers avec incapacité > 30 % » refusé hors rôles de FR-9). Test : un test par rôle sur chacun de ces écrans.

**L3-04** · FR-217, annexe C (C-9, C-15), FR-149 · ADV F-16
Dossier « tenu par Prospera » : définir la **prise en main** par une **liste fermée** (affectation ou première transition du dossier) ; une consultation, une note ou un dépôt de pièce ne la déclenchent pas. Règlements, annulations et clôtures venant du LC sont des **faits reçus** (C-15 dans le sens inverse) qui **bloquent les ordres** et s'affichent en alerte rouge ; un dossier modifié par le LC après prise en main passe en **« litige de source »** : aucun paiement tant que l'écart n'est pas résolu. C-9 : les « montants payés » lus du LC ne remplacent pas le payé de Prospera (le payé fait foi dans Prospera) ; la mise à jour nocturne n'écrase jamais une provision revue à la main.

**L3-05** · FR-180 · ADV F-20 · R15
Aligner le portail du cabinet externe sur L1-19 : hébergé par le relais Money Vibes `[ASSUMPTION: voir L1-19]` ; pièces chiffrées à durée limitée ; le cabinet ne voit que ses missions et jamais la provision ; voie `TRANSMISE` en repli. Ajouter « aucune pièce médicale n'y transite sauf nécessité de la mission » (FR-9).

**L3-06** · FR-201 · ADV F-38 · RUB H2
Corriger FR-201 : « payer » LC coupé **revérifie** la police sur la dernière projection datée (âge ≤ seuil) avant d'émettre ; sinon blocage « à relire ». Fraîcheur : 5 minutes (interface), 24 heures (fichiers) : valeurs de l'annexe D ; FR-3 et FR-41 s'alignent (L1-26, L2-20).

**L3-27** · Annexe C (C-9, C-11, C-13, C-18) · ADV F-04 · **R3**
C-13 (envoi d'une déclaration) : **`DEC-` champ obligatoire**, clé d'idempotence. C-11 : la réponse « indicateur de doublon + numéro existant » est traitée par la procédure de L2-15 (écart, pas rattachement). C-18 (liste « à saisir ») : le report du numéro obtenu clôt la voie `SAISIE_MANUELLE`. Préfixe distinct (`PRO-`) pour les numéros attribués par Prospera et **contrôle d'unicité contre C-9** au basculement ; format `SIN-AAAA-NNNN` seulement dans ce cas.

## 3B. Provisions, réassurance, états, direction

**L3-07** · FR-193, FR-103 (renvoi) · SPEC G7 · DEMO
FR-193 : l'export est une **proposition de mouvements pour la comptabilité** (pas une écriture passée au grand livre) ; garder « somme des débits = somme des crédits » comme contrôle de l'export. Ajouter l'**état de liquidation** (provision à l'ouverture, au bilan, réglé, reprise, charge nette, écart d'évaluation, soldé) à l'export. Coordonné avec L3-08.

**L3-08** · FR-189, FR-206, FR-228 (renvoi), FR-190 · DEMO (omission n°5) · PO · **R13**
**États techniques de la direction** : triangle de liquidation, taux de liquidation, coût moyen, état par branche et par exercice de survenance, **boni et mali de liquidation** (seuil significatif `[ASSUMPTION: 250 000 FCFA]`), charge nette après coassurance et réassurance, **note de synthèse** de direction générée depuis les données et rejouable (analyse, lecture par domaine, position CIMA, décisions par priorité, projection à 30 jours), **revue mensuelle** imprimable, export du parapheur (engagement, charge nette, réserves). FR-206 : fixer les indicateurs de l'onglet « technique et réglementaire » (charge après coassurance et réassurance, engagements restants, conformité aux délais CIMA). L'IBNR reste hors Prospera (FR-189).

**L3-09** · FR-188, FR-189 · ADV F-18 · SPEC R30, G4 · **R11**
FR-188 : « la provision comprend l'**indemnité estimée et les frais individualisables** (honoraires convenus, frais de justice) » (art. 334-8/334-12) ; **pas de report** de revue de provision tant qu'un délai légal est actif ; poste **« risque de pénalité »**. FR-189 (PSAP) : au corporel VTM, un sinistre non payé dont l'obligation légale court reste **provisionné** (non nul) même après refus ou classement (R11, L2-19) ; ajouter le motif « risque de pénalité 5 % ». Coordonné avec L2-18, L2-19, L2-22.

**L3-23** · FR-192 · SPEC M18, F12
FR-192 : **registre chronologique exportable** des déclarations dans l'ordre d'arrivée (exercice de survenance, date de l'opération, date de réception, catégorie, bénéficiaire, référence de règlement, recours, observation) ; le registre coté et paraphé du mémoire devient le journal chaîné de FR-13. Le contenu exact des états C10 reste « à vérifier par le juriste » (ligne au §13.2, L4-12).

**L3-24** · FR-190, FR-191 · DEMO · **R13**
FR-190 : **avis au réassureur selon le traité** à l'atteinte du seuil de sinistre majeur (L2-33) ; FR-191 : charge nette après clé de coassurance dans le rapport périodique du sinistre majeur. Coordonné avec L2-33.

**L3-16** · FR-207, FR-206, FR-103 (renvoi) · SPEC S43 · PO (deck) · DEMO · **R13**
FR-207 : vue **engagements à décaisser** (validé moins payé, par bénéficiaire), honoraires à décaisser ; **deux colonnes séparées exigible / à confirmer, jamais sommées** (test : le total n'additionne jamais les colonnes). **Fraîcheur** : la charge de chaque gestionnaire et les retards sont recalculés à la lecture ; les états de quittances/chèques sont continus pour la file `CPT`, quotidiens pour l'export (le « J+1 » du deck devient « quotidien »). Coordonné avec L2-41, L1-23.

**L3-17** · FR-210, FR-213, FR-206, FR-208, FR-144 · SPEC M8, M10, M13, M20, M12 · **R13**
Plan de contrôle FR-210 : (a) test « **trou ou doublon** dans la série des `DEC-` et dans les numéros officiels reçus du LC » (tolérance zéro, gravité majeure, responsable `AUD` ; les trous consignés sont exclus, L2-45) ; (b) **revue mensuelle** de tous les dossiers vivants (statut, provision, dernière action, échéance) visée par `RESP`, avec trace (qui, quand), alerte si non faite à M+5 jours ; (c) **veille de 3 jours** avant règlement d'un dossier sensible. FR-213 : compteurs du mémoire (déclaration → enregistrement, ouverture → validation, rapport → offre, offre → paiement) avec alerte sur l'écart anormal rapport-quittance. FR-206/208 : **état hebdomadaire des déclarations**, généré au jour et à l'heure paramétrés, visé par `RESP`, remis à `DT` puis `DG` ; état hebdomadaire des recours par débiteur (FR-110) généré ici.

**L3-26** · FR-212, FR-213 · ADV F-28 · RUB M
Pour chaque indicateur de §9 (L4-02) : une **requête de calcul**, une **source de donnée** et un **propriétaire** dans FR-212/213 ; supprimer ceux qui n'ont pas de source (« appels traités pendant l'appel » : aucun appel n'est enregistré). Doublon de règlement : définition de L1-16. Coordonné avec L4-02.

**L3-25** · FR-211 · ADV F-28 · RUB
« Dossier prêt pour la CRCA en une journée » : garder comme `[ASSUMPTION: non mesurée ; à mesurer à la première revue]`, ne pas en faire une cible. Aucun autre changement.

## 3C. Experts, intervenants, documents, fiche dossier

**L3-10** · FR-184, FR-185 · RUB H2 · SPEC M27 · PO
FR-184 : délai de rapport « **7 jours** » (valeur gardée) ; dire que c'est le bas de la fourchette 7 à 10 jours du mémoire ; validation du rapport sous 72 h `[ASSUMPTION: voir L2-38]`. FR-185 : budget indicatif ; dépassement bloquant au-delà de la tolérance de L2-07.

**L3-11** · FR-182 · ADV F-07 · SPEC M15, M29
Honoraires : **visa par `RESP`** (jamais `CPT`), plafond d'honoraires par niveau de la matrice, comité au-dessus ; `CPT` **émet seulement** ; rapprochement **facture / lettre de mission / rapport reçu** (pas de visa sans rapport validé) ; le visa d'un honoraire au-delà du convenu exige un motif (déjà là). « Le CPT qui a visé n'émet pas » est supprimé (CPT ne vise pas). Rapprochement avec l'état comptable (L1-16). Coordonné avec L1-06, L2-07.

**L3-12** · FR-177, FR-178 · DEMO · SPEC M31, F6 · PO
FR-177 : ajouter un **référentiel des garages et prestataires** (agrément, historique de devis) et des **assureurs adverses** : FR-60 (analyse de devis) et FR-132 (graphe de fraude) en dépendent. FR-178 : un agrément échu rend l'expert non désignable ; contrôle des qualifications (art. 272) ; renvoi des conventions de place au §13.2 (L4-12). La désignation hors classement est lue par `AUD` (L2-38).

**L3-13** · FR-179, FR-180, FR-181, FR-61 (renvoi) · DEMO
FR-179 : « mes visites » (agenda des visites de l'expert interne) et lecture des grilles par l'expert. Contenu minimal du **PDF du rapport rédigé en ligne** (identification, rubriques, imputation, conclusions, signature, version), versé comme pièce et **présent au bordereau de versement**. La **lettre de mission** (référence `LM-`) est **générée par le serveur** avec sa référence.

**L3-14** · FR-185a (nouveau) · DEMO (omission n°6)
Créer **FR-185a : Les intervenants tiers des risques divers**. Objet « intervenant » (syndic, transporteur, partie adverse, administration, prestataire, avocat, courtier, compagnie adverse) : rôle, action attendue, relance, date cible, impact du retard, statuts `EN_ATTENTE`, `RELANCE`, `RECU`, `SANS_SUITE` ; alimente « mes attentes » (FR-145/147). Test : un intervenant sans réponse à l'échéance remonte dans la file.

**L3-15** · FR-161 · DEMO (omission n°7)
Créer ou étendre FR-161 en **registre des documents officiels** (PV de police et de gendarmerie, rapports d'autorité) : type, autorité, statut de vérification (`RECU`, `A_VERIFIER`, `VERIFIE`, `SOUS_RESERVE`, `REJETE`, `OBSOLETE`), original ou copie, **informations clés « déclarées dans le PV », jamais une conclusion de responsabilité**, attendu relancé avec échéance. Ils servent la preuve du recours et le vol ou l'incendie.

**L3-18** · FR-152, FR-150 · PO PARTIEL · DEMO
FR-152 : ajouter à la fiche l'**origine du dossier** (repris par API ou fichier / né dans Prospera) et l'**historique des échanges et relances** envoyés (relance SMS comprise). FR-150 : « on retrouve un dossier archivé par ses références métier (nom, sinistre, police, immatriculation) ; **jamais par la cote**, qui sert seulement à localiser ».

**L3-19** · FR-162, FR-165 · DEMO
FR-165 : le bouton « verser » reste **grisé tant qu'une lecture est en cours** ; compteur « N lus sur M ».

**L3-20** · FR-167, FR-170, FR-171 · DEMO · SPEC M23
FR-167 : fixer le **format de chaque numéro** (`QUI-`, `ORD-`, `REC-`, `CRE-`, `MED-`, `CTX-`, `ENC-`, `CRR-`, `LM-`) en D.3 ou les déclarer paramétrables ; FR-170/171 : **étiquette avec code de lecture** (code-barres ou QR) pour la chemise et la boîte ; **sous-chemises** (déclaration/correspondances, police, dommages/devis/rapport, règlement) en paramètre `[ASSUMPTION: si la compagnie les garde]` ; coût de numérisation 45 FCFA la page : paramètre de pilotage (D.3), non une règle.

**L3-22** · FR-186, FR-187 · ADV F-19 · SPEC R23
FR-187 : l'alerte « opposabilité à la victime à vérifier » est affichée sur toute réserve `CONTRAT_VERIFIE` du corporel VTM ; FR-186 : projection périmée = « à relire », jamais refus. Coordonné avec L2-20.

## 3D. Support papier, restauration, reprise

**L3-29** · FR-169, FR-172 · ADV F-32
FR-169 : après scellement, le support de référence **ne change pas** ; FR-172 : « le papier fait foi tant que le juriste n'a pas validé la valeur probante de la copie numérisée ; le numérique ne le remplace pas ». Supprimer « le support de référence passe du papier au numérique ». Ligne au §13.2 (valeur probante, horodatage qualifié, recommandé électronique). Coordonné avec L1-33, L4-12.

**L3-35** · FR-176 · RUB H2 · ADV F-22
FR-176 : « test de restauration **mensuel** » (comme FR-236), pas annuel ; renvoi à FR-236 pour les compteurs et l'état « restauration en cours » (L1-17).

**L3-21** · FR-214, FR-216, FR-219 · RUB M · PO
Poser des balises `[NOTE FOR PM: voir A-10]` (FR-214, amendement du PRD Reprise : API au premier jour contre fichiers seuls en février) et `[NOTE FOR PM: voir A-12]` si FR-219 renvoie au barème. FR-214 reste « API ou fichier Excel ou JSON » (le récit du PO fait foi).

**L3-37** · FR-219 · ADV F-21 · RUB H3 · **R7**
FR-219 : pour chaque entrée de la compagnie (barèmes saisis, délégations réelles, liste des experts, doc du LC, volumes), ajouter la **date limite de livraison** et la **conséquence** : « sans barèmes, le décompte et la provision d'ouverture ne sont pas utilisables en production » devient « le corporel fonctionne en **mode dégradé** (L1-25) » ; ne pas écrire « la fonction part en bientôt ». Coordonné avec L1-24.

**L3-38** · FR-218 · ADV F-21
FR-218 : étendre le **feu vert module par module** au circuit `sinistres` (comme à la reprise) : liste de contrôle de mise en service (entrées livrées, tests de recette, formation de FR-240) ; le feu vert est donné par le PO et la compagnie, jamais par défaut. Aucun module n'est retiré (R7).

## 3E. Annexes

**L3-28** · Annexe D (toutes les tables), FR-4 (renvoi) · ADV F-27
Ajouter trois colonnes à chaque table de l'annexe D : **propriétaire**, **validateur**, **périodicité de revue**. La matrice de délégation n'est pas approuvée par le seul `DG` qu'elle engage : double contrôle du `DG` et d'`AUD`. D.5 : référentiel légal « que la compagnie ne modifie pas » : ligne « mise à jour » (fournisseur, relecture du juriste, date d'effet).

**L3-30** · Annexe D (D.1 `MFA_ROLES`) · ADV F-29
`MFA_ROLES` = tout rôle autorisé à lire une donnée de santé ou à enregistrer un accord (L1-08) : `DG`, `DT`, `RESP`, `CPT`, `AUD`, `ADMIN`, `EXPE`, `GEST`, `MED`, `GREC`, `ACC`, `NUM` (liste par capacité, pas figée).

**L3-31** · Annexe B (matrice d'accès) · ADV F-05, F-08, F-10, F-12, F-30 · **R4, R5**
Ajouter : **enregistrer l'accord** = `ACC` (et agent non partie) ; **signer la quittance** (marquer `SIGNEE`) = agent distinct de l'émetteur ; **contrôler** (niveau 1) = second `GEST` désigné ou `RESP` ; **second `CPT`** validateur d'ordre ; **visa des honoraires** = `RESP` ; **écarter un blocage fraude** = `RESP`/`DG`/`DT` avec avis `AUD` et relecteur non partie ; **responsable LBC** ; pièces médicales : `ACC`, `NUM` = type et existence ; `DG`/`DT` = par dossier ouvert à la validation. Les lignes de L1-04 (16 cumuls) y sont reflétées.

**L3-33** · Annexe A (A.1 sinistres, états), Annexe A (A.5) · ADV F-02 · RUB H2 · **R2, R10**
A.1 : états du règlement à **six** (`A_PAYER`, `EN_COURS`, `INCONNU`, `PARTIEL`, `PAYE`, `ECHEC`), états de chèque ajoutant `CHEQUE_EN_OPPOSITION`, condition `DELAI_DENONCIATION_ECOULE`, état `SAISIE_MANUELLE` ; « 41 transitions » → « **42** » ; A.5 : `DEC-` clé d'idempotence, voie unique.

**L3-32** · Annexe A (toutes les fiches) · RUB H1 · **R7**
Ajouter une colonne **« Ordre de construction recommandé »** : 1 = chemin de la démo (déclarer, ouvrir, instruire, chiffrer, décider, offrir, accord, payer, clore, archiver) ; 2 = recours, fraude, états techniques ; 3 = IA avancée. Mention explicite : **« sans valeur de périmètre »** (le périmètre du premier jour reste complet, R7). Coordonné avec L4-05.

**L3-34** · Annexe D (D.3) · SPEC S20, P8, R26 · DEMO
D.3 : catalogue des **modèles de courrier** (code, FR, mentions légales obligatoires au corporel) : demande de pièces, offre, refus, relance, accusé, convocation d'expertise (médicale et matérielle), mise en demeure, lettre de garantie de frais médicaux, courrier FGA (si `FGA_ACTIF`), lettre de mission ; liste des **motifs codés** vers le LC (L3-02) ; paramètres de L2-33 (seuil majeur), L2-37, L2-38.

**L3-36** · Annexe E (nouvelle) · ADV F-26 · DEMO (omission n°1) · **R9**
Créer **Annexe E. Table de reprise des vérifications de la démo** : E.1 les **104 vérifications** du rejeu 2 (source : `rejeu-2/verifications.txt` de la démo), une ligne chacune : **gardée**, **réécrite** (nouvelle valeur attendue) ou **retirée** (décision citée). Au moins 9 changent : statuts renommés (`PIECES_ATTENDUES`, `EN_INSTRUCTION`) ; bloc 13 « évalué à 445 500 » → **395 500** (franchise déduite, D15) ; bloc 14 « ordre émis dès la validation » → offre et accord avant l'ordre (D6) ; bloc 16 « transmettre au pôle recours après le règlement » → recours dès l'ouverture, **276 850** sur 395 500 (D10) ; reset réservé à `ADMIN` ; sélecteur de profil. E.2 la liste des **21 refus** à provoquer. Recette : 104 sur 104 **de la table réécrite**.

**L3-39** · Annexe D (D.2, D.5) · SPEC G1, G5, F4 · ADV F-25 · **R10**
D.2 : `delai_declaration_*` : unité **jour ouvré** pour le défaut général (5) et **heure** pour le vol (48) ; 3 jours (transport de marchandises) gardé ; test « valeur sous le plancher refusée ». D.5 : renommer `legal.fga_declaration_mois` pour ne garder l'art. 608 que sur « exception de garantie invoquée » (L2-42) ; SMIG : ajouter « SMIG du pays de résidence si plus élevé » (§13.2). Plancher légal d'abord, partout (R10).

**L3-40** · Annexe D (liste consolidée des nouveaux paramètres) · tous
Ajouter (code | libellé | défaut | unité | source | FR) : `reglement.second_controle_seuil` (5 000 000, FCFA, L1-03) ; `accord.double_enregistrement_seuil` (3 000 000, FCFA, L2-04) ; `deleg.niveau1.controle` (oui, L1-06) ; `deleg.comite.delai_tenue` (5, jour ouvré, L2-08) ; `deleg.honoraires.plafond.niveau1..n` (L2-07) ; `honoraires.tolerance_budget` (10 %, L2-07) ; `penalite.base` (offre, L1-27) ; `fraude.revue_delai` (3, jour ouvré, L2-28) ; `sans_suite.seuil_second_controle` (500 000, L2-47) ; `majeur.seuil` (20 000 000, L2-33) ; `majeur.rapport_frequence` (hebdomadaire) ; `rapport.validation_delai` (72 h, L2-38) ; `expert.carence_info` (45 j) et `expert.carence_pv` (75 j) ; `expertise.inspecteur_seuil_devis` (vide, L2-37) ; `cloture.apres_dernier_reglement` (15 j, L2-40) ; `honoraires.paiement_delai` (30 j) ; `pv.suivi_mois` (3, L2-40) ; `exclusion.decision_soumise` (48 h) ; `rpo` (24 h) et `rto` (8 h ouvrées) (L1-17) ; `boni_mali.seuil` (250 000) ; `numerisation.cout_page` (45) ; `calibration.*` (L1-30) ; `fiche.ouverture_p95` (3 s), `ocr.lot50` (10 min), `resync.fin` (6 h) (L1-18) ; `revue_mensuelle.delai` (M+5 j, L3-17) ; `etat_hebdo.jour_heure` ; `formation.*` (L1-21) ; `liaison.age_max` rappelé : 5 min (interface), 24 h (fichiers). Chaque ligne avec propriétaire/validateur (L3-28).

**L3-41** · Style (BASSE) · RUB, ADV
Annexes : « 42 transitions » ; remplacer « compagnie du même groupe au Sénégal » (≈ 20 occurrences, annexe D comprise) par la formule de R14 ; découper FR-176 et les FR longues en puces ; identifiants préfixés.

---

# LOT 4 — §9 à §13 (liste seulement ; traités plus tard, au tri)

- **L4-01** · §9 · RUB M · Numéroter les indicateurs **SM-1 … SM-n** ; pour les 11 lignes « en hausse / à fixer », poser une cible provisoire `[ASSUMPTION]` (exemple : « 70 % des appels traités pendant l'appel à 3 mois, 90 % à 6 mois ») ; dire qui mesure la valeur de départ et quand.
- **L4-02** · §9 · ADV F-28 · Pour chaque indicateur : requête de calcul, source, propriétaire ; supprimer ceux sans source (« appels traités pendant l'appel », « 100 % portent un chronomètre » tautologique) ; « règlements payés deux fois » = définition de L1-16 ; « coupure déclarée » : par qui ; message d'un assuré au guichet non horodaté. Coordonné avec L3-26.
- **L4-03** · §9 · PO écarts 5 et 10 · Indicateurs à ajouter : décisions défendables (FR-26) ; « 0 dossier introuvable à la relance » ; fraîcheur des états ; blocages levés par le validateur ; taux de motifs identiques à la proposition de l'IA ; confiance de l'assuré (délai de première réponse).
- **L4-04** · §10.2 · R10, R13, ADV F-14, SPEC P4, R17 · « 41 » → « 42 transitions » ; remplacer « 11 statuts et 42 transitions **non paramétrables** » par le renvoi à FR-27 (évolution par paramètres puis par version) ; ajouter aux exclusions : recouvrement d'indu (responsable désigné), pluralité d'experts et contre-expertise contradictoire entre assureurs (jusqu'à réception de la convention de place), reversement des sommes prescrites (art. 28), vue « réseau » (L1-23).
- **L4-05** · §10 (nouveau §10.3 ou §10.1 bis) · RUB H1, ADV F-21 · **R7** · Ajouter l'**ordre de construction recommandé**, sans valeur de périmètre : chemin de la démo d'abord (déclarer → ouvrir → instruire → chiffrer → décider → offrir → accord → payer → clore → archiver), puis recours, fraude, états techniques, IA avancée. Définir le « jour 1 minimal » comme **critère de mise en service** (go/no-go par module, feu vert L3-38) sans retirer de fonction. Balise `[NOTE FOR PM: voir A-16]`. Coordonné avec L1-24, L3-32.
- **L4-06** · §10.1 · PO OMIS · Ajouter au périmètre du premier jour : mise en service (FR-240), réversibilité (FR-242), vue finance et exploitation (FR-229), registre des décès et ayants droit (FR-70a), suivi médical (FR-63a), sinistres majeurs (FR-57a), intervenants (FR-185a), états techniques, courriers (copie, impression groupée).
- **L4-07** · §12.2 · R7, R15, ADV F-20, SPEC · **A-16 reste une question au PO** (charge de février, 17 à 20 semaines pour 10 disponibles) : ajouter la phrase « le PRD ne coupe rien ; il recommande un ordre de construction (L4-05) ». Nouvelles actions : portail cabinet externe (L1-19 : hébergé par le relais ?) ; vue réseau ; propriétaire et date de la revue juridique (L1-25, A-15) ; mode dégradé du corporel (A-12) ; aligner **A-3** sur « Excel ou JSON » (le récit du PO fait foi).
- **L4-08** · §12.1 · R1 à R15 · Ajouter les arbitrages de `arbitrages-relectures.md` comme décisions D22 et suivantes (R1 à R13), chacune avec renvoi aux FR et balise « à confirmer à la séance d'immersion » quand elle touche une pratique de la compagnie ; D1-D21 restent autoportantes (RUB). Corriger D5 « 41 » → « 42 » et D15 (ordre du décompte : dommage → vétusté → règle proportionnelle → plafond → franchise).
- **L4-09** · §12.2 A-12, A-15 · RUB H3, ADV F-21 · A-12 : écrire l'option « saisie manuelle motivée » (mode dégradé, L1-25) ; A-15 : propriétaire et date cible de la revue juridique.
- **L4-10** · §12.3 · R14, RUB basse · « compagnie du même groupe au Sénégal » → « la compagnie étudiée par le mémoire de 2014 (zone CIMA) » (≈ 20 occurrences hors annexes) ; ajouter les risques : entrées de la compagnie en retard, RPO non fixé, base légale santé, portail cabinet.
- **L4-11** · §13 (index) · RUB M, ADV F-26 · Recompter les balises **après** toutes les corrections (annonce 176 ; décompte brut 178 dans §0-§7 et 74 dans les annexes) ; ajouter une colonne « effet si faux : faible / moyen / bloquant » et trier les ~20 hypothèses bloquantes en tête de §13.1 (SMIG, base de la pénalité, matrice de délégation, existence du FGA, base légale santé, numéro du LC, portail cabinet, capacité du LC à dédupliquer sur `DEC-`).
- **L4-12** · §13.2 · SPEC F1, F3 à F6, F8 à F10, F12 à F19, R15 · Ajouter les lignes J manquantes : version consolidée du Code CIMA ; règle de comptage des mois (FR-140) ; articulation suspension / saisine du juge (FR-85, FR-124) ; SMIG du pays de résidence ; art. 263 et validation des tables par un actuaire ou un juriste ; conventions de place (indemnisation directe, constat amiable, experts automobiles, art. 275, qualifications art. 272) ; transferts hors Togo et notification des violations ; non-information du client (LBC, J-11) ; valeur probante de la copie numérisée, horodatage qualifié, recommandé électronique ; contenu des états C10 ; délais contractuels des autres branches ; opposabilité de l'art. 210 ; effet d'une mise en demeure sur la prescription ; dossier refusé au corporel (art. 237) ; transposition des art. 406-407 ; **base légale du traitement des données de santé pour indemniser (R5)** ; recommandé électronique pour la dénonciation (L2-42).
- **L4-13** · §13.1 · tous · Indexer les nouvelles `[ASSUMPTION]` posées par les corrections (L1-03, L1-06, L1-17, L1-18, L1-19, L2-04, L2-12, L2-22, L2-28, L2-33, L2-37, L2-38, L2-40, L2-47, L3-01, L3-40…), avec leur effet si faux.
- **L4-14** · §11 · R7 · Vérifier qu'aucun non-objectif ne contredit FR-240, FR-242, FR-229, FR-63a, FR-70a, FR-57a ni le portail cabinet.
- **L4-15** · §12.1 P-1 à P-13, §0 (statut) · RUB basse · Mettre à jour « Reste à faire » et le `status` du front matter après application ; dire ce qui reste réellement (immersion, juriste, volumes).
- **L4-16** · Marquage des tensions · RUB M · Poser des balises `[NOTE FOR PM: voir A-x]` aux endroits de tension (§10.1 → A-16 ; FR-70 → A-12 ; FR-214 → A-10), renvoyées aux lots 2 et 3 pour le corps.

---

# Non retenus

| # | Constat | Source | Raison |
|---|---|---|---|
| N-01 | Date limite au-delà de laquelle la fonction part en « bientôt » ; go/no-go par module qui retire des fonctions | ADV F-21 (partie) | Réduit le périmètre : R7 et R15 sans avis du PO. Retenus : définition du jour 1 minimal comme critère, feu vert par module sans retrait, date limite des entrées avec risque tracé (L1-24, L3-37, L3-38). |
| N-02 | Retirer le portail du cabinet de la liste « premier jour » tant que ce n'est pas tranché | ADV F-20 (partie) | Réduction de périmètre (R7/R15). Retenu : défaut d'hébergement par le relais, question au PO, repli `TRANSMISE` (L1-19). |
| N-03 | Colonne « Priorité » avec « jour 1 si capacité » dans l'annexe A | RUB H1 (partie) | Valeur de périmètre ; R7 impose un ordre de construction **sans valeur de périmètre** (L3-32, L4-05). |
| N-04 | Reformuler A-16 en décision à trois options « d'ici le… » | RUB H1 (partie) | R7 : A-16 reste une question au PO ; on n'invente ni option ni date. |
| N-05 | Harmoniser FR-214 sur « Excel, JSON ou CSV » | PO (CSV de la v2 et de A-3) | Le récit du PO (Excel/JSON) fait foi ; on aligne A-3 sur lui (L4-07). |
| N-06 | Aligner `plan-redaction.md` D15 sur l'ordre corrigé du décompte | PO (notes secondaires) | Hors périmètre : on ne modifie aucun autre fichier ; le PRD est déjà juste (D15 corrigé en L4-08). |
| N-07 | Exiger le parcours d'urgence corporelle réel avec données hospitalières | DEMO (omission, B) | Aucune interface hospitalière connue ; retenu : parcours saisi par l'agent, `[ASSUMPTION]` (L2-34). |
| N-08 | Adoucir le ton de l'art. 242 (visé à la victime, appliqué au tiers) | SPEC partie E | Sans conséquence sur une exigence ; l'art. 4.5 est en revanche retenu (L1-14). |
| N-09 | Reprendre les règles du vol d'une autre compagnie (plainte, certificat de non-retrouvaille à 30 j, franchise de 36 000, paiement à 30 j) | SPEC M38 | Conditions générales d'une autre compagnie : pas de règle ; seul le paramètre « délai de recherche avant règlement d'un vol » (défaut vide) est repris. À ajouter en L3-40 si le PO le demande. |
| N-10 | Séance fixe du comité (mardis et jeudis) | SPEC M24 | Pratique non établie pour la compagnie ; le délai de tenue paramétré (L2-08) suffit ; un jour fixe peut être ajouté en paramètre à la séance d'immersion. |

Fusionnés sans être comptés à part : ADV F-40 (= F-38), RUB « séquencement non justifié » (= RUB H1), RUB « identifiants nus » (L1-40), SPEC F2 (déjà couvert).
