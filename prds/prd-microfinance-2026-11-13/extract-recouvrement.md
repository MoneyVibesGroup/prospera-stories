# Extrait — Suivi du prêt, relances et recouvrement (PRD Prospera Microfinance)

*Synthèse de lecture, 2026-11-13. Le récit du PO fait foi ; la démo définit le produit mais n'enregistre rien ; le backend de la démo ne compte pas (capacités seulement). Client = « l'IMF ». Le logiciel cœur de l'IMF fait foi pour l'argent.*

**Chemins.** `W` = `prospera-font-end/prospera-web/src`. `D` = `prospera-font-end/docs`. `S` = `prospera-backend/backend-dashboard-specs`. `R` = `brain-dump-po-2026-11-13.md`. `PRD-D` = `prds/prd-distributeur-2026-11-12/prd.md`. `CT` = `D/CAHIER_DES_CHARGES_BUNDLE_TERRAIN_COLLECTE.md` (M05 Relances §6 et M06 Caisse §7 : vraie source du tableau du récit, hors liste initiale mais indispensable). `CR` = `D/CAHIER_DES_CHARGES_BUNDLE_RISQUE_CONFORMITE.md` (M07 Recouvrement §5). `CC` = `D/CAHIER_DES_CHARGES_BUNDLE_CREDIT.md`.

**Constat d'ensemble.**
1. Dans la démo, le recouvrement est une **lecture** : tableaux, fiches, scores constants. Aucun écran n'agit sur un statut : pas de bloquer/débloquer, plan d'étalement, mise en demeure, saisie, contentieux, perte, affectation, clôture. Tout cela est **à construire d'après le récit et `CR` §5**.
2. Les statuts de recouvrement du récit n'existent pas dans le code de la démo ; ils viennent de `CR:243-254` (non implémentés non plus).
3. Le calendrier J-3 / J+1-3 / J+7 / J+90 vient de `CT:360-367`, pas de la démo.
4. Le « dossier bloqué » de la démo est une **demande de crédit bloquée en instruction** (`EN_ANALYSE_ROC`, SLA 48 h), pas un blocage de recouvrement par le ROC. Homonymie dangereuse.

---

## 1. Inventaire des écrans

Légende : réel = agit dans l'état local ; navigation ; décoratif = aucun gestionnaire ; mock = chiffre constant. Aucune action n'enregistre rien.

| # | Chemin (sous `W/app/(dashboard)`) | Rôle | Contenu | Actions |
|---|---|---|---|---|
| 1 | `credit/recouvrement/page.tsx` | ROC | Synthèse IA (texte constant), 6 KPI (taux jour, collecté/objectif, non visités, promesses nombre+montant, honorées 7 j, impayés top 6), 3 cartes méthode actuelle/rendu/méthode suggérée IA, mauvais payeurs, agents en souci, recouvrement par agence, équipes par agence, plan stratégique de la semaine (5 priorités) (`page.tsx:44-237`) | Clic agent : navigation (`:158`). « Voir équipe agence » : défilement (`:178`). Aucun bouton métier. Données mock (`W/lib/roc-recouvrement-hub.ts`) |
| 2 | `credit/recouvrement-with-api/page.tsx` | ROC | Même écran branché (`RecouvrementReseauViewWithApi.tsx`) | Interface seulement ; mêmes capacités |
| 3 | `credit/recouvrement/agents/[id]/page.tsx` | ROC | Agent : statut `BON`/`NORMAL`/`DEGRADE`, visites jour, collecte jour, retards J+7, clients actifs, points forts/faibles, collecte vs objectif 3 jours, clients à risque avec score et probabilité 30 j (`:64-125`) | Navigation vers client. Pas de (ré)affectation |
| 4 | `credit/recouvrement/clients/[id]/page.tsx` | ROC | Client en retard : classe BCEAO, `J+n`, montant dû, score IA + probabilité 30 j + facteurs, analyse IA, crédits actifs, échanges de remboursement (visite, appel, WhatsApp, MoMo, guichet, SMS ; paiement, partiel, promesse, refus, injoignable, restructuration), « Actions ROC » (`:34-104`) | Lecture seule ; les actions sont des phrases |
| 5 | `credit/recouvrement/mauvais-payeurs/page.tsx` | ROC | Redirige vers `/credit/recouvrement#mauvais-payeurs` | Navigation |
| 6 | `credit/recouvrement/mauvais-payeurs/[id]/page.tsx` | ROC, RA | Fiche mauvais payeur = fiche client à 6 onglets (Synthèse, Identité & KYC, Activité, Crédits & échéancier, Recouvrement, Risque BCEAO ; `W/components/credit/FicheClientMicrofinance.tsx:19-25`) + rang réseau | Lecture seule ; bâtie par `W/lib/mauvais-payeur-fiche.ts` (score IA = 100 − score recouvrement, PD = 100 − probabilité, `:33-35`) |
| 7 | `credit/mauvais-payeurs/page.tsx` | RA | Bloc mauvais payeurs verrouillé sur l'agence du RA (`:20-26`) | Navigation |
| 8 | `credit/recouvrement/dossiers-bloques/page.tsx` | ROC | « Dossiers bloqués > 48 h » (référence, étape, client, montant, raison, heures) | Navigation. **Demandes de crédit**, pas du recouvrement |
| 9 | `credit/recouvrement/dossiers/[ref]/page.tsx` | ROC | Dossier de demande bloqué : analyse IA, historique d'étapes, pièces manquantes, actions ROC recommandées, lien vers l'analyse CC (`:99-125`) | Seul le lien agit. Aucun « débloquer » |
| 10 | `credit/recouvrement/equipe/page.tsx` | ROC | Redirige vers l'écran 1 | Navigation |
| 11 | `relances/page.tsx` + `W/components/relances/RelancesView.tsx` | GP, ROC, RA | Onglets Relances (perf par canal, évolution 7 j, campagnes, filtre de canal, liste avec message IA), Workflows, Promesses, Preuves (masqué au GP, `:55,65`) ; 6 KPI | Onglets et filtre : réels. **« Envoyer » (`:254-257`) décoratif** ; cartes de campagne/promesse/preuve décoratives |
| 12 | `relances-with-api/page.tsx` | GP, ROC | Même écran branché | Interface seulement |
| 13 | `portefeuille/page.tsx` + `W/components/gp/PortfolioEmprunteursView.tsx` etc. | GP | Portefeuille : onglets tous/mauvais (tri retard décroissant, `:41`), grille/tableau, segments performants/à surveiller/critiques, `J+n` ou « À jour » | Filtres, navigation |
| 14 | `W/components/gp/GpRecouvrementPanel.tsx` (dossier `EN_GESTION`, GP) | GP | Échéancier, résumé retard, formulaire « Encaisser une échéance » (échéance + montant), « Relance email », « Nouvelle promesse » (montant, date), promesses actives, historique | Hors backend : affiche un message (« Paiement enregistré »…) **sans rien changer** (`:82-118`) ; échéancier figé sur 2 lignes (`:53-69`). Actions offertes selon statut `EN_GESTION` et rôle GP (`W/lib/credit-mock-workflow.ts:80-83`) |
| 15 | Caisse : `W/components/caisse/CaisseGuichetPanel.tsx`, `MomoValidationPanel.tsx` | Comptable | Guichet dépôt/retrait + file MoMo `EN_ATTENTE` ; validation MoMo = tableau seul en mock | Guichet : « Service temporairement indisponible » hors API (`:36`) ; **pas de type remboursement** (`:26`) |

À décrire par capacité : vue réseau ROC avec descente, fiche agent, fiche mauvais payeur, relances/workflows, promesses, panneau de recouvrement du GP, file de validation MoMo. Bloquer, étalement, mise en demeure, saisie, contentieux, perte, affectation, clôture : **à créer**, « bientôt » tant que non livrés.

---

## 2. Remboursements

**Récit.** Canaux : espèces, guichet, collecte terrain, Mobile Money. MoMo reste « en attente » jusqu'à validation du comptable, puis rattaché automatiquement à l'échéance, écart < 1 % (`R:98`). Le cœur fait foi : Prospera doit recevoir les remboursements (`R:146-147`). MoMo par pays, opérateur, et banques via PI-SPI (`R:155-156`).

**Canaux et statuts (`CT:493-507`).**
| Canal | Qui | Statut final |
|---|---|---|
| `TONTINE` (collecte terrain) | agent, collectrice | `VALIDE` immédiat, solde crédité, écriture auto |
| `AGENCE` (guichet espèces) | comptable | `VALIDE` immédiat, registre de caisse |
| `MOBILE` (Flooz, Mixx) | agent ou client | `EN_ATTENTE` puis `VALIDE` ou `REJETE` (motif obligatoire, agent notifié) |
- `EN_ATTENTE` ne modifie pas le solde client. Le comptable vérifie sur la console de l'opérateur (montant, numéro, référence) (`CT:503-504`). MoMo toujours validé par le comptable ; l'IA détecte les doublons (même client, même montant ± 100 FCFA, 5 min) mais ne valide jamais seule (`CT:533-537`).
- Opérateurs de la démo : Flooz, Mixx By Yas (`W/components/caisse/CaisseTables.tsx:22-29`) ; `FLOOZ_MIXX` obligatoire en v1 Togo (`CT:501`) ; le PO veut « par pays et par opérateur » : liste paramétrable.

**Rapprochement.** Transaction validée avec `dossier_id`, montant égal à l'échéance à **moins de 1 %** → lien automatique, échéance `PAYEE` (`CT:507,563`). Contradiction : `CT:533` dit « montant exact ». Critère : 95 % des transactions avec `dossier_id` rapprochées (`CT:930`). Échéance payée → relances ouvertes `CLOTUREE` (`CT:466`). Non dit : 1 % de quoi, sens de l'écart, sort d'un écart ≥ 1 %. Démo : le « rapprochement MoMo » est du lettrage comptable (`NON_LETTRE`/`EN_COURS`/`LETTRE`, `W/lib/caisse-hub.ts:75-85`), pas un lien paiement → échéance ; seul lien : bouton manuel du GP.

**Partiel, anticipé, en trop, imputation.**
| Cas | Récit | Démo | Cahier |
|---|---|---|---|
| Partiel | rien | échéance `PARTIEL` (`W/lib/fiche-client-microfinance.ts:529`) ; échange « 25 k sur 52 k dus » (`W/lib/roc-recouvrement-vue360.ts`) | simple résultat d'action (`CR:211`) |
| Anticipé / en trop | rien | rien | rien |
| Ordre d'imputation | rien | aucun : le GP choisit UNE échéance et un montant (`GpRecouvrementPanel.tsx:105-114`) ; capital et intérêt séparés par échéance (`fiche-client-microfinance.ts:523-534`), pénalités en total à part (`:543`) | rien |
Le PRD Distributeur propose « pénalité, intérêt, principal » (`PRD-D:1955`), excédent = crédit du tiers (FR-172), partiel = `PARTIELLE` et relance suspendue (FR-116). Rien ne le confirme pour l'IMF.

---

## 3. Retards, PAR, pénalités, classes

**Jours de retard.** Aucune formule dans les sources ; le cahier entre en recouvrement à « échéance impayée > J+7 » (`CR:197,203`), la démo affiche `J+n`. Règle de PRD à valider : jours entre la date de lecture et l'échéance impayée la plus ancienne (le noyau Distributeur calcule `jours_retard` à la date de lecture, `PRD-D:2253`). Non dit : jour de grâce, calendaires ou ouvrés.

**PAR : définitions concurrentes.**
| Source | Indicateurs et formule | Réf. |
|---|---|---|
| Cahier risque | PAR 30 j et 90 j = % du portefeuille en retard > 30 / > 90 j ; alerte PAR30 > 10 %, critique > 15 % ; PAR90 > 5 % / > 10 % ; PAR = 30 % du score de conformité | `CR:375-376,388` |
| Cahier, glossaire | % de l'encours avec au moins une échéance impayée > N jours (encours entier) | `CR:683` |
| Cahier agents | PAR GP = encours en retard / encours total × 100 ; plafond fixé par le RA (ex. < 8 %) | `D/CAHIER_DES_CHARGES_BUNDLE_CROISSANCE_OPERATIONS.md` §6.2.2-3 |
| Cahier, alertes | PAR agence +2 points = alerte ; > 30 % du PAR d'une agence sur 1 agent ou 1 zone = alerte de concentration | `CC:237`, `CR:274` |
| Démo | PAR 30/60/90 par agence en constantes (Bè Kpota 11,2/4,9/2,1, `W/lib/agences.ts:413`) ; agence non conforme si PAR ≥ 10 % (`W/lib/roc-synthese-ia.ts:65`) ; « suspendre décaissements tant que PAR > 10 % » (`roc-recouvrement-hub.ts:214`) | — |
| Démo, conformité | PAR calculé en **comptant des dossiers** : PAR30 = retard ≥ 1 j, PAR90 = retard ≥ 31 j (`W/lib/conformite-registry.ts:315-316`) : erreur, à ne pas reprendre | — |
| Secondaires | PAR 1/7/30 (`S/04-dashboard-gestionnaire-portefeuille.md:103-105`) ; PAR 30/60/90 (`S/11-dashboard-risque.md:50-53`) | mock |
| PRD Distributeur | PAR 1, 30, 90 sur l'encours entier du prêt (`PRD-D:1956`) **et** « PAR 1-30, 31-60, 61-90, +90 » en tranches (`:2278`) : incohérence interne | — |
Proposition : PAR cumulatif (retard ≥ N jours, N = 1, 30, 90 paramétrables) sur l'encours restant dû du prêt entier ; la balance âgée en tranches est un autre objet.

**Pénalités.** Aucune règle (taux, base, plafond). Démo : convention `pénalités = 15 % de la mensualité` et `intérêts courus = 6 % de l'encours` si retard (`W/lib/fiche-client-microfinance.ts:1490-1491`) ; exemple écrit à la main : 19 500 FCFA, prêt 18 %/an, 12 mois, mensualité 94 444 (`:1148-1154`). Le noyau Distributeur ne calcule ni intérêt ni pénalité de retard : la Source `ECHEANCE_DE_PRET` les fournit (`PRD-D:2258`). Usure : 24 %/an paramétrable (`R:149-150`).

**Classes de créances (provisions).**
| Source | Classes | Provision |
|---|---|---|
| Cahier `CR:446-452` | 0 sain ; 1 (1-30 j) ; 2 (31-90) ; 3 (91-180) ; 4 compromise (> 180 j ou contentieux) | 1 / 10 / 25 / 50 / 100 % |
| Démo `W/lib/conformite-hub.ts:172-176`, `conformite-registry.ts:14-20` | `NORMAL` (0-30), `SOUS_SURVEILLANCE` (31-90), `DOUTEUX` (91-180), `COMPROMISES` (181-360), `CONTENTIEUX` (360+ ou contentieux) | 1 / 10 / 50 / 80 / 100 % |
Mise en `BLOQUE` → notification du DAF pour provision 100 % (`CR:331-333`). Bornes réglementaires UMOA non fournies (annexe D du cahier absente).

---

## 4. Relances

**Calendrier (`CT:360-367` ; récit `R:102-108`).**
| Phase | Délai | Action | Canal | Responsable |
|---|---|---|---|---|
| Préventif | J-3 | relance `PREVENTIVE` | WhatsApp + lien MoMo | GP |
| Rappel courtois | J+1 à J+3 | `RAPPEL` | WhatsApp ; SMS si pas de réponse sous 24 h | GP |
| Relance ferme | J+7 | `FERME` + mission terrain | visite prioritaire | agent + GP |
| Escalade ROC | J+7 et score de risque < 50 | alerte ROC + superviseur | in-app + e-mail | ROC |
| Promesse non honorée | date dépassée | `PROMESSE_NON_HONOREE` | multicanal | GP, puis ROC si J+3 |
| Contentieux | J+90, score recouvrement < 20, aucune action | escalade vers le recouvrement (« dossier bloqué ») | — | ROC |
Tous ces seuils sont des paramètres de l'IMF (`R:152-153`). Valeur de la démo : **aucune** (relances listées à J+5, 8, 45, 62, `W/lib/relances-hub.ts:103-106` ; campagnes « J+7 préventif réseau », libellé incohérent, et « Relance SMS J+30 », `:109-111`). Défauts = valeurs du cahier. Exécution : tâche à 06 h et 14 h sur l'échéancier (`CT:430-433,462`) ; l'IMF peut couper l'envoi auto : relance `CREEE`, validée par le GP avant envoi (`CT:464`).

**Canaux.** WhatsApp, SMS, appel, visite (`relances-hub.ts:3`), e-mail côté GP. Choix : WhatsApp si taux de réponse du client ≥ 60 %, sinon SMS, après 3 échecs numériques mission terrain (`CT:437,456`). Taux de la démo : WhatsApp 68, SMS 41, appel 74, visite 78 % (constantes). Priorité : `(1 − proba_paiement) × montant × log(jours_retard+1) × (1 + nb_promesses_non_honorées)` (`CT:455`). Lien MoMo avec montant et référence (`CT:460`).

**Contenus.** Modèle : « Bonjour {prenom}, votre échéance de {montant} FCFA du {date} est {statut}. Réglez maintenant : {lien_momo}. Merci. » (`CT:438,458`), modèles modifiables. Exemples de la démo : J+45 « Pouvons-nous convenir d'un plan cette semaine ? », J+5 « Rappel amical… Répondez OUI », J+62 « contact téléphonique urgent requis » (`relances-hub.ts:103-106`). Ton croissant avec le retard.

**Escalade, suspension, récidive.** Statuts de relance (cahier) : `CREEE` → `ENVOYEE` → `REPONDUE` / `IGNOREE` / `ESCALADEE` / `CLOTUREE` (`CT:405-409`) ; démo : `PLANIFIE`, `ENVOYE`, `REPONDU`, `ECHEC`, `PROMESSE` ; workflow démo : `NOUVEAU`, `RELANCE_1`, `RELANCE_2`, `ESCALADE`, `CONTENTIEUX`, `CLOTURE` (`relances-hub.ts:15,30`). Promesse faite → relances suspendues jusqu'à la date promise (`CT:389`, `R:110`) ; à J+1 de la date, non tenue → nouvelle relance, GP notifié, escalade si récidive (`CT:391`). Après 3 échecs de relance → recouvrement (`CR:340`). Preuves (capture WhatsApp, référence SMS, compte rendu, reçu MoMo ; vérifiées IA ou manuelles) : `relances-hub.ts:55-60`.

---

## 5. Recouvrement

**Statuts (récit `R:115` = `CR:243-254`).**
```
EN_RETARD (J+7) → EN_RECOUVREMENT (agent assigné)
   ├→ PLAN_ETALEMENT → REGULARISE
   ├→ REGULARISE (paiement intégral)
   └→ BLOQUE (décision du ROC) → CONTENTIEUX_JUDICIAIRE | PERTE_DEFINITIVE
```
| Transition | Qui | Règle | Réf. |
|---|---|---|---|
| → `EN_RETARD` | système | échéance impayée > J+7 | `CR:203` |
| → `EN_RECOUVREMENT` | ROC ou RA | un agent de recouvrement par zone | `CR:209` |
| → `PLAN_ETALEMENT` | ROC + client | nouveau calendrier cohérent avec le produit d'origine (critère bloquant) | `CR:222,657` |
| → `REGULARISE` | système | paiement intégral ou plan respecté | `CR:249-250` |
| → `BLOQUE` | **ROC seul**, manuel, **motif obligatoire** | jamais l'IA ; droit `RESPONSABLE_CREDIT` ; DAF notifié (provision 100 %) ; audit | `CR:212,276,331-333,624,655` |
| `BLOQUE` → réactivé | **ROC seul**, motif et traçabilité | — | `CR:213` |
| `BLOQUE` → `CONTENTIEUX_JUDICIAIRE` | ROC | transfert au juridique : motif, dossier complet, jugement cible | `CR:225` |
| → `PERTE_DEFINITIVE` | **non défini** | aucune règle | — |

Démo : aucun de ces statuts. Seuls indices de blocage de crédit : le texte « Suspendre nouveaux décaissements Bè Kpota tant que PAR > 10 % » (`W/lib/roc-recouvrement-hub.ts:214`) et « Bloquer nouveau crédit » (fiche Kossi Dovi, `W/lib/roc-recouvrement-vue360.ts`).

**Qui fait quoi.** Système/IA : liste des retards, score, plan par agence, alerte de concentration. ROC : vue réseau par PAR décroissant, descente, stratégie, affectation, étalement, mise en demeure, saisie, contentieux, blocage (`R:112`, `CR:205-213`). RA : assigne aussi. Agent de recouvrement (rôle `RELANCE`, `CR:96`) : exécute et enregistre. GP : promesses et résultats. Juriste : mise en demeure, saisie, contentieux. Comptable : valide le Mobile Money. DAF : provision. Auditeur : lit les dossiers bloqués. Démo : les « agents de recouvrement » sont les agents terrain (`roc-recouvrement-vue360.ts:95-110`).

**Vue réseau par PAR, descente, stratégie, affectation.**
- Cahier : agences triées par PAR décroissant, carte, alertes de concentration (`CR:283`) ; descente agence → agent → client → dossier (`CR:284`) ; filtres agence, zone, agent, statut, score (< 30 / 30-60 / > 60), ancienneté (`CR:291`). Démo : tri par impayés, pas de carte, pas de niveau « dossier ».
- Statut d'agence (démo) : `CRITIQUE` si taux < 60 %, `TENSION` < 70, `EXCELLENT` ≥ 80, sinon `OK` (`roc-recouvrement-hub.ts:145-149`). Agent en souci : `CRITIQUE` si dégradé, ou taux < 55 %, ou visites/objectif < 0,5 ; `VIGILANCE` si taux < 75 %, ou ≥ 8 retards J+7, ou visites/objectif < 0,85 (`:81-85`). Objectif de taux : 75 % (`:116`).
- Stratégie : plan IA par agence, modifiable, validé par le ROC (`CR:208`). Démo : 5 priorités de la semaine (mission Bè Kpota +400 k, coaching +8 pts, relance de 4 promesses avant 12 h +120 k, bonnes pratiques, suspension de décaissements) (`:209-215`), sans validation ni édition.
- Affectation par zone : un agent par zone, par zone ou par expertise, écart d'objectif, calendrier, benchmark inter-agences (`CR:209,257-263`). Démo : textes seulement (« réaffecter… à agent senior »). Les zones sont des polygones du module Équipes.

**Actions et résultats.**
| Action (cahier `CR:215-225`) | Acteur | Données | Démo |
|---|---|---|---|
| `APPEL_TELEPHONIQUE` | agent, GP | compte rendu ; résultat promesse/refus/absent/joint | échange `APPEL` |
| `VISITE_DOMICILE` | agent | photo facultative, GPS, compte rendu, montant promis | échange `VISITE` |
| `VISITE_ACTIVITE` | agent | évaluation de l'activité | idem |
| `PLAN_ETALEMENT` | ROC + client | calendrier, montants, durée en plus | résultat `RESTRUCTURATION` ; « 3 mensualités de 140 k » pour 420 k |
| `MISE_EN_DEMEURE` | ROC décide, juriste rédige | date, courrier recommandé, délai de réponse | ligne « Rédigée, signature DG » (`W/lib/fiche-client-microfinance.ts:1219`) |
| `SAISIE_GARANTIE` | ROC + juriste | type, évaluation, accord client | texte « saisie stock + appel des 2 cautionnaires » (`:1243`) |
| `TRANSFERT_CONTENTIEUX` | ROC | motif, dossier complet | classe `CONTENTIEUX` seulement |

Résultats de la démo : `PAIEMENT`, `PARTIEL`, `PROMESSE`, `REFUS`, `INJOIGNABLE`, `RESTRUCTURATION` (`roc-recouvrement-vue360.ts:14`). Toute action est tracée avec son résultat (100 %, critère bloquant `CR:657`) ; une promesse issue d'une action réarme la surveillance (`CR:329`).

**Plan d'étalement.** Connu : accord ROC + client, nouveau calendrier cohérent avec le produit. Absent : durée maximale, nombre par prêt, sort des pénalités, effet sur le compteur de retard et la classe, signature, qui écrit l'échéancier dans le cœur.

**Mise en demeure, saisie, contentieux, perte.** Mise en demeure : décision ROC, rédaction juriste, `date_mise_en_demeure` portée au blocage (`CR:331`). Garanties : cautions solidaires, **minimum 2** (`W/lib/fiche-client-microfinance.ts:107`) ; dépôt 10 % au-dessus de 300 000 FCFA, 15 % au-dessus de 1 M ; garantie réelle ≥ 30 % au-dessus de 500 000 (`:142-153`) ; états de caution `ACTIF`/`APPELE`/`INJOIGNABLE`/`REALISE`/`REFUSE`, de garantie `ACTIF`/`REALISE`/`INSUFFISANT`/`MANQUANT` (`:102,119`) ; exemple « caution restante 120 k ». Contentieux : décision humaine exclusive du ROC (`CR:181,276,600`). Perte définitive : un nom, aucune règle ni écriture.

**Blocage/déblocage.** ROC seul, motif obligatoire, audit (`CR:332,624,655`). Effet sur les nouveaux crédits du client : non dit.

**Paramètres à rendre configurables.** Taux cible 75 %, seuils d'agent (55, 75, 8, 0,5, 0,85), seuils d'agence (60, 70, 80), concentration 30 %, alerte PAR (+2 pts, 10 %, 5 %), couleurs de score (35/50), capacité par agent et par jour, horaires 06 h/14 h.

---

## 6. Fiche mauvais payeur et score de recouvrement

**Contenu (`CR:227-241`, `R:117`).** Identité (nom, téléphone, adresse, GPS, photo) ; dossier de crédit (numéro, produit, montant, décaissement, GP) ; situation (impayé, échéances impayées, ancienneté, dernière échéance payée) ; historique des paiements ; retards antérieurs ; promesses (honorées ou non) ; actions de recouvrement ; analyse IA ; score ; garanties (type, valeur, activé ou non) ; agents impliqués. Démo : fiche à 6 onglets, causes principales, historique des retards par mois (`MauvaisPayeurDetail`, `roc-recouvrement-vue360.ts:56-61`), actions recommandées ; pas d'historique de paiement détaillé ni de retards sur anciens prêts. **Définition d'un mauvais payeur absente** : la démo montre un « top 6 » (retards 64 à 95 j) ; l'API a un booléen `est_mauvais_payeur` sans règle (`W/types/gestion-portefeuille.ts:23`).

**Score.**
- Cahier : score 0-100 = f(ancienneté, montant dû, historique, fréquence des visites, garanties, promesses honorées vs non) ; calculé pour tout dossier > J+7 ; « annexe C : règles détaillées » citée mais absente (`CR:204,270,654,698`).
- Démo : score (28-35) et probabilité sous 30 j (18-31 %) saisis à la main ; 8 facteurs aux poids identiques pour tous (`roc-recouvrement-vue360.ts:121-130`) : historique 25, ancienneté du retard 20, réactivité aux relances 15, capacité financière 15 (ligne **doublée**, total 105 %), flux MoMo 10 (neutre), garanties 10 (positif), saisonnalité 5. Aucune formule ne relie facteurs et score. Verdict : probabilité ≥ 50 % probable, ≥ 30 % incertain, sinon « peu probable sans mesure coercitive » ; score rouge < 35, orange < 50 (`W/components/recouvrement/ScoreRecouvrementIA.tsx:20-22`). Récupérable estimé = dû × probabilité ÷ 100 (`MauvaisPayeursBlock.tsx:9-11`).
- À ne pas confondre : score client 40/30/20/10 (paiement, capacité, activité, terrain) et PD × LGD × encours (`CC:257-259`).
- PRD Distributeur : probabilité par règle (base 95/82/65/45/30 selon retard ; − 0,4 × % provision ; + 0,25 × (score tiers − 60) ; + 10 si paiement partiel ; bornée 5-98) ; groupes ≥ 80, 55-79, 35-54, < 35 ; < 40 proposé en contentieux (`PRD-D:2393`).
- Seuils d'usage : J+90 si score < 20 sans action ; escalade J+7 si score de risque < 50 (`CT:364,367`). Gouvernance : l'IA assiste, le ROC décide ; analyse affichée en < 5 s ; scores gardés 5 ans (`CR:181,642,655`).

---

## 7. Clôture et nouveau cycle

Récit : `CLOTURE` puis nouveau cycle (`R:119`). Démo : statut `CLOTURE` (`W/types/credit-api.ts:16`), échéancier visible en `EN_GESTION` et `CLOTURE` (`CC:824`) ; **aucune action de clôture** (le GP ne peut que payer une échéance, relancer par e-mail, saisir une promesse). Dépôt de garantie « libéré à clôture » (`fiche-client-microfinance.ts:1205`). Nouveau cycle : aucune fonction ; indices : renouvellement automatique pour score > 85 (7 clients, 3,5 M ; 14 dossiers, 4,9 M, `W/lib/agences.ts:303,647`), question Copilot « éligible au renouvellement ? » (`W/lib/ai/copilot-questions.ts:27`), éligibilité produit = score et ancienneté minimum (`R:65`). Le PRD Distributeur clôt un Dossier à reste dû nul ou par abandon décidé par le DAF (FR-113) et n'a pas de nouveau cycle. Non dit : condition de clôture, qui clôture dans le cœur, droit au cycle après étalement, `BLOQUE` ou perte.


## 8. Écarts avec le module partagé `recouvrement` (M19) et le registre de Créance de `paiement`

**8.1 Déjà dans le PRD Distributeur (renvoyer, ne pas répéter).** Créance à composantes (principal, intérêt, pénalité, frais) de source `ECHEANCE_DE_PRET` et ordre d'imputation paramétrable (`PRD-D:1955`, FR-111, FR-247) ; PAR sur l'encours entier, « non échu » masqué (`:1956`, FR-112) ; crédit du tiers = trop-perçu, épargne, dépôt, paiement jamais refusé (FR-172, FR-248) ; groupe solidaire (`:1959`) ; Dossier par Tiers à journal non modifiable (FR-113) ; échelle paramétrable J-3/J+1/J+7/J+15/J+30/blocage, repli SMS, AUTO ou À VALIDER (FR-114) ; relance réelle via `notification`, lien PI-SPI/FedaPay (FR-115, FR-207) ; partiel suspend, total arrête (FR-116) ; promesse, grâce 24 h, accord écrit après 2 ruptures (FR-118) ; blocage lu par le module d'engagement, « suspension de décaissement » (`:1960`, FR-119) ; file du jour (FR-120) ; visite via `terrain` (FR-121) ; probabilité et provision (FR-117) ; vocabulaire IMF « à valider » (`:2268-2284`).

**8.2 Ce que l'IMF exige en plus.**
1. Statuts nommés `EN_RETARD … PERTE_DEFINITIVE`, avec `PLAN_ETALEMENT`, `BLOQUE`, `PERTE_DEFINITIVE` absents de M19, et transitions **décidées** par le ROC (M19 : statuts dérivés du journal).
2. Blocage du dossier par le ROC seul avec motif.
3. Plan d'étalement qui régénère l'échéancier.
4. Mise en demeure, saisie de garantie, transfert au contentieux comme actions tracées avec leurs données (courrier recommandé, juriste, évaluation).
5. Garanties et cautions solidaires (appel, réalisation, dépôt) : rien dans M19.
6. Vue réseau par PAR, descente agence → dossier, stratégie validée par le ROC, agent de recouvrement par zone, concentration > 30 % (à confirmer dans `equipe` M21 et `dashboard` M28).
7. Fiche mauvais payeur multi-prêts et score 0-100 à facteurs (M19 : probabilité par règle calibrée sur le score du point de vente).
8. Calendrier de l'IMF : escalade ROC à J+7 si risque élevé, J+90, 3 échecs, récidive.
9. Validation humaine du comptable pour tout MoMo, rapprochement < 1 %.
10. Provision 100 % notifiée au DAF à `BLOQUE`, classe de créance et migration.
11. Clôture du prêt et nouveau cycle.
12. Le cœur fait foi : dire si le registre de `paiement` n'est qu'un miroir alimenté par un connecteur.

**8.3 Contradictions.**
| # | Point | M19 / `paiement` | IMF | Conséquence |
|---|---|---|---|---|
| C1 | Qui bloque / débloque | automatique à > 60 j ou plafond ; DAF seul débloque (`PRD-D:2418-2420`) | ROC seul, manuel, motif (`R:115`) | règles opposées : paramétrer par verticale |
| C2 | Sens du blocage | état du **tiers** refusant tout engagement | statut du **dossier** (`BLOQUE`) ; et, à part, suspension d'octroi d'une agence (démo) | deux objets distincts |
| C3 | Confirmation d'un paiement | PI-SPI/FedaPay constatés sans action humaine (FR-207) | MoMo `EN_ATTENTE` jusqu'au comptable | à arbitrer avec PI-SPI |
| C4 | Source du reste dû | `paiement` seul propriétaire (FR-247) | le cœur fait foi (`R:146-147`) | registre = miroir du cœur |
| C5 | Ouverture du dossier | premier palier (J+1) | `EN_RETARD` à J+7 (`CR:203`) | paramètre |
| C6 | Contentieux | proposé si probabilité < 40 | J+90, score < 20, décision manuelle ROC, puis judiciaire | choisir le critère |
| C7 | Statuts de promesse | `EN_ATTENTE`/`TENUE`/`PARTIELLEMENT_TENUE`/`ROMPUE` | démo `ACTIVE`/`TENUE`/`NON_TENUE`/`PARTIELLE`(+`ANNULEE`) ; cahier `PROMISE_*` | table de correspondance |
| C8 | PAR | cumulatif (`:1956`) et tranches (`:2278`) | cumulatif 30/90 | corriger M19 |
| C9 | Pénalités | hors module | aucune règle | bloquant |
| C10 | Rôles | `RECOUVREMENT`, commercial ; pas de GP | `RELANCE`, GP, ROC | aligner |
| C11 | Palier visite | J+15, À VALIDER | J+7 mission terrain | paramètre |
| C12 | Mise en demeure | palier J+30 « direction » | décision ROC, rédaction juriste, courrier recommandé | adapter le palier |

---

## 9. Écarts récit ↔ démo ↔ cahier ↔ secondaire
| # | Sujet | Récit (fait foi) | Démo | Cahier | Secondaire (mock) | Décision proposée |
|---|---|---|---|---|---|---|
| 1 | Calendrier | J-3, J+1-3, J+7, promesse, J+90 | aucun ; J+5/8/45/62 ; campagnes « J+7 préventif », « J+30 » | identique au récit (`CT:360-367`) | liste de relances (`S/21`) | suivre récit et `CT`, paramétrable |
| 2 | Escalade J+7 | alerte ROC si risque élevé | n/a | J+7 et score de risque < 50 | — | défaut du cahier |
| 3 | J+90 | « passage au contentieux » | état `CONTENTIEUX` de workflow | escalade (score < 20, sans action) ; contentieux = décision ROC (`CT:367`, `CR:181,600`) | — | lire comme escalade, question |
| 4 | Statuts de recouvrement | chaîne `EN_RETARD → PERTE_DEFINITIVE` | aucun | identique (`CR:243-254`) | — | suivre récit |
| 5 | Entrée en recouvrement | non dit | compteur retards J+7 | J+7 | — | J+7 paramétrable |
| 6 | Blocage | ROC seul, motif | aucun bouton ; « dossiers bloqués » = autre objet | ROC seul, DAF notifié | — | suivre récit, renommer l'objet de démo |
| 7 | Vue réseau | tri par PAR, descente | tri par impayés, pas de carte ni de dossier | tri PAR décroissant, carte, concentration | PAR par zone (`S/11`) | récit + cahier |
| 8 | Stratégie, affectation | stratégie + agents par zone | textes | plan IA modifiable, un agent par zone | — | à construire |
| 9 | PAR | sans formule | constantes ; comptage de dossiers | 30/90 ; glossaire encours entier | 1/7/30 et 30/60/90 | 1/30/90 cumulatifs sur encours entier |
| 10 | Classes | non dit | 1/10/50/80/100 % | 1/10/25/50/100 % | — | question |
| 11 | Rapprochement | < 1 % | lettrage seul | < 1 % et « exact » | — | < 1 %, à préciser |
| 12 | Validation MoMo | comptable | tableau seul (mock) | comptable toujours, rejet motivé | — | récit |
| 13 | Remboursement guichet | espèces au guichet | guichet = dépôt/retrait ; GP encaisse une échéance figée | dépôt lié à l'échéance (`CT:517`) | — | écran à créer |
| 14 | Pénalités | non dit | 15 % de la mensualité (convention) | non dit | — | bloquant |
| 15 | Promesses | GP enregistre, relances suspendues | montant + date, statuts `ACTIVE/TENUE/NON_TENUE/PARTIELLE` | `PROMISE_*`, GP puis ROC à J+3 | statuts de démo | récit + cahier |
| 16 | Score | cité | saisi à la main, facteurs 105 % | f(6 variables), annexe C absente | — | bloquant |
| 17 | Mauvais payeur | fiche listée | top 6 | blocs détaillés | booléen sans règle | définir le seuil |
| 18 | Agents de recouvrement | par zone | agents terrain | rôle `RELANCE` | — | confirmer |
| 19 | Clôture, cycle | `CLOTURE` puis cycle | statut seul | statut seul | — | à décrire |
| 20 | PAR d'agence | — | 11,7 % (texte, `roc-recouvrement-hub.ts:109`) vs 11,2 % (`agences.ts:413`) | — | — | incohérence de démo |

---

## 10. Questions ouvertes bloquantes pour le PO
**Argent et cœur**
1. Le reste dû, l'échéancier et les paiements viennent-ils du cœur en lecture seule ? Un remboursement saisi dans Prospera (guichet, terrain, MoMo validé) doit-il être renvoyé au cœur ? Sans réponse, le « registre unique dans `paiement` » et le rapprochement à 1 % n'ont pas de sens.
2. Qui calcule les pénalités et intérêts de retard (cœur ou Prospera) ? Taux, base, plafond, gel pendant un étalement ?
3. Ordre d'imputation : « pénalités, intérêts, capital » ou autre ? Sort d'un paiement anticipé ou en trop ?
4. « Moins de 1 % » : de quoi, dans quel sens, et que devient un paiement hors tolérance ?
5. La validation du comptable s'applique-t-elle aussi aux paiements confirmés par PI-SPI et aux banques ? Opérateurs et pays à lister.

**Statuts et décisions**
6. Le ROC bloque **un dossier**. Faut-il aussi suspendre l'octroi de nouveaux prêts au client ou à une agence ? Qui lève chacun ?
7. J+90 : passage automatique au contentieux ou décision du ROC ? Étape de validation (DG, comité) avant le judiciaire ?
8. `PERTE_DEFINITIVE` : qui, quelle condition, quelle écriture, quel effet sur le client ?
9. Plan d'étalement : durée et nombre maximums, effet sur retard et classe, qui modifie l'échéancier dans le cœur ?

**Définitions**
10. PAR : confirmer 1/30/90 cumulatifs sur l'encours entier, seuils 10 % et 5 %. Classes et provisions de l'IMF : 1/10/25/50/100 % (cahier) ou 1/10/50/80/100 % (démo) ?
11. Mauvais payeur : seuil de retard, nombre d'échéances ou montant ? Fiche par client ou par prêt ?
12. Score de recouvrement : variables, poids, formule (annexe C absente) ; score ou règle déterministe du PRD Distributeur ?
13. Agent de recouvrement : rôle distinct de l'agent terrain ? Un par zone ou par agence ? Affectation par le ROC seul ou aussi le RA ?

**Parcours**
14. Clôture : condition exacte (solde nul, dépôt restitué, cautions libérées), qui clôture dans le cœur, critères d'un nouveau cycle après étalement, retard ou perte.
15. Valeurs par défaut du calendrier : confirmer J-3, J+1-3, J+7, J+90, 3 échecs, scores 50 et 20, 06 h / 14 h ; envoi automatique ou validé par le GP au départ ?
