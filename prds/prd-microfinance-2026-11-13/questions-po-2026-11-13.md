# Questions au PO — PRD Microfinance (2026-11-13)

68 questions tirées des extraits `extract-*.md` (dédoublonnées), avec la recommandation de rédaction. ⚡ = structure le PRD. Réponse par numéro : « OK » = recommandation acceptée ; non cité = OK. Réponses consignées dans `.memlog.md`.

## Réponses du PO (2026-11-13) — elles font foi

**Toutes les recommandations ci-dessous sont acceptées, sauf ces corrections :**

| # | Décision du PO |
|---|---|
| T5 | Produits financiers = **module à part** (`produits-financiers`). |
| T6 | Code d'agence = celui du cœur **s'il en a un** ; sinon Prospera a **ses propres codes d'agence**. |
| A1 | Renvoyer au cœur les remboursements saisis dans Prospera **si possible, pas une obligation**. *Lecture : si le cœur ne sait pas recevoir, Prospera produit la liste des paiements à saisir dans le cœur et attend son mouvement pour confirmer. [ASSUMPTION]* |
| A11 | `prospera-microfinance-service` est le paquet SFD (comptabilité) : il **ne tient pas** les crédits de cette IMF, il n'est pas installé chez elle au jour 1. |
| B3 | L'IMF a une **licence à vie** : **aucune coupure ni gel** pour impayé. *Lecture (salle, séance 4) : usage perpétuel ; mises à jour liées au contrat de maintenance. [ASSUMPTION]* |
| B4 | Démo plus petite : **3 agences, 10 agents, 1 000 prêts actifs**. Dans la démo on peut **créer une agence, un agent, et un vrai dossier de prêt** et le mener **jusqu'à l'état actif** (EN_GESTION). |
| E3 | LBC/FT **important**, surtout la **mise à jour régulière** (listes de sanctions, revue périodique du KYC). |
| E5 | Seuils d'alerte **établis en fonction des nouvelles données** (celles de l'IMF), pas figés sur la démo. *Lecture : seuils initiaux calculés sur les données de l'IMF après reprise, proposés puis validés par un humain, recalculés périodiquement. [ASSUMPTION]* |
| F2 | Le **secteur d'activité est très important** : dimension de pilotage **et** donnée qui remonte à l'IA commune, en plus de la descente géographique. |
| F3, F6, C11, C12, D8 | **Toute IA = l'IA commune**, une famille de modules à part (`_bmad-output/planning-artifacts/vision-ia-sectorielle-2026-11-10.md` : Risque, Agents métier, Relation client, Pulse) qui gère seule l'intelligence. Le PRD microfinance ne crée **aucune IA propre** : il fournit les données, affiche les propositions, et marche sans elle (emplacement vide). *Lecture : le score et la recommandation viennent du module Risque de l'IA commune ; tant que son modèle n'existe pas, il sert un score par règles explicables (v0) ; données vers l'IA commune seulement avec consentement (PRD moteur, apprentissage fédéré). [ASSUMPTION]* |

## A. L'argent et leur logiciel (le « cœur »)

| # | Question | Recommandation |
|---|---|---|
| A1 ⚡ | Un remboursement saisi dans Prospera (terrain, guichet, Mobile Money validé) est-il renvoyé à leur logiciel ? | Oui : Prospera l'envoie comme « paiement à comptabiliser » ; reste dû, échéancier officiel et encours sont lus du cœur ; « en attente du cœur » jusqu'à confirmation. |
| A2 ⚡ | Qui génère l'échéancier officiel ? | Le comité génère l'échéancier contractuel, envoyé avec le dossier accordé ; après décaissement, celui du cœur fait foi ; écart = alerte. |
| A3 ⚡ | Qui décaisse ? | Le cœur pour espèces et virement (sur ordre de Prospera) ; Mobile Money et PI-SPI par `paiement`, puis déclarés au cœur. (Autre voie : le cœur fait tout.) |
| A4 | Qui calcule pénalités et intérêts de retard ? | Le cœur ; Prospera les lit. Le cœur fictif les calcule pour la démo. |
| A5 | Ordre d'imputation d'un paiement ? | Pénalités → intérêts → capital, paramétrable ; anticipé réduit la durée ; trop-perçu = crédit du client. |
| A6 | « Écart < 1 % » ? | \|payé − échéance\| ÷ échéance < 1 % ⇒ rattachement auto ; sinon file de rapprochement du comptable ; jamais refusé. |
| A7 | Validation du comptable aussi pour PI-SPI et banques ? | Non pour PI-SPI (irrévocable, confirmé) ; oui pour Mobile Money déclaré et virement sans référence. |
| A8 ⚡ | Épargne et caisse : lues du cœur ou modules complets ? | Épargne lue du cœur, collecte terrain renvoyée ; caisse guichet = cœur ; Prospera tient la caisse des collecteurs (ramassage, remise, clôture du jour avec écart). Dans la démo, le cœur fictif tient tout. |
| A9 ⚡ | Cœur fictif + contrat d'échange en février malgré AD-32 ? | Oui : contrat d'échange neutre écrit dans ce PRD, cœur fictif livré avec la démo ; vrai connecteur hors février. |
| A10 | Temps réel ou lot ? | Les deux : API si possible, sinon fichiers tirés plusieurs fois par jour ; Prospera tire toujours, jamais de port entrant. |
| A11 ⚡ | `prospera-microfinance-service` (tient encours, remboursements, dépôts, provisions) ? | Non installé chez cette IMF au jour 1 ; ses règles (classement, provisions, PAR) réutilisées par `risque-par` sur le portefeuille. (Autre voie : calculateur alimenté par le cœur.) |

## B. L'installation chez l'IMF

| # | Question | Recommandation |
|---|---|---|
| B1 ⚡ | Aucun port entrant : comment recevoir PI-SPI / FedaPay / WhatsApp, où vit le lien de paiement ? | Relais Money Vibes : le serveur de l'IMF tire les événements ; le relais sert le lien de paiement (« l'agent tire »). |
| B2 | Accès des agences ? | Navigateur sur le réseau de l'IMF (VPN/MPLS, à sa charge) ; guichet en ligne ; hors ligne = application terrain seule. |
| B3 | Licence et suspension pour impayé ? | Abonnement, licence vérifiée hors ligne, gel en lecture seule à J+30, jamais coupé. |
| B4 | Taille de la démo ? | IMF fictive : 12 agences, 3 régions, 80 agents, 6 000 prêts actifs ; performance testée à ×10. |
| B5 | Février chargé, Dev B saturé (17-20 sem. pour 10) ? | Le PRD décrit tout et marque ★ la démo de février (crédit de bout en bout, recouvrement, pilotage, cœur fictif) ; la charge se tranche au plan. |

## C. Le processus crédit

| # | Question | Recommandation |
|---|---|---|
| C1 | Les 12 statuts exactement ? | Oui + ANNULE (client renonce) ; pas de REFUSE_CHARGE. |
| C2 | Avis CC défavorable ? | REFUSE avec motif, agent prévenu ; un seul réexamen possible à la demande du RA. |
| C3 | Avis CC : 2 ou 4 valeurs ? | 2 (favorable / défavorable), avec conditions proposées (montant réduit, garanties). |
| C4 | DG à la place du ROC ? | Non ; DG au comité ; délégation explicite et tracée en cas d'absence seulement. |
| C5 | Analyste risque ? | Avis consultatif non bloquant entre CC et ROC au-dessus d'un seuil. |
| C6 | Comité : membres, seuil ? | Tous les dossiers ; quorum ROC + (DG ou RA) ; niveaux par montant paramétrables (ex. DG obligatoire > 5 M). |
| C7 | Cautions et garanties : valeurs démo par défaut ? | 2 cautions au-dessus de 300 000 ; dépôt 10 % (15 % > 1 M) ; garantie réelle 30 % (50 % > 1 M) ; paramétrable par produit. |
| C8 | Méthode d'échéancier ? | Annuité constante mensuelle par défaut ; capital constant, in fine, autres périodicités en option ; frais au décaissement ; assurance dans la mensualité si le produit en a. |
| C9 | Produit d'exemple (2,5 %/mois, TEG 36,4 %) au-dessus de l'usure ? | Réglementaire : TEG actuariel, frais et assurance inclus, octroi bloqué > 24 %. Jeu de démo conforme (ex. 1,5 %/mois + 1 % de frais ≈ 20 %). |
| C10 | Éligibilité 45 / 3 mois ; client inéligible ? | Défauts retenus ; inéligible bloqué, dérogation du ROC motivée et tracée. |
| C11 | Barème de score (3 contradictoires) ? | Un score /100 : paiement 40, capacité 30, activité 20, terrain 10 ; explicable, versionné ; les 5C restent l'analyse du CC. |
| C12 | L'IA décide-t-elle ? | Non, elle propose (spine microfinance) ; règles explicables, provenance affichée ; écart justifié par le CC. |
| C13 | Visites sous 500 000 ? | 1 visite (activité) ; au-dessus 2 ; photo + GPS obligatoires, rayon de tolérance. |
| C14 | Crédit de groupe ? | 5-30 membres, caution solidaire ; dossier de groupe + sous-dossiers par membre ; une décision ; un échéancier par membre. |
| C15 | Renouvellement ? | Dès la clôture si aucun retard > 30 j au cycle précédent ; max 1,5 × le précédent, paramétrable. |
| C16 | Canaux de notification ? | Cloche + e-mail (personnel) ; SMS + WhatsApp (client) ; français d'abord. |
| C17 | Prêts aux dirigeants et au personnel ? | Case « partie liée » ⇒ approbation du conseil, plafond réglementaire 10 %. |
| C18 | BIC ? | Consultation saisie à la main (résultat + pièce) et export de déclaration au jour 1 ; branchement direct « bientôt ». |

## D. Recouvrement

| # | Question | Recommandation |
|---|---|---|
| D1 | Bloquer aussi le client ou l'agence ? | Dossier BLOQUE ⇒ toute nouvelle demande du client et de ses cautions suspendue ; pas de blocage d'agence. |
| D2 | J+90 automatique ? | Proposé au ROC, qui décide ; le judiciaire exige le DG. |
| D3 | Perte définitive ? | Proposée à 24 mois d'impayé ; décidée par le DG sur proposition du ROC (conseil au-dessus d'un seuil) ; envoyée au cœur ; client inéligible. |
| D4 | Plan d'étalement ? | +12 mois max, un plan par prêt (2ᵉ = comité) ; prêt « rééchelonné », en souffrance jusqu'à 3 échéances honorées ; nouvel échéancier envoyé au cœur. |
| D5 | PAR ? | PAR1/30/90 cumulatifs sur l'encours entier en retard (pas en nombre de dossiers) ; PAR30 alerte 5 %, critique 10 %. |
| D6 | Classes et provisions ? | Barème réglementaire SFD par défaut : déclassement dès un impayé, 40/80/100 % à 6/12/24 mois, perte à 24 mois ; Prospera propose, le cœur comptabilise ; juriste. |
| D7 | Mauvais payeur ? | Fiche par client, ouverte au 1er retard > 30 j ou après 2 promesses non tenues ; fermée après 6 mois sans retard. |
| D8 | Score de recouvrement ? | Règle explicable (comme le PRD distributeur), pas de modèle ; poids affichés. |
| D9 | Agent de recouvrement ? | Rôle REC ; affecté par zone par le ROC ; réaffectable par le RA dans son agence. |
| D10 | Clôture ? | Solde nul confirmé par le cœur ; le cœur restitue le dépôt et libère les cautions ; après perte, pas de nouveau cycle sans dérogation du DG. |
| D11 | Calendrier par défaut ? | Cahier : J-3, J+1-3, J+7, J+90 ; 3 échecs ⇒ mission terrain ; envois 6 h et 14 h ; J-3 et J+1 automatiques, au-delà validés par le GP. |

## E. Risque et conformité BCEAO

| # | Question | Recommandation |
|---|---|---|
| E1 | Balance au plan SFD fournie par le cœur pour les ratios ? | Import de sa balance prévu ; ratios calculés si présente, sinon « en attente des données du cœur » ; le cœur fictif la fournit. |
| E2 | Catégorie de supervision (« article 44 ») et liquidité ? | Paramètre de l'installation ; démo = grande IMF, reporting mensuel. |
| E3 | LBC/FT dans ce PRD ? | Oui pour le KYC à l'octroi (simplifié/standard/renforcé, PPE, sanctions, seuils CENTIF) ; déclaration CENTIF = export hors Prospera. |
| E4 | Signature et dépôt du rapport BCEAO ? | Généré dans Prospera, validé par le DG ; signé et déposé par l'IMF hors Prospera. |
| E5 | Seuils d'alerte de la démo comme départ ? | Oui. |
| E6 | Origine de l'agence d'un prêt ? | Module `reseau`, rempli depuis le cœur à la reprise. |
| E7 | Piste d'audit 10 ans, rapprochement trimestriel Prospera/cœur ? | Oui (exigences réglementaires). |

## F. Pilotage, rôles, équipes, marketing

| # | Question | Recommandation |
|---|---|---|
| F1 ⚡ | Liste des rôles (récit ~10, démo 16) ? | 16 : DG, DAF, ROC, RA, CC, GP, agent terrain, collecteur, commercial, resp. commercial et collecte, analyste risque, agent de recouvrement, auditeur, comptable-caissier, communication, administrateur informatique de l'IMF (ne lit pas le métier). Pas de PAIE. DC/DEC = vues du DG. |
| F2 | « Secteur » dans la descente du DG ? | Géographique : réseau → région → agence → agent → client ; secteur d'activité = filtre. |
| F3 ⚡ | Copilot au jour 1 ? | Réel, lecture seule, source de chaque chiffre citée, via `assistant-service` ; n'agit pas. |
| F4 | Chatbot WhatsApp au jour 1 ? | « Bientôt » ; jour 1 = relances sortantes + réponses dans la boîte du GP. |
| F5 | Barème d'équipe (85/70 ou 90/75/60) ? | Un seul, celui du module partagé (90/75/60) ; poids des KPI par rôle paramétrables. |
| F6 | Le mot « IA » ? | Réservé à un modèle ; provenance affichée (règle ou modèle, version, date). |
| F7 | Qui crée les comptes ? | L'administrateur de l'IMF ; le DG valide les rôles sensibles (DAF, auditeur, ROC) ; deux personnes à chaque fois. |
| F8 | Commissions (PAIE) ? | Hors périmètre au jour 1 ; chaque agent voit sa seule prime d'objectifs. |
| F9 | Double authentification, session ? | Obligatoire pour DG, DAF, ROC, comptable, auditeur, administrateur ; session 8 h, déconnexion à 30 min d'inactivité ; l'auditeur lit le journal des accès. |
| F10 | Périmètre du marketing ? | Campagnes, prospects, acquisition, ROI sur marge d'intérêt nette attendue ; NPS « bientôt » ; prospects au réseau commercial. |
| F11 | Contrôle de gestion (M25) ? | Non ; tableau Budget et Rentabilité du DAF dans le tableau de bord. |
| F12 | Alertes : destinataire, délai ? | Valeurs de la démo ; rôle du périmètre ; 48 h, puis remontée au supérieur. |

## T. Terrain, clients, groupes (extrait encore en cours)

| # | Question | Recommandation |
|---|---|---|
| T1 | Tontines ? | Groupes solidaires au jour 1 ; tontines « bientôt ». |
| T2 | Hors ligne ? | Visites (photo, GPS), fiche client, collecte, demande en brouillon ; jamais de décision hors ligne. |
| T3 | Qui valide le KYC ? | Le CC ou un agent conformité de l'agence ; jamais le créateur de la fiche. |
| T4 | Épargnant et emprunteur à la fois ? | Oui : une personne, son identifiant du cœur, les deux rôles sur la même fiche. |
| T5 ⚡ | Produits financiers (taux, durée, éligibilité, versions, conditions figées par dossier) : extension du `catalogue` (fait pour des articles) ou module distinct ? | Module distinct `produits-financiers`, propre aux verticales finance (IMF, assurance plus tard) ; le `catalogue` reste celui des articles. |
| T6 | Réseau : agences, secteurs, micro-zones, code d'agence commun avec le cœur ? | Le module `reseau` (une agence est un lieu, une zone est un périmètre) ; le code d'agence vient du cœur ; zones en polygones, comme le cahier. |
| T7 | Rayon de présence d'une visite : 200 m (module partagé) ou 100 m avec rejet (cahier) ? | 100 m par défaut pour une visite d'instruction, paramétrable ; hors rayon, la visite est marquée « hors zone » et refusée comme preuve, mais pas effacée. |
