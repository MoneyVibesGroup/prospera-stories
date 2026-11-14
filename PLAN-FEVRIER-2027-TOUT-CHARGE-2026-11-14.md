# Plan de construction jusqu'à la mise en service de février 2027 : tout est chargé

> **Date :** 2026-11-14 · **Statut :** proposition de Dev B ; arbitrages de l'assembleur du 2026-11-14 appliqués (délégation du PO : « tout charger ») · **Auteur :** Dev B
> **Période :** du lundi 16/11/2026 au vendredi 26/02/2027 (S2 → S14 du plan v3 ; pause du 21/12 au 01/01, comme le plan v3)
> **Décision du PO (2026-11-13) :** « il faut tout charger sans regarder la charge de travail, on va y arriver ».
> **Ce document ne remplace rien.** Il se lit avec `PLAN-2-DEVS-8-SEMAINES-2026-10-26.md` (v3) et
> `amendement-plan-v3-2026-11-10.md`, dont il reprend le calendrier, les plages et les règles. Il place **tous** les
> épics ouverts du registre dans ce calendrier. Aucun client n'est nommé : « le distributeur », « l'IMF »,
> « la compagnie d'assurance », « le cabinet ».

---

## 1. Principe et sources

**Le principe, en quatre phrases.**
1. **Tout est chargé.** 190 épics ouverts du registre sont placés (dont 180 entre le 16/11 et le 26/02, et 10 après février : Connecteurs, EPIC-170 → 179, que la spine de Connecteurs AD-32 sort de février). **Rien n'est retiré, rien n'est reporté pour cause de charge.** Aucun plafond de capacité n'entre dans le calendrier.
2. **La charge est affichée, jamais utilisée.** Le tableau du §3.2 compte les épics actifs par développeur et par semaine. Il informe ; il ne retire aucun épic. L'ordre de sacrifice du plan v3 §3 et de l'amendement §3 reste écrit, non appliqué.
3. **★ = ordre de construction.** Un épic ★ est construit avant les autres de son bloc : il est sur le chemin d'une démo du 15/01 ou de la mise en service de février (même sens que le ★ des épics de novembre ; pour les épics du moteur et de la Reprise, qui n'en portaient pas, le ★ est posé ici sur ceux du chemin critique du §2). Un épic sans ★ est du périmètre de février aussi : il suit.
4. **Les règles du PO tiennent.** « A et B jamais dans le même dépôt la même semaine » (carte des dépôts, 2026-11-11) ; tous les écrans par Dev B ; le backend est proposé à Dev A ; l'utilisateur est Dev B. Une épic dont le propriétaire change par rapport aux sources est signalée dans sa remarque.

**Sources lues (elles font foi, dans cet ordre).**

| Source | Ce qu'on en tire |
|---|---|
| `PLAN-2-DEVS-8-SEMAINES-2026-10-26.md` (v3) et `amendement-plan-v3-2026-11-10.md` | calendrier S1 → S8 (09/11 → 15/01), pause du 21/12 → 01/01, plages d'identifiants, règle des deux pistes, ordre de sacrifice (non appliqué) |
| `sprint-status.yaml` (registre de la branche `docs-plan-fevrier-tout-charge`, base `origin/main`) | épics ouverts : plages `reserved_ranges`, marque haute EPIC-244 ; paiement : EPIC-035, 037, 039, 040, 041 sont soldés (toutes leurs stories `done`), restent 036, 038, 042 ; notification : EPIC-054 → 062 soldés, restent 063 et 064 |
| `epics-moteur-installation-2026-11-11.md` (142 → 160) | plan semaine par semaine S4 → S14 et carte des dépôts : **repris tels quels** pour le moteur |
| `epics-reprise-connecteurs-2026-11-12.md` (161 → 179) | plan de la Reprise (S4 → S13) ; Connecteurs hors février |
| `epics-microfinance-imf-2026-11-13.md` (180 → 200) · `epics-assurance-2026-11-13.md` (201 → 221) · `epics-distributeur-2026-11-13.md` (222 → 244) | épics ★, dépendances, dépôts |
| `epics-ia-commune-2026-11-13.md` (245 → 261), branche `docs-epics-ia-commune` | épics ★ ; **ces 17 épics ne sont pas encore au registre de la branche de ce plan** (marque haute 244 ici, 261 sur leur branche) : la fusion de cette branche les y amène |
| Épics d'août : `epics-reseau`, `epics-pdv`, `epics-catalogue-produits`, `epics-stock`, `epics-assistant-ia` (095 → 105) | réseau 044 → 053, catalogue 065 → 074, stock 075 → 084, PDV 085 → 094, assistant 095 → 105 : `RÉSERVÉ`, **non slottés** au registre, donc ouverts |
| `epics-comptabilite-2026-08-27.md` (111 → 120) | `comptabilite-service` du cabinet : épics ouverts, placés ; EPIC-106 → 109 et 121 → 141 ont toutes leurs stories `done` au registre : non replacés (§7.3) |
| Spine du moteur, AD-43 (profil hébergé) et AD-44 (`prospera-relais`) | chantiers de plateforme EPIC-262 (relais) et EPIC-263 (profil hébergé) |

**Ce que ce plan hérite sans le modifier.** Les 8 semaines du plan v3 et le plan du moteur (S4 → S14). Les chantiers que les sources placent déjà (réseau S2 → S5, coque, socle EPIC-155 en S4, démos EPIC-160, Reprise tranche du 15/01) gardent leur semaine. Ce plan **ajoute** les semaines des épics que personne n'avait placés : PDV blocs 2 à 4, catalogue et stock complets, les 21 + 21 + 23 + 17 épics de novembre, l'assistant d'août, les chantiers de plateforme.

**Ce que ce plan ne fait pas.** Il ne chiffre pas en points (le chiffrage consolidé du 04/12 le fait) et il ne réécrit aucune fiche de story. Les semaines données ici sont des **fenêtres de départ** : une fenêtre de deux semaines n'est pas une promesse que l'épic y tient, c'est l'ordre dans lequel on le construit.

**Deux écarts à relever d'emblée.**
- Les sources se contredisent sur `auth-service` : l'amendement §4 et EPIC-142 le placent en S5 ; la carte des dépôts du moteur le met en S6 pour Dev B et en S4 pour le socle de Dev A. **Ce plan suit les deux** : le format des droits à tiret est élargi en **S4** par Dev A (EPIC-264 (droits à tiret), demande du PO « avant la semaine 5 »), la route de naissance et le droit de consentir en **S6** par Dev B.
- Les sources donnent les **écrans de la coque** à Dev A pour les modules métier d'août (v3 §5) et à Dev B pour tous les épics de novembre. Ce plan garde les deux : A fait la mécanique de la coque et les modules d'écran des épics d'août ; B fait les écrans de tous les épics de novembre et du moteur.

---

## 2. Les chemins critiques

### 2.1 Un chemin par bloc (semaines et dépendances)

| Bloc | Chemin critique | Fin | Ce qui l'attend ailleurs |
|---|---|---|---|
| **Plateforme et moteur** (B, avec A pour le socle) | EPIC-155 socle (S4, fini le 04/12) → EPIC-264 droits à tiret (S4) → EPIC-142 contrat d'état figé le **11/12** (S5) → 143 → 144 → 145 (la matrice des neuf états en premier) → 146 → 147 (S6-S7) → 148 agent et centrale (S7) → 149 → 150 licence (S7-S8) → 151 mise à jour (S8-S9) → 153 sauvegarde (S8-S9) → 148 montage d'une instance de client (S10) | S10 pour le moteur ; S14 pour 221 | 155 avant que B entre dans `platform-catalog`, `auth`, `paiement`, `notification` ; 149 avant 150 ; 157 avant l'envoi d'EPIC-158 |
| **Reprise** | EPIC-161 kit des cibles (S4) → 165 point d'import de `pdv` (S5) → 163 lot (S7) → 164 valider et livrer (S8, montré le 15/01) → 166 feu vert et effacement (S10) → 168 les deux reprises de février (S11-S13) | S13 | 161 fini le 04/12 ; 166 avant toute mise en service ; l'effacement avant J+30 du premier essai (≈ 14/02) ; 244 (reprise de l'ancien logiciel du distributeur) et 219 (archives de l'assurance) en dépendent |
| **IA commune** | EPIC-245 socle (S6) → 246 contrat et registre → 247 garde-fous (S7) → 248 catalogue et quatre packs (S7-S8) → 249, 250, 251 capacités et 253 Copilot en texte (S8-S9, règles N0 : les démos du 15/01 affichent de vraies propositions) → 256 boucle locale (S10) → 257 export et consentement → 258 centrale (S12-S13) | S14 (259, 260) | 245 attend 143 (manifestes) et la part « profil local » de 148 ; 257 attend 157 et 158 ; 190 (IMF), 217 (assurance) et 243 (distributeur) consomment 245 |
| **Distributeur** (hébergé) | EPIC-222 socle de cinq services (S5-S6) → 224 séries sans perte (S6-S8) et EPIC-263 profil hébergé (S7-S8) → 231 Créance et amendement de `paiement` (S7-S8) → 225 et 227 (S8-S9) → 228 commande (S9-S10) → 229 entrepôt et 230 facturation (S10-S11) → 232 encaissement et envoi (S11-S12) → 235 recouvrement (S11-S12) → 226 jeu, essai et recette et 244 reprise depuis l'ancien logiciel (S11-S13) ; la tournée : 233 (S10-S11) → 234 application Flutter (S11-S12) | S13 (non ★ : S13-S14) | PDV (085-087, 093), catalogue (065-070), stock (075-078, 082, 083) avant 225 à 229 ; 036 FedaPay et 063 passerelles (S8) avant 232 ; 161-165 et 167 avant 244 |
| **Microfinance (IMF)** | EPIC-180 produits et 183 échange avec le cœur (S9-S10) → 181 clients et 184 cœur fictif → 185 demande (S10-S11) → 186 instruction (S10-S12) → 187 comité et décaissement (S11-S12) → 188 clôture et nouveau cycle (S12-S13) ; 189 Créance de prêt dans `paiement` avant la fin de 187 ; 190 IA du crédit avant la fin de 186 | S13 (non ★ : S13-S14) | EPIC-262 relais (S8-S9) avant EPIC-200 ; 245-246 avant 190 ; revue juridique obligatoire avant la mise en service |
| **Assurance** (chez le client) | EPIC-201 socle et migrations (S5-S6) → 205 machine à états (S7-S9) → 206 déclarer (S8-S9) → 207 instruire (S9-S10) → 209 décider (S10-S11) → 210 payer (S11-S12) → 211 clore (S11-S12) → 214 archiver ; en parallèle 203-204 échange avec le logiciel de la compagnie (S6-S8), 214 GED et OCR (S8-S10), 215 contrats et provision (S8-S9) | S13 (219 : S14) | 214 attend que B quitte `document-service` (fin S7) ; EPIC-262 relais avant 220 ; EPIC-231 (amendement `paiement`) avant 210 ; séance d'immersion avant 207 et 209 |
| **Cabinet** | EPIC-155 : Node 24 et gardes dans ses dépôts (S5, par A) → 144 : retrait des quatre chemins d'octroi et recettes croisées réécrites (S5-S6) → **159 : le cabinet sur le moteur (S6-S7, en premier)** → clôture (S7) → 099 et 100 (mapping de comptes, S8-S9) | S9 | 159 attend 142 et 145 ; l'app expert-comptable est la première à passer sur le moteur (ordre du PO du 2026-11-11) |
| **Comptabilité** (cabinet, `comptabilite-service`) | EPIC-111 socle (S10-S11) → 112 journaux et 113 écriture (S11-S12) → 114 grand livre et balance canonique, 5e origine du hub de `balance-service` (S12-S13) → 115 tiers → 116 lettrage → 119 clôture → 120 piste d'audit (S14) ; 117 et 118 (imputation et anomalies assistées) attendent l'IA commune et sont portés par A | S14 | Dev B ; hors démo et hors chemin de mise en service |

### 2.2 Dépendances croisées entre blocs

| De | Vers | Pourquoi | Semaine d'échéance |
|---|---|---|---|
| EPIC-155 (socle) | tous les dépôts de B et de A | client Kafka, Karapace, Node 24 : B n'entre qu'après | 04/12 |
| EPIC-142 / 145 (état publié, matrice) | coque (EPIC-265), kit des cibles (161), cabinet (159), garde de chaque module | contrat figé ; la garde de chaque module le lit | 11/12 |
| EPIC-161 (kit) | 165 (points d'import), 163, 244 | une cible reçoit une reprise en déclarant ses objets | 04/12 |
| EPIC-143-144 (manifestes, installation) | 160 (démos), 147 (essai), 245 (IA) | offres, dépendances, essai | S6 |
| EPIC-148 (agent) | 149-153, 200, 221, 204, 224, 226, 245, 255 | tout ce qui parle à l'instance | 08/01 |
| EPIC-231 (Créance) | 230, 232, 233, 235, 236, 241 | `facturation` lit la Créance | S8 |
| EPIC-263 (profil hébergé) | 224, 230 | RPO 0 des séries avant le premier numéro | S8 |
| EPIC-262 (relais) | 200 (IMF), 220 (portail des cabinets d'expertise), 232 (sur site) | notifications de paiement entrantes sans port entrant | S9 |
| 036 (FedaPay), 063 (passerelles) | 232 | encaissement FedaPay, WhatsApp | S8 |
| 245-246 (IA socle) | 190, 217, 243, 253 | une proposition avec sa provenance | S7-S8 |
| 157 (consentements) | 248 (niveaux 1 à 3), 257 | aucun export sans consentement en vigueur | S10 |
| 166 (feu vert de la Reprise) | 146 (mise en service), tous les clients | « sans feu vert, la partie A refuse » | 29/01 |
| 161-165, 167 (Reprise) | 244 (distributeur), 219 (assurance), 197 (IMF) | les cibles reçoivent les fichiers | S10-S13 |
| 044-053 (réseau) | 202, 223, 227, 238 | portée d'accès publiée en état absolu | S3 |
| 085-087, 093 (PDV) ; 065-070 (catalogue) ; 075-078, 082, 083 (stock) | 225, 227, 228, 229, 237 | référentiels du distributeur | S7-S9 |

### 2.3 Le chemin critique global

**Jusqu'au 15/01 (démo).** EPIC-155 (fini le 04/12) → EPIC-142 (contrat d'état figé le 11/12) → EPIC-145 (matrice des neuf états) → EPIC-146 et 147 (deux espaces, essai prospect, S6-S7) → EPIC-160 (offres et jeux de démonstration des trois verticales, S6-S8) → **démo du 15/01**. Le chemin porte deux branches : la coque (EPIC-265, mécanique S3 → S5, modules métier S6 → S8) et la Reprise de la démo (161 → 165 `pdv` → 163 → 164, S4 → S8). Une semaine perdue avant le 11/12 décale la démo d'une semaine : il n'y a pas de marge, car la pause du 21/12 est fixée.

**Jusqu'à février (mise en service).** Deux chemins parallèles, un par développeur, qui se rejoignent au feu vert :
- **Dev B (moteur)** : 148 agent (S7) → 149 → 150 licence → 151 mise à jour → 153 sauvegarde → montage de l'instance (S10) → recette croisée des deux hébergements → mise en service.
- **Dev A (verticales)** : la plus longue chaîne est celle du distributeur, **8 maillons** : 222 → 224 → 231 → 225/227 → 228 → 229/230 → 232 → 235/226/244, de S5 à S13, un maillon par semaine ou presque ; la chaîne de l'IMF (180 → 185 → 186 → 187 → 188, S9 → S13) et celle de l'assurance (201 → 205 → 206 → 207 → 209 → 210 → 211, S5 → S12) ont la même longueur et la même absence de marge.

**En une ligne :** EPIC-155 (04/12) → EPIC-142/145 (11/12) → EPIC-146/147 → EPIC-160 → **démo 15/01** → chaîne du distributeur 222 → 224 → 231 → 225/227 → 228 → 229/230 → 232 → 235/226/244 (Dev A) et agent 148 → 149 → 150 → 151/153 → montage S10 → feu vert 166 (Dev B) → **mise en service S13, S14 en réserve**.

---

## 3. Le calendrier, semaine par semaine

### 3.1 Les semaines

**Lecture.** Un numéro suivi de ★ est un épic ★ (`165★` = EPIC-165). Les numéros d'épics sont ceux du registre ; la coque `prospera-app` est EPIC-265 (§7.1). « Dépôts touchés » ne liste que les dépôts à propriétaire unique par semaine ; `prospera-app`, `prospera-plateforme`, `agent-instance`, `centrale-service`, la console et `prospera-recette` se partagent **par dossier** (§3.3). Dev B écrit **les écrans de tous les épics de novembre** dans les dossiers `moteur`, `instance` et `reprise` de `prospera-app` et dans la console. Les semaines S2 et S3 de Dev B n'ont aucun épic de propriétaire : c'est de la préparation (le cadrage des trois verticales est terminé).

| Sem. | Dev A (épics et chantiers en cours) | Dev B (propriétaire) | Dépôts touchés (hors partage par dossier) | Règle « jamais le même dépôt » |
|---|---|---|---|---|
| **S2**<br>16/11 → 20/11 | **Réseau** 044, 045★, 046★, 048★ | *Préparation, non comptée : spine et épics du relais (AD-44) dans `prospera-stories`.* | **A** : `reseau-service`<br>**B** : `prospera-stories`<br>*`prospera-app` : A (mécanique de la coque).* | ✅ respectée : A et B n'ont aucun dépôt commun |
| **S3**<br>23/11 → 27/11 | **Réseau** 047★, 049★, 050★, 051★ · **Coque** 265★ | *Préparation, non comptée : fiches des stories d'EPIC-142 → 147 et 159 (passées en S3 le 12/11) ; fin de la spine du relais.* | **A** : `reseau-service`<br>**B** : `prospera-stories`<br>*`prospera-app` : A (mécanique de la coque).* | ✅ respectée : A et B n'ont aucun dépôt commun |
| **S4**<br>30/11 → 04/12 | **Réseau** 052★, 053★ · **Moteur** 155★ · **Plateforme** 263★, 264★ · **Coque** 265★ | **Reprise et Connecteurs** 161★ | **A** : `prospera-assurance-service`, `auth-service`, `cabinet`, `platform-catalog-service`, `prospera-distributeur`, `kyc-service`, `prospera-microfinance-service`, `prospera-notification-service`, `prospera-paiement-service`, `reseau-service`<br>**B** : `prospera-stories`, `prospera-plateforme`<br>*`prospera-app` : A (mécanique de la coque).* | ✅ respectée : A et B n'ont aucun dépôt commun |
| **S5**<br>07/12 → 11/12 | **Réseau** 052★, 053★ · **PDV** 085★, 086★, 087★ · **Moteur** 155★ · **Reprise et Connecteurs** 165★ · **Assurance** 201★ · **Distributeur** 222★ · **Plateforme** 263★, 264★ · **Coque** 265★ | **Moteur** 142★, 143★, 144★, 145★ · **Reprise et Connecteurs** 169★<br>**Écrans (B)** des épics d'A : 2 épics : 201, 222 | **A** : `cabinet`, `prospera-croissance-service`, `prospera-ia-service`, `pdv-service`, `prospera-pilotage-service`, `prospera-recouvrement-service`, `reseau-service`, `prospera-terrain-service`, `prospera-ventes-service`<br>**B** : `platform-catalog-service`, `prospera-paiement-service`<br>*`prospera-app` par dossier : A mécanique et modules métier, B `moteur`.* | ✅ respectée : A et B n'ont aucun dépôt commun |
| **S6**<br>14/12 → 18/12 | **Catalogue** 065★, 066★, 067★, 068★ · **Stock** 075★, 076★, 077★ · **PDV** 086★, 087★, 091★, 092★, 093★ · **IA commune** 095★, 097★, 098★, 245★, 246★ · **Moteur** 155★, 160★ · **Reprise et Connecteurs** 165★ · **Assurance** 201★, 203★ · **Distributeur** 222★, 224★ · **Plateforme** 263★, 264★ · **Coque** 265★ | **Moteur** 142★, 143★, 144★, 145★, 146★, 147★, 159★<br>**Écrans (B)** des épics d'A : 6 épics : 201, 203, 222, 224, 245, 246 | **A** : `prospera-assurance-service`, `catalogue-produits-service`, `prospera-croissance-service`, `prospera-distributeur`, `prospera-ia-service`, `prospera-liaison-assureur-service`, `pdv-service`, `prospera-pilotage-service`, `prospera-recouvrement-service`, `prospera-sinistres-service`, `stock-service`, `prospera-terrain-service`, `prospera-ventes-service`<br>**B** : `auth-service`, `cabinet`, `platform-catalog-service`, `prospera-paiement-service`<br>*`prospera-app` par dossier : A mécanique et modules métier, B `moteur`.* | ✅ respectée : A et B n'ont aucun dépôt commun |
| **S7**<br>04/01 → 08/01 | **Catalogue** 067★, 068★, 069, 070★ · **Stock** 077★, 078★ · **PDV** 091★, 092★, 093★ · **IA commune** 095★, 097★, 098★, 245★, 246★, 247★, 248★ · **Moteur** 155★, 160★ · **Reprise et Connecteurs** 162★, 163★, 165★ · **Assurance** 202★, 203★, 204★, 205★ · **Distributeur** 224★, 231★ · **Plateforme** 263★, 264★ · **Coque** 265★ | **Moteur** 144★, 145★, 146★, 147★, 148★, 149★, 150★, 159★<br>**Écrans (B)** des épics d'A : 11 épics : 163, 202, 203, 204, 205, 224, 231, 245, 246, 247, 248 | **A** : `prospera-adaptateurs`, `prospera-assureur-fictif`, `prospera-assurance-service`, `catalogue-produits-service`, `prospera-distributeur`, `prospera-ia-service`, `prospera-liaison-assureur-service`, `prospera-microfinance-service`, `pdv-service`, `reprise-service`, `reseau-service`, `prospera-sinistres-service`, `stock-service`, `prospera-ventes-service`<br>**B** : `auth-service`, `cabinet`, `platform-catalog-service`, `prospera-notification-service`, `prospera-paiement-service`<br>*`prospera-app` par dossier : A mécanique et modules métier, B `moteur`, `instance`, `reprise`.* | ✅ respectée : A et B n'ont aucun dépôt commun |
| **S8**<br>11/01 → 15/01 | **Paiement et notification** 036★, 063★ · **Catalogue** 071, 073 · **Stock** 079, 080, 081, 082★, 083★ · **PDV** 089, 090 · **IA commune** 096, 097★, 098★, 099, 100, 246★, 247★, 248★, 249★, 250★, 251★, 253★, 255 · **Moteur** 153★, 160★ · **Reprise et Connecteurs** 162★, 163★, 164★, 165★ · **Assurance** 202★, 203★, 204★, 205★, 206★, 214★, 215★ · **Distributeur** 223★, 224★, 225★, 227★, 231★ · **Plateforme** 262★, 263★, 264★ · **Coque** 265★ | **Moteur** 144★, 148★, 149★, 150★, 151★<br>**Écrans (B)** des épics d'A : 23 épics : 153, 163, 164, 202, 203, 204, 205, 206, 214, 215, 223, 224, 225, 227 … | **A** : `prospera-adaptateurs`, `prospera-assureur-fictif`, `prospera-assurance-service`, `auth-service`, `cabinet`, `catalogue-produits-service`, `prospera-croissance-service`, `prospera-distributeur`, `prospera-ia-service`, `prospera-liaison-assureur-service`, `prospera-microfinance-service`, `prospera-notification-service`, `prospera-paiement-service`, `pdv-service`, `prospera-pilotage-service`, `prospera-recouvrement-service`, `prospera-relais`, `reprise-service`, `reseau-service`, `prospera-sinistres-service`, `stock-service`, `prospera-terrain-service`, `prospera-ventes-service`<br>**B** : `platform-catalog-service`<br>*`prospera-app` par dossier : A mécanique et modules métier, B `moteur`, `instance`, `reprise`.* | ✅ respectée : A et B n'ont aucun dépôt commun |
| **S9**<br>18/01 → 22/01 | **Catalogue** 072, 073, 074 · **Stock** 080, 081, 083★, 084 · **PDV** 088, 090, 094 · **IA commune** 096, 099, 100, 249★, 250★, 251★, 253★, 255, 261 · **Moteur** 153★, 154, 156 · **Reprise et Connecteurs** 162★, 163★, 164★, 165★ · **Microfinance** 180★, 181★, 183★ · **Assurance** 205★, 206★, 207★, 214★, 215★ · **Distributeur** 223★, 225★, 227★, 228★ · **Plateforme** 262★, 264★ | **Moteur** 144★, 148★, 150★, 151★, 152, 157<br>**Écrans (B)** des épics d'A : 23 épics : 153, 154, 156, 163, 164, 180, 181, 183, 205, 206, 207, 214, 215, 223 … | **A** : `prospera-adaptateurs`, `prospera-assurance-service`, `cabinet`, `catalogue-produits-service`, `prospera-croissance-service`, `prospera-coeur-sfd-service`, `prospera-ia-service`, `prospera-imf-service`, `pdv-service`, `prospera-pilotage-service`, `prospera-recouvrement-service`, `prospera-relais`, `reprise-service`, `reseau-service`, `prospera-sinistres-service`, `stock-service`, `prospera-terrain-service`, `prospera-ventes-service`<br>**B** : `auth-service`, `platform-catalog-service`, `prospera-notification-service`, `prospera-paiement-service`<br>*`prospera-app` par dossier : B `moteur`, `instance`, `reprise` et les écrans des épics ★ ; A modules métier.* | ✅ respectée : A et B n'ont aucun dépôt commun |
| **S10**<br>25/01 → 29/01 | **Paiement et notification** 042, 064 · **Stock** 084 · **IA commune** 096, 101, 102, 103, 104, 105, 252, 254, 255, 256 · **Moteur** 154, 156, 158 · **Reprise et Connecteurs** 165★, 166★, 167★ · **Microfinance** 180★, 181★, 183★, 184★, 185★, 186★, 190★ · **Assurance** 207★, 208★, 209★, 214★, 217★, 220★ · **Distributeur** 228★, 229★, 230★, 233★ · **Plateforme** 264★ | **Comptabilité** 111 · **Moteur** 148★, 152, 157 · **Microfinance** 200 · **Assurance** 221★<br>**Écrans (B)** des épics d'A : 25 épics : 154, 156, 158, 166, 167, 180, 181, 183, 185, 186, 190, 207, 208, 209 … | **A** : `apprentissage-service`, `prospera-assurance-service`, `cabinet`, `catalogue-produits-service`, `prospera-coeur-fictif`, `prospera-coeur-sfd-service`, `prospera-ia-service`, `prospera-imf-service`, `prospera-notification-service`, `prospera-paiement-service`, `pdv-service`, `prospera-relais`, `reprise-service`, `reseau-service`, `prospera-sinistres-service`, `stock-service`, `prospera-terrain-service`, `prospera-ventes-service`<br>**B** : `platform-catalog-service`, `comptabilite-service`<br>*`prospera-app` par dossier : B `moteur`, `instance`, `reprise` et les écrans des épics ★ ; A modules métier.* | ✅ respectée : A et B n'ont aucun dépôt commun |
| **S11**<br>01/02 → 05/02 | **Paiement et notification** 038 · **IA commune** 096, 101, 102, 103, 104, 105, 252, 254, 255, 256, 257 · **Moteur** 158 · **Reprise et Connecteurs** 168★ · **Microfinance** 182, 184★, 185★, 186★, 187★, 189★, 190★, 191★, 193★ · **Assurance** 208★, 209★, 210★, 211★, 213★, 217★, 220★ · **Distributeur** 226★, 229★, 230★, 232★, 233★, 234★, 235★, 236, 244★ · **Plateforme** 264★ | **Comptabilité** 111, 112, 113 · **Microfinance** 200 · **Assurance** 221★<br>**Écrans (B)** des épics d'A : 31 épics : 158, 168, 182, 185, 186, 187, 189, 190, 191, 193, 208, 209, 210, 211 … | **A** : `apprentissage-service`, `cabinet`, `catalogue-produits-service`, `prospera-coeur-fictif`, `prospera-coeur-sfd-service`, `prospera-ia-service`, `prospera-ia-centrale`, `prospera-imf-service`, `prospera-notification-service`, `prospera-paiement-service`, `pdv-service`, `prospera-recouvrement-service`, `prospera-relais`, `reprise-service`, `reseau-service`, `prospera-sinistres-service`, `stock-service`, `prospera-terrain-service`, `prospera-ventes-service`<br>**B** : `comptabilite-service`<br>*`prospera-app` par dossier : B `moteur`, `instance`, `reprise` et les écrans des épics ★ ; A modules métier.* | ✅ respectée : A et B n'ont aucun dépôt commun |
| **S12**<br>08/02 → 12/02 | **Paiement et notification** 038 · **IA commune** 101, 102, 103, 104, 105, 254, 257, 258 · **Moteur** 158 · **Reprise et Connecteurs** 168★ · **Microfinance** 182, 186★, 187★, 188★, 189★, 190★, 191★, 192, 193★, 194★, 195, 196, 198★, 199 · **Assurance** 210★, 211★, 212★, 213★, 216★, 218★, 219★, 220★ · **Distributeur** 226★, 232★, 234★, 235★, 236, 237, 238, 239, 240, 241, 243, 244★ · **Plateforme** 264★ | **Comptabilité** 112, 113, 114, 115 · **Microfinance** 200 · **Assurance** 221★<br>**Écrans (B)** des épics d'A : 39 épics : 158, 168, 182, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196 … | **A** : `apprentissage-service`, `prospera-assurance-service`, `cabinet`, `catalogue-produits-service`, `prospera-croissance-service`, `prospera-coeur-sfd-service`, `dashboard-service`, `prospera-ia-service`, `prospera-ia-centrale`, `prospera-imf-service`, `prospera-liaison-assureur-service`, `prospera-notification-service`, `prospera-paiement-service`, `pdv-service`, `prospera-pilotage-service`, `prospera-recouvrement-service`, `prospera-relais`, `reprise-service`, `reseau-service`, `prospera-sinistres-service`, `stock-service`, `prospera-terrain-service`, `prospera-ventes-service`<br>**B** : `balance-service et bilan-service`, `comptabilite-service`<br>*`prospera-app` par dossier : B `moteur`, `instance`, `reprise` et les écrans des épics ★ ; A modules métier.* | ✅ respectée : A et B n'ont aucun dépôt commun |
| **S13**<br>15/02 → 19/02 | **Comptabilité** 117, 118 · **Moteur** 158 · **Reprise et Connecteurs** 168★ · **Microfinance** 188★, 192, 194★, 195, 196, 197, 198★, 199 · **Assurance** 212★, 216★, 218★, 219★ · **Distributeur** 226★, 237, 238, 239, 240, 241, 242, 243, 244★ · **IA commune** 258, 259, 260 | **Comptabilité** 114, 115, 116, 119 · **Microfinance** 200 · **Assurance** 221★<br>**Écrans (B)** des épics d'A : 28 épics : 117, 118, 158, 168, 188, 192, 194, 195, 196, 197, 198, 199, 212, 216 … | **A** : `apprentissage-service`, `prospera-assurance-service`, `cabinet`, `catalogue-produits-service`, `prospera-croissance-service`, `prospera-coeur-sfd-service`, `dashboard-service`, `prospera-ia-service`, `prospera-ia-centrale`, `prospera-imf-service`, `prospera-liaison-assureur-service`, `prospera-notification-service`, `prospera-paiement-service`, `pdv-service`, `prospera-pilotage-service`, `prospera-recouvrement-service`, `reprise-service`, `reseau-service`, `prospera-sinistres-service`, `stock-service`, `prospera-terrain-service`, `prospera-ventes-service`<br>**B** : `balance-service et bilan-service`, `comptabilite-service`<br>*`prospera-app` par dossier : B `moteur`, `instance`, `reprise` et les écrans des épics ★ ; A modules métier.* | ✅ respectée : A et B n'ont aucun dépôt commun |
| **S14**<br>22/02 → 26/02 | **Comptabilité** 117, 118 · **Microfinance** 195, 197, 199 · **Assurance** 219★ · **Distributeur** 242 · **IA commune** 259, 260 | **Comptabilité** 116, 119, 120 · **Assurance** 221★<br>**Écrans (B)** des épics d'A : 9 épics : 117, 118, 195, 197, 199, 219, 242, 259, 260 | **A** : `prospera-assurance-service`, `cabinet`, `prospera-croissance-service`, `prospera-coeur-sfd-service`, `prospera-ia-service`, `prospera-imf-service`, `prospera-liaison-assureur-service`, `prospera-paiement-service`, `prospera-pilotage-service`, `prospera-recouvrement-service`, `reprise-service`, `prospera-sinistres-service`, `prospera-ventes-service`<br>**B** : `comptabilite-service`<br>*`prospera-app` par dossier : B `moteur`, `instance`, `reprise` et les écrans des épics ★ ; A modules métier.* | ✅ respectée : A et B n'ont aucun dépôt commun |

**Les croisements et les jalons de la semaine.**

| Sem. | Croisement, jalon ou point de mesure |
|---|---|
| S2 | Pas de croisement. Le registre n'a que `reseau-service` côté A ; la coque démarre en S3. |
| S3 | 🔁 **27/11** : portée réseau publiée (EPIC-050 : contrat A → B). Recalage de la vitesse de A : il **mesure**, il ne retire rien (décision du 2026-11-13). |
| S4 | 🔁 **04/12** : le socle est neuf (EPIC-155 : client Kafka, Karapace, MongoDB 8.0 dans tous les dépôts) ; `kit-cible` 1.0 publié et relu par A (EPIC-161) ; contrats de la Reprise publiés ; droits à tiret acceptés par `auth-service` (EPIC-264 (droits à tiret)). Chiffrage consolidé du 04/12 : ce plan donne l'ordre, le chiffrage donne les points. |
| S5 | 🔁 **11/12** : contrat d'état publié **figé** (EPIC-142), matrice des neuf états et garde publiées dans `prospera-plateforme` (EPIC-145) ; le kit rejoue la matrice (EPIC-161) ; emplacement du dossier `moteur` fixé avec A. |
| S6 | 🔁 **14/12** : contrat du jeu de démonstration (B → A). 🎯 **18/12** : cabinet sur le moteur (EPIC-159) ; essais prospects distributeur et assurance ouverts ; trois cibles de la Reprise vertes. |
| *pause* | ⏸ **21/12 → 01/01** : pause des fêtes du plan v3 ; rien n'est placé, aucun jalon (25/12 et 01/01 fériés). Les épics en S6 → S7 passent la pause ouverts. |
| S7 | 🔁 **08/01** : interface de l'agent publiée ; agent et centrale vivants ; licence signée (EPIC-150) ; 🎯 cabinet clôturé ; dans l'essai d'un prospect, un fichier de points de vente donne son rapport (EPIC-163). |
| S8 | 🎯 **15/01 : démo** (cabinet, puis distributeur, assurance, microfinance, chacun testable par le prospect). Integration Gate sur le vrai backend, sans mock. |
| S9 | 🔁 **18/01** : interface de la centrale publiée (A écrit dans `vagues/`) ; promotions et retours arrière sur site ; démarrage client de la microfinance (S9, maintenu par le PO le 2026-11-11). |
| S10 | 🔁 **29/01** : la partie A lit le feu vert de la Reprise (EPIC-166) ; montage de l'instance de l'assureur ; recette croisée des deux hébergements. |
| S11 | Début de la fenêtre de mise en service ; corrections de la recette croisée. |
| S12 | Pic de charge de Dev A : la chaîne du distributeur arrive à l'envoi, à l'encaissement et à la reprise. |
| S13 | 🎯 **19/02** : tout ★ construit ; mise en service des deux clients visée (SM-2) et feu vert par module (§4). |
| S14 | Réserve (22/02 → 26/02) : glissements, corrections, mise en service de ce qui n'est pas passé en S13. |

### 3.2 La charge par semaine : une information, pas un plafond

Nombre d'épics **actifs** (début ≤ semaine ≤ fin) par développeur. « Dev A : chantiers » compte EPIC-265 (la coque). « Dev B : écrans » compte les épics d'A dont B écrit les écrans (épics de novembre sauf bibliothèques et infrastructure, plus les écrans du moteur et de la Reprise dont le backend est à A). Un épic d'une semaine pèse autant qu'un épic de quatre : c'est un **compte**, pas une mesure de travail.

| Sem. | Dates | Dev A : épics | Dev A : chantiers | Dev B : épics propriétaire | Dev B : écrans (épics d'A) | **Dev B total** | **A + B** |
|---|---|--:|--:|--:|--:|--:|--:|
| S2 | 16/11 → 20/11 | 4 | 0 | 0 | 0 | 0 | 4 |
| S3 | 23/11 → 27/11 | 4 | 1 | 0 | 0 | 0 | 5 |
| S4 | 30/11 → 04/12 | 5 | 1 | 1 | 0 | 1 | 7 |
| S5 | 07/12 → 11/12 | 11 | 1 | 5 | 2 | 7 | 19 |
| S6 | 14/12 → 18/12 | 26 | 1 | 7 | 6 | 13 | 40 |
| S7 | 04/01 → 08/01 | 29 | 1 | 8 | 11 | 19 | 49 |
| S8 | 11/01 → 15/01 | 45 | 1 | 5 | 23 | 28 | 74 |
| S9 | 18/01 → 22/01 | 40 | 0 | 6 | 23 | 29 | 69 |
| S10 | 25/01 → 29/01 | 37 | 0 | 6 | 25 | 31 | 68 |
| S11 | 01/02 → 05/02 | 40 | 0 | 5 | 31 | 36 | 76 |
| S12 | 08/02 → 12/02 | **46** ⚠ | 0 | 6 | 39 | **45** ⚠ | 91 |
| S13 | 15/02 → 19/02 | 28 | 0 | 6 | 28 | 34 | 62 |
| S14 | 22/02 → 26/02 | 9 | 0 | 4 | 9 | 13 | 22 |

**Pics (les trois semaines les plus chargées).** Dev A : S12 (46), S8 (45), S9 (40). Dev B, propriétaire plus écrans : S12 (45), S11 (36), S13 (34).

**Ce que le tableau dit, sans rien retirer.**
- **Dev A porte la charge de décembre à février d'un seul tenant** : plus de vingt épics actifs dès S6, entre 37 et 46 de S8 à S12. C'est la conséquence directe de « backend proposé à Dev A » appliqué à tous les épics de novembre.
- **Dev B est propriétaire de 5 à 8 épics de S5 à S13 (la comptabilité du cabinet l'occupe de S10 à S14) et lourd comme auteur d'écrans** : il écrit les écrans de tout ce que A construit. Son goulot n'est pas le moteur, c'est le nombre d'écrans par semaine entre S8 et S13 (45 en S12, propriétaire et écrans).
- **Aucun épic n'est retiré pour autant.** Le levier ci-dessous existe si le PO veut s'en servir ; il n'est pas appliqué.

**Option non retenue (arbitrage de l'assembleur : Dev B est déjà à 45 en S12 avec les écrans).** On aurait pu confier à Dev B le **backend et les écrans** (une tranche verticale entière) d'épics dont les services sont neufs et ne croisent aucun dépôt de A pendant leur fenêtre : `prospera-pilotage-service` et `prospera-croissance-service` (EPIC-198, 199, 239, 240, 241, 243), `dashboard-service` (EPIC-216), EPIC-259 et 260 de l'IA. Cela aurait ôté sept épics à Dev A en S12 et deux en S13, au prix d'autant de backends pour B. Elle reste décrite, non appliquée.

### 3.3 La règle « jamais le même dépôt la même semaine »

**Résultat du contrôle par script** (chaque épic porte la liste de ses dépôts à propriétaire unique et les semaines où il y est ; le script cherche, pour chaque semaine, un dépôt tenu à la fois par A et par B) : **0 collision.** Les fenêtres qui l'ont rendu possible :

| Dépôt | Dev B y travaille | Dev A y travaille |
|---|---|---|
| `platform-catalog-service` | S5 → S10 (moteur) | S4 (socle) seulement |
| `auth-service` | S6-S7 (EPIC-142, 146), S7 (150), S9 (157) | S4 (socle, EPIC-264 (droits à tiret)) et S8 (202, 223) |
| `prospera-paiement-service` | S5-S7 (143, 144, 150), S9 (150) | S4 (socle), **S8** (036, 224, 231, EPIC-263), S10 et S11 → S14 |
| `prospera-notification-service` | S7 et S9 (150) | S4, **S8** (063), S10 → S14 |
| cabinet (dont `document-service`) | S6-S7 (159) | S4-S5 (Kafka, Node 24, BullMQ 6), puis S8 → S14 (GED, OCR) |

**Règle (validée par le PO, délégation du 2026-11-14) : quatre dépôts sont partagés par dossier** : `prospera-app`, `agent-instance`, `centrale-service` (carte du moteur) et `prospera-plateforme`. Dans `prospera-plateforme`, Dev B tient le moteur, le kit des cibles et les contrats du moteur ; Dev A écrit les bibliothèques et contrats des verticales (`finance`, `series`, `encours`, `contrats/assurance`, `champs-sensibles`, `vocabulaires/`). Aucun fichier n'est commun aux deux dossiers. Le script compte donc ce dépôt comme partagé, comme `prospera-app`.

**Écarts de dépendance relevés par le script** (le script rapproche chaque épic de ses dépendances citées dans les sources et vérifie que son début n'est pas antérieur à celui de la dépendance) : **0 écart non expliqué.** Dix couples (épic, dépendance) sont expliqués ; huit sont des « précède » ou des « se prouve avec » que la source écrit dans le mauvais sens, deux sont des dépendances dont seule la fin de fenêtre a besoin :

- **EPIC-245 ← EPIC-148** : la part « profil local de l'agent » attend l'agent (S7-S10) ; le service et les règles N0 n'en dépendent pas
- **EPIC-248 ← EPIC-157** : les niveaux 1 à 3 attendent les consentements ; le niveau 0 (règles) n'en dépend pas
- **EPIC-070 ← EPIC-071** : la source écrit « précède EPIC-071 » : c'est EPIC-071 qui dépend de 070
- **EPIC-097 ← EPIC-096** : EPIC-097 est remplacé par le contrat unique d'EPIC-246, qui dépend d'EPIC-245 et non de 096
- **EPIC-098 ← EPIC-096** : EPIC-098 est repris dans EPIC-246, qui dépend d'EPIC-245 et non de 096
- **EPIC-203 ← EPIC-204** : « le contrat se prouve avec EPIC-204 » : construits ensemble
- **EPIC-183 ← EPIC-184** : « le contrat se prouve avec EPIC-184 » : construits ensemble
- **EPIC-224 ← EPIC-230** : la source écrit « avant EPIC-230 » : c'est EPIC-230 qui dépend de 224
- **EPIC-231 ← EPIC-230** : la source écrit « l'amendement précède EPIC-230 » : c'est EPIC-230 qui dépend de 231
- **EPIC-233 ← EPIC-234** : « l'application EPIC-234 la prouve sur appareil » : construits ensemble

---

## 4. Les jalons et ce qui doit être prouvé

### 4.1 Démo du 15/01/2027 (fin de S8)

Le périmètre de la démo est celui de l'amendement §2 et de l'amendement du PO du 2026-11-11 : **les trois verticales telles que le code les présente aujourd'hui**, chacune ouverte par le prospect lui-même dans son propre essai (EPIC-147 : cinq essais simultanés ; EPIC-160), plus le cabinet. Chaque ligne se prouve sur le **vrai backend, sans mock** (Integration Gate, principe 0).

| Verticale | Parcours de démo à jouer | Épics qui le portent |
|---|---|---|
| **Plateforme** (SM-1) | une offre d'essai s'installe **en une action**, sans rouge hors prérequis externes ; une dépendance manquante est refusée avec son nom ; le menu de la coque suit les modules installés ; l'état publié fait foi (test de mutation d'EPIC-145 : falsifier `echeanceLe` ne change aucune décision de garde). « Désinstaller et réinstaller » n'est **pas** montré (S9) | 142 → 147, 265 |
| **Cabinet** | l'app expert-comptable tourne **sur le moteur** : elle lit l'état publié, menu et garde à la règle C8, bandeaux de préavis et de lecture seule ; le parcours dossier → balance → bilan est celui du code existant | 159, 155 (Node 24), 144 |
| **Distributeur** | quatre modules **installés** et non déployés à la main : réseau (agence et zone réelles), points de vente (vue 360°, carte), catalogue et prix résolu, stock lisible ; la **Reprise** : le prospect dépose un fichier de points de vente, lit le rapport, valide et retrouve ses points de vente ; une proposition d'IA avec sa provenance (règle N0) | 160, 044 → 053, 085 → 087, 091 → 093, 065 → 070, 075 → 078, 162 → 165, 245 → 253 |
| **Assurance** | un sinistre traverse `DECLARE` → `CLOTURE` et les polices se lisent, **sans GED ni OCR de lot** (retirés des S7-S8 par l'amendement §6) ; des propositions d'IA avec provenance | 160, 245 → 253 |
| **Microfinance** | membres, dépôts, crédits et prudentiel tels que le code les présente ; crédit, collecte, épargne de la démo ; l'IMF de démonstration | 160 |
| **Moteur** | agent et centrale vivants au 08/01 (hors démo, mais prouvés) ; licence signée ; cabinet clôturé | 148 → 150 |

**Ce que la démo ne montre pas, et qui est dit :** désinstaller et réinstaller (S9), la GED et l'OCR de lot, les 21 + 23 + 21 épics de novembre (ils se construisent de S5 à S13 et sont montrés à la mise en service), Connecteurs.

### 4.2 Mise en service de février (S11 → S14)

Deux modes d'hébergement, deux calendriers : **le distributeur sur les serveurs de Money Vibes** (profil hébergé, AD-43) ; **l'IMF et la compagnie d'assurance sur leurs serveurs** (instance sur site, relais AD-44). La mise en service vise **S13 (19/02)** ; S14 est la réserve. **Le feu vert se donne module par module** (`reprise.feu-vert.changed`) : un module sans feu vert reste « non installé » dans le rapport de la Reprise.

**Ce qui doit être prouvé pour chaque module avant son feu vert :**
1. la **garde de câblage** : `docker compose --profile <module> up` vert à l'Integration Gate (seul `docker compose up` voit les `UnknownDependenciesException`) ;
2. le test « **promouvoir, saisir, revenir, tout se relit** » (C12) et l'aller-retour installer / désinstaller sans perte (C9) ;
3. la **lecture de l'état publié** par la garde (double lecture éteinte), la matrice des neuf états rejouée ;
4. le **point d'import vert** de la Reprise (EPIC-165) et le feu vert d'EPIC-166, après une reprise fraîche à écart nul ;
5. la **recette croisée** des deux hébergements (EPIC-148) : instance de test complète, centrale de recette, réseau puis fichier.

| Client | Modules dont le feu vert est attendu | Preuve propre au client |
|---|---|---|
| **Distributeur** (hébergé) | `reseau`, `pdv`, `catalogue`, `stock`, `commande`, `entrepot`, `facturation`, `paiement`, `notification`, `terrain`, `recouvrement`, `freelance`, `approvisionnement`, `conquete-objectifs`, `equipe`, `controle-gestion`, `marketing`, `studio-social`, `finance-transactions`, `automatisations`, `dashboard`, `reprise` | les deux parcours n° 1 : **la facture juste** (commande → stock réservé → bon de livraison → facture en un clic sur les quantités livrées → PDF → WhatsApp → encaissement) et **la tournée finie** (plan de journée → visite → commande → encaissement en espèces → clôture, hors connexion) ; numéros de facture sans perte (RPO 0) ; la reprise depuis l'ancien logiciel (EPIC-244) avec bascule ; mentions légales validées par l'expert-comptable du client |
| **IMF** (sur site) | `produits-financiers`, `microfinance`, `coeur-sfd`, `credit`, `collecte`, `caisse`, `risque-par`, `recouvrement`, `conformite-bceao`, `dashboard`, `equipe`, `marketing`, `automatisations`, `support-client`, `reseau`, `notification`, `ia` | **cœur fictif** pour la démonstration (le logiciel cœur de l'IMF fait foi, son connecteur est hors février) ; plafond d'usure jamais franchi (EPIC-180) ; une connexion sortante vers un nom non déclaré est refusée ; à J+30 sans contact, le gel bloque les mises à jour mais pas le travail (UJ-9) ; **revue juridique faite** |
| **Compagnie d'assurance** (sur site) | `sinistres`, `expertises`, `ged`, `assurance`, `liaison-assureur`, `reprise`, `notification`, `paiement` (règlements sortants), `dashboard`, `ia` | le circuit complet jusqu'au chèque, recours compris (EPIC-205 → 212) ; la **recette de l'annexe E** avec le logiciel de compagnie fictif (EPIC-204) ; le dossier retrouvé en une recherche (213) ; la reprise des archives (219) ; **revue juridique faite** ; **séance d'immersion tenue** et ses ajustements pris |
| **Cabinet** | app expert-comptable sur le moteur | clôturé en S7 ; recette des quatre états de contrat |

---

## 5. Ce qui dépend d'une entrée extérieure, et sa date limite

Les dates ci-dessous sont des **dates limites proposées par ce plan**, calculées pour qu'aucun épic n'attende l'entrée. Quand une source donne déjà la date, elle est citée. Aucune de ces entrées ne bloque le **développement** : chacune bloque une recette, une mise en service ou une partie nommée d'un épic, et la **règle « bientôt »** (jamais de simulation) donne la marge.

| Entrée extérieure | Qui | Ce qu'elle débloque | Date limite | Si elle manque |
|---|---|---|---|---|
| **Contrats des opérateurs Mobile Money** (T-Money, Flooz) pour le décaissement | PO | EPIC-264 (Mobile Money), adaptateur sortant de `paiement` ; règlement des sinistres (EPIC-210) et décaissement des prêts (EPIC-187) | **signés avant le 22/01** (S9) ; l'adaptateur se construit en S11-S12 | le canal est « **bientôt** », le dossier propose le chèque ou le virement, **rien n'est simulé** (PRD assurance FR-223) ; en démo, le cœur fictif décaisse |
| **Compte marchand FedaPay** réel et sortie de la production PI-SPI (STORY-673, STORY-668 ; STORY-715 mTLS bloquée) | PO | EPIC-036, EPIC-232 (encaissement) | compte avant le **15/01** (S8, fin) pour la recette de S11 | bac à sable ; la production PI-SPI reste fermée tant que le point juridique n'est pas levé |
| **Documents de la compagnie** : manuel de procédures sinistres, délégations et seuils, liste des experts agréés, barèmes et grilles de vétusté, modèles de courriers et de quittances, volumes (PRD assurance A-1, A-2, A-4 → A-7) | PO, via la séance d'immersion | EPIC-205 → 209 (paramètres), 208 (panel d'experts), 207 (barèmes), 221 (dimensionnement) | **22/01** (S9) pour A-1, A-2, A-5 ; **29/01** (S10) pour A-4, A-6, A-7 | valeurs par défaut du PRD (271 défauts `[ASSUMPTION]`), grilles de démonstration **jamais utilisées en production** |
| **Séance d'immersion avec la compagnie** | PO | les 5 ajustements (délégations, voie rapide, litige, accusé, convention d'indemnisation directe) et les défauts H | **tenue au plus tard le 22/01** ; idéalement avant le 15/01 | le circuit part avec les défauts ; les ajustements se font **par paramètres** (FR-27), sans développement |
| **Logiciel de la compagnie, connu en janvier** (nom, API, forme des fichiers ; A-3, A-24) | PO | EPIC-203 (contrat d'échange générique), 219 (reprise par l'API) | **29/01** (S10) | fichiers Excel ou JSON d'abord (amendement A-10) ; contrôle de doublon par Prospera |
| **Juriste : revue juridique obligatoire avant la mise en service** de l'assurance (46 points J, PRD A-15) et de l'IMF (11 points, A-2) | PO, avec un juriste désigné | la mise en service des deux clients sur site | **lancée au plus tard le 04/01**, issue au plus tard le **22/01** (cible du PRD : 4 semaines avant la mise en service) | **pas de mise en service** : c'est une condition, pas un risque |
| **Juriste : loi 2019-014** (consentements, clauses d'apprentissage, contrat client), score de crédit ou d'assurance (EPIC-247), GPS des agents (distributeur A-2) | PO « au moment venu » | signature du premier contrat ; EPIC-157, 247, 233 | avant la **première signature** (février) ; GPS avant la mise en service de `terrain` (S11) | aucun consentement ne s'enregistre sans contrat signé portant la clause (spine du moteur AD-13) ; `terrain` sans suivi GPS |
| **Distributeur : mentions légales de la facture** validées par l'expert-comptable du client (A-1) | PO | recette de la facture (EPIC-230) | **22/01** (avant S10) | la facture est construite, la recette attend |
| **Distributeur : exports de l'ancien logiciel** (clients, articles, factures ouvertes, modèle de facture, dernier numéro ; A-4), taille du client (A-3), gamme du jeu (A-5) | PO | format du numéro de facture (EPIC-224), reprise (EPIC-244), jeu (EPIC-226) | **A-4 avant le 14/12** (S6, avant EPIC-224) ; A-3 et A-5 avant le 11/01 | numérotation à décider sans le modèle ; jeu générique |
| **Choix du stockage de production** (Q-3 : MinIO en développement, remplaçant à trancher) | PO, Dev A | EPIC-214 (test de contrat S3), 221 | **avant le 11/01** (S8) | test de contrat sur MinIO ; remplacement plus tard |
| **Choix du modèle de langage ouvert** et des paliers matériels (EPIC-255) | PO, Dev A | EPIC-255, 253, 259 | **avant le 11/01** (S8) | les capacités servent en **gabarit** ; le Copilot se replie |
| **Infrastructure du moteur** : registre d'images, autorité de certificats, cérémonie des clés (deux clés matérielles hors ligne, deux détenteurs), **second hôte** pour la centrale, second support de sauvegarde sur site ; **deuxième machine** pour le jeu de répliques du distributeur hébergé (AD-43) | PO | EPIC-148, 150, 153, 224, EPIC-263 | **avant le 04/01** (S7) | agent simulé et centrale simulée seulement ; pas d'hébergé en production |
| **Accès au serveur de l'IMF et de la compagnie** (DSI, pare-feu : liste des destinations sortantes, RPO et RTO d'AD-16) | PO | EPIC-200, 221 | **29/01** (S10) | pas de montage d'instance |
| **Compte d'envoi WhatsApp et passerelle SMS** de production | PO | EPIC-063, 232 | non écrit dans les sources : à vérifier ; proposé **11/01** | messages interceptés en essai ; `notification` journalise sans envoyer |

---

## 6. Les risques du plan (dits, sans rien couper)

| # | Risque | Effet | Où le suivre |
|---|---|---|---|
| R1 | **La charge de Dev A dépasse tout ce qui a été mesuré** : jusqu'à S12 (46 épics) actifs, entre 37 et 46 de S8 à S12. La vitesse mesurée est de 80 à 100 points par semaine et par développeur | des épics glissent de S13 vers S14, puis hors février, **et la règle des deux pistes ne l'empêche pas** | tableau du §3.2 ; croisements du 08/01, du 22/01 et du 29/01 |
| R2 | **Dev B est le goulot des écrans** : il écrit les écrans de tous les épics de novembre, jusqu'à S12 (45) épics (propriétaire et écrans) | écrans livrés après le backend, donc épics non « finis » (la règle des tranches verticales les exige ensemble) | tableau du §3.2 ; levier du §3.2 |
| R3 | **La chaîne du distributeur est de huit maillons de S5 à S13** et `paiement` n'est accessible à Dev A qu'en S4, S8 et à partir de S10 | un retard de `paiement` en S8 (036, 224, 231, EPIC-263 en même temps) décale `facturation` d'une semaine, donc l'envoi, la tournée et la reprise | EPIC-231, 224 ; fenêtre S8 de `paiement` |
| R4 | **La chaîne de l'IMF commence à S9 et finit à S13** (maintenu le 2026-11-11, « la microfinance en dernier ») | l'IMF n'a aucune réserve avant S14 ; sa revue juridique et le relais (EPIC-262) doivent être prêts | EPIC-185 → 188 ; EPIC-262 |
| R5 | **`document-service` est tenu par B en S6-S7 (cabinet) puis par A de S8 à S14 (GED, OCR)** ; sa migration (Node 24, client Confluent, BullMQ 6 — première majeure 6 du parc) tombe en S5 | une migration ratée en S5 se découvre en S8 | EPIC-201 ; EPIC-214 |
| R6 | **EPIC-145 et EPIC-149** : erreurs qui ne se voient pas en test fonctionnel (garde qui lit encore `entitlement.changed` ; état de confiance qui laisse une licence éternelle) | écrans justes presque toujours, faux le jour d'une échéance, devant un prospect ou un client | tests de mutation d'EPIC-145 ; suite d'attaques d'EPIC-149 |
| R7 | **Le registre de cette branche s'arrête à EPIC-244 pour l'IA commune** : EPIC-245 → 261 sont réservés par la PR #445, sur une autre branche non fusionnée ; EPIC-262 → 264 sont inscrits ici, marque haute EPIC-264 | deux registres à rapprocher à la fusion | `sprint-status.yaml` |
| R8 | **Le partage par dossier de `prospera-plateforme`** est une règle (validée) qui ne tient que si les dossiers restent disjoints | un fichier commun (schémas partagés, index de contrats) recrée une collision silencieuse | §3.3 ; revue croisée |
| R9 | **Dépendance aux entrées extérieures** (§5) : revue juridique, séance d'immersion, contrats des opérateurs | mise en service bloquée **sans qu'une ligne de code y soit pour rien** | §5 |
| R10 | **La comptabilité du cabinet (EPIC-111 → 120) tombe en S10 → S14**, dans la réserve de février ; ses épics 117-118 attendent l'IA commune | la comptabilité peut ne pas tenir février ; elle n'est sur le chemin d'aucune démo ni d'aucune mise en service | §7.1 ; Dev B |
| R11 | **Les fenêtres sont des ordres, pas des estimations** : aucun épic n'est chiffré en points avant le 04/12 | une fenêtre de deux semaines peut cacher un mois de travail | chiffrage consolidé du 04/12 |
| R12 | **Dev B porte déjà 17 à 20 semaines de moteur pour 10 disponibles** (amendement §5, non résorbé) et les ajouts du PO (app expert-comptable à la règle C8, module `reprise`) | risque identifié le 10/11 ; ce plan ne le lève pas | semaines S5 → S10 de B |
| R13 | **L'IA avancée et la centrale** (EPIC-256 → 260) se construisent en fin de période ; le premier modèle commun n'arrive qu'au second semestre 2027 au plus tôt (FR-47) | sans objet pour février : la chaîne qui le recevra se construit avant | EPIC-258 |

---

## 7. Le tableau final

### 7.1 Les épics placés (190)

« Début » et « Fin » sont des semaines du plan v3 (S6 = 14/12 → 18/12 ; S7 = 04/01 → 08/01) ; la fin est la date du vendredi. « Développeur » : le propriétaire du backend ; B écrit les écrans (mention « écrans B »). Pour EPIC-044, le début en S1 n'est pas confirmé par le registre. Les épics 095 → 105 sont repris dans l'IA commune : ils portent la fenêtre de l'épic qui les absorbe et le disent.

| Épic | Titre | Début | Fin | Développeur | ★ | Remarque |
|---|---|---|---|---|:-:|---|
| EPIC-036 | Fournisseurs de paiement interchangeables et simultanés (reste : FedaPay) | S8 (11/01) | S8 (15/01) | A | ★ | reste : STORY-247 (FedaPay), STORY-673 (compte marchand réel), STORY-715 (mTLS, bloquée) |
| EPIC-038 | Paiement hors Prospera et promesses (reste : publication des promesses) | S11 (01/02) | S12 (12/02) | A |  | reste : STORY-267 ; les promesses migrent vers EPIC-235 |
| EPIC-042 | Multi-pays, devises, console et recette (reste : candidats pour l'IA) | S10 (25/01) | S10 (29/01) | A |  | reste : STORY-287 (candidats pour l'IA) |
| EPIC-044 | Socle reseau-service, capacité partagée et cloisonnement | S2 (16/11) | S2 (20/11) | A |  | commencé en S1 (plan v3), non confirmé au registre |
| EPIC-045 | Zones et agences — deux agrégats, jamais un lieu générique | S2 (16/11) | S2 (20/11) | A | ★ |  |
| EPIC-046 | Hiérarchie récursive, profondeur configurable | S2 (16/11) | S2 (20/11) | A | ★ |  |
| EPIC-047 | Le redécoupage ne réécrit pas le passé | S3 (23/11) | S3 (27/11) | A | ★ |  |
| EPIC-048 | Personnes, responsables et affectations | S2 (16/11) | S2 (20/11) | A | ★ |  |
| EPIC-049 | La portée d'accès — modèle, héritage, gouvernance | S3 (23/11) | S3 (27/11) | A | ★ |  |
| EPIC-050 | La portée est publiée, et elle fait foi chez les consommateurs | S3 (23/11) | S3 (27/11) | A | ★ |  |
| EPIC-051 | Rattachement lieux ↔ zones et résolution | S3 (23/11) | S3 (27/11) | A | ★ |  |
| EPIC-052 | Couverture, zones blanches et fournisseur de candidats | S4 (30/11) | S5 (11/12) | A | ★ |  |
| EPIC-053 | Administration, import et journal d'audit **lisible** | S4 (30/11) | S5 (11/12) | A | ★ |  |
| EPIC-063 | Passerelles tierces : SMS, WhatsApp, push et chaîne de repli | S8 (11/01) | S8 (15/01) | A | ★ | SMS, WhatsApp, push : requis par EPIC-232 |
| EPIC-064 | Réponses entrantes et routage contextuel | S10 (25/01) | S10 (29/01) | A |  |  |
| EPIC-065 | Socle, entitlement et cloisonnement | S6 (14/12) | S6 (18/12) | A | ★ |  |
| EPIC-066 | L'article, ses identifiants et son cycle de vie | S6 (14/12) | S6 (18/12) | A | ★ |  |
| EPIC-067 | Unités, conditionnements et facteurs versionnés | S6 (14/12) | S7 (08/01) | A | ★ |  |
| EPIC-068 | Grilles tarifaires société | S6 (14/12) | S7 (08/01) | A | ★ |  |
| EPIC-069 | Promotions, y compris les remises de pied de commande | S7 (04/01) | S7 (08/01) | A |  |  |
| EPIC-070 | La résolution du prix — par ligne ET par panier, déterministe et explicable | S7 (04/01) | S7 (08/01) | A | ★ |  |
| EPIC-071 | Double tarification freelance — étanchéité prouvable | S8 (11/01) | S8 (15/01) | A |  |  |
| EPIC-072 | Profil commercial — ce qui permet de refuser | S9 (18/01) | S9 (22/01) | A |  |  |
| EPIC-073 | Import, export et journaux partitionnés | S8 (11/01) | S9 (22/01) | A |  |  |
| EPIC-074 | Droits, publication, conformité et route plateforme | S9 (18/01) | S9 (22/01) | A |  |  |
| EPIC-075 | Socle, entitlement, gate et cloisonnement par dossier | S6 (14/12) | S6 (18/12) | A | ★ |  |
| EPIC-076 | Entrepôts, magasins propres — la propriété décide | S6 (14/12) | S6 (18/12) | A | ★ |  |
| EPIC-077 | Mouvements append-only, idempotence, quantité toujours unitée | S6 (14/12) | S7 (08/01) | A | ★ |  |
| EPIC-078 | La dérivation — solde, stock à une date, points d'arrêt | S7 (04/01) | S7 (08/01) | A | ★ |  |
| EPIC-079 | Lots, dates limites et règle d'écoulement | S8 (11/01) | S8 (15/01) | A |  |  |
| EPIC-080 | Valorisation figée par exercice | S8 (11/01) | S9 (22/01) | A |  |  |
| EPIC-081 | Adaptateur #4 — la balance de stock | S8 (11/01) | S9 (22/01) | A |  |  |
| EPIC-082 | Inventaire, écarts et échelle de validation | S8 (11/01) | S8 (15/01) | A | ★ |  |
| EPIC-083 | Seuils, ruptures, transferts et transit | S8 (11/01) | S9 (22/01) | A | ★ |  |
| EPIC-084 | Capital dormant, réseau détaillant, portée, conformité et plateforme | S9 (18/01) | S10 (29/01) | A |  |  |
| EPIC-085 | Socle, entitlement, gate et cloisonnement | S5 (07/12) | S5 (11/12) | A | ★ |  |
| EPIC-086 | Le point de vente et son lien au point de stock | S5 (07/12) | S6 (18/12) | A | ★ |  |
| EPIC-087 | Portefeuille, affectation datée et étanchéité entre indépendants | S5 (07/12) | S6 (18/12) | A | ★ |  |
| EPIC-088 | Le départ d'un commercial — un seul chemin | S9 (18/01) | S9 (22/01) | A |  |  |
| EPIC-089 | La grammaire des règles du distributeur | S8 (11/01) | S8 (15/01) | A |  |  |
| EPIC-090 | Transitions expliquées, désaccord tracé, sortie automatique | S8 (11/01) | S9 (22/01) | A |  |  |
| EPIC-091 | La vue 360° par read-models datés | S6 (14/12) | S7 (08/01) | A | ★ |  |
| EPIC-092 | Segments, carte, zones blanches et portée réseau | S6 (14/12) | S7 (08/01) | A | ★ |  |
| EPIC-093 | Le plafond de crédit, porté et jamais appliqué | S6 (14/12) | S7 (08/01) | A | ★ |  |
| EPIC-094 | Droits, publication, candidats, données personnelles et plateforme | S9 (18/01) | S9 (22/01) | A |  |  |
| EPIC-095 | Socle, entitlement, gate, cloisonnement à deux clés et droits | S6 (14/12) | S7 (08/01) | A | ★ | repris dans EPIC-245 |
| EPIC-096 | Le fournisseur de modèle et les gabarits versionnés | S8 (11/01) | S11 (05/02) | A |  | repris dans EPIC-255 |
| EPIC-097 | Le contrat Proposition — décideur typé, immutabilité chaînée | S6 (14/12) | S8 (15/01) | A | ★ | remplacé par le contrat unique d'EPIC-246 |
| EPIC-098 | Audit à deux horloges, mesure d'inférence, quota et files équitables | S6 (14/12) | S8 (15/01) | A | ★ | repris dans EPIC-246 (audit à deux horloges) |
| EPIC-099 | L'ancrage légal — corpus versionné, index reconstructible, citation résolue | S8 (11/01) | S9 (22/01) | A |  | repris tel quel (corpus légal) |
| EPIC-100 | Surface pilote — mapping de comptes et l'écart annoncé/recalculé | S8 (11/01) | S9 (22/01) | A |  | repris tel quel (mapping de comptes du cabinet) ; dépend du socle IA EPIC-245 → 248 : démarre sur le contrat de proposition d'EPIC-246, les packs d'EPIC-248 finis le 15/01 |
| EPIC-101 | Le catalogue des types d'action et le contrôle de mode | S10 (25/01) | S12 (12/02) | A |  | repris dans EPIC-254 |
| EPIC-102 | Les règles — vocabulaire fermé, socle surchargeable, déclenchement planifié | S10 (25/01) | S12 (12/02) | A |  | repris dans EPIC-254 |
| EPIC-103 | L'évaluation — candidats, cibles, aperçu réel, scores explicables | S10 (25/01) | S12 (12/02) | A |  | repris dans EPIC-254 |
| EPIC-104 | Les trois modes, le mandat, l'exécution demandée et l'interrupteur | S10 (25/01) | S12 (12/02) | A |  | repris dans EPIC-254 |
| EPIC-105 | File d'arbitrage bornée, journal et statistiques | S10 (25/01) | S12 (12/02) | A |  | repris dans EPIC-254 |
| EPIC-111 | Comptabilité : socle, entitlement, cloisonnement par dossier et par exercice | S10 (25/01) | S11 (05/02) | B |  |  |
| EPIC-112 | Comptabilité : journaux et pièces | S11 (01/02) | S12 (12/02) | B |  |  |
| EPIC-113 | Comptabilité : écriture et brouillard | S11 (01/02) | S12 (12/02) | B |  |  |
| EPIC-114 | Comptabilité : grand livre et balance dérivée (5e origine du hub) | S12 (08/02) | S13 (19/02) | B |  | publie une balance canonique : 5e origine du hub |
| EPIC-115 | Comptabilité : comptes de tiers auxiliaires | S12 (08/02) | S13 (19/02) | B |  |  |
| EPIC-116 | Comptabilité : lettrage | S13 (15/02) | S14 (26/02) | B |  |  |
| EPIC-117 | Comptabilité : assistance à l'imputation et au lettrage (IA) | S13 (15/02) | S14 (26/02) | A (écrans B) |  | surface comptable portée par `comptabilite-service` (écrans B) ; moteur dans l'IA commune |
| EPIC-118 | Comptabilité : détection d'anomalies sur le journal (IA) | S13 (15/02) | S14 (26/02) | A (écrans B) |  | idem EPIC-117 |
| EPIC-119 | Comptabilité : clôture et à-nouveaux dérivés | S13 (15/02) | S14 (26/02) | B |  |  |
| EPIC-120 | Comptabilité : piste d'audit et fichier des écritures | S14 (22/02) | S14 (26/02) | B |  |  |
| EPIC-142 | Un contrat d'état publié stable, et un socle prêt pour le moteur | S5 (07/12) | S6 (18/12) | B | ★ |  |
| EPIC-143 | Le catalogue connaît chaque module par son manifeste | S5 (07/12) | S6 (18/12) | B | ★ |  |
| EPIC-144 | Installer une offre en une action, par un seul point de décision | S5 (07/12) | S9 (22/01) | B | ★ | écrans « désinstaller et réinstaller » en S9 |
| EPIC-145 | L'état publié fait foi pour la coque et pour chaque garde | S5 (07/12) | S7 (08/01) | B | ★ |  |
| EPIC-146 | Deux espaces : essayer, puis mettre en service (non divisé, pour les tests) | S6 (14/12) | S7 (08/01) | B | ★ |  |
| EPIC-147 | Le prospect essaie avant de signer (montré le 15/01 : la démo-vente) | S6 (14/12) | S7 (08/01) | B | ★ |  |
| EPIC-148 | Monter une instance sur site et la superviser | S7 (04/01) | S10 (29/01) | B | ★ | montage de l'instance (S10) en fin de fenêtre |
| EPIC-149 | L'instance garde la confiance, même coupée de Money Vibes | S7 (04/01) | S8 (15/01) | B | ★ |  |
| EPIC-150 | La licence signée ouvre, prolonge ou sanctionne | S7 (04/01) | S9 (22/01) | B | ★ |  |
| EPIC-151 | Mettre à jour sans peur : essayer, promouvoir, revenir | S8 (11/01) | S9 (22/01) | B | ★ |  |
| EPIC-152 | Correctifs de sécurité et fin de maintenance | S9 (18/01) | S10 (29/01) | B |  |  |
| EPIC-153 | Sauvegarder et restaurer sans jamais reculer la confiance | S8 (11/01) | S9 (22/01) | A (écrans B) | ★ |  |
| EPIC-154 | Support à distance à la demande | S9 (18/01) | S10 (29/01) | A (écrans B) |  |  |
| EPIC-155 | La version de plateforme 1.0 tourne sur un socle maintenu | S4 (30/11) | S7 (08/01) | A | ★ | client Kafka et Karapace finis le 04/12 |
| EPIC-156 | Vagues et fenêtre N/N-1 outillées | S9 (18/01) | S10 (29/01) | A (écrans B) |  |  |
| EPIC-157 | Consentements et indicateurs de niveau 0 | S9 (18/01) | S10 (29/01) | B |  |  |
| EPIC-158 | Apprentissage : échantillons, contributions, modèle commun | S10 (25/01) | S13 (19/02) | A (écrans B) |  |  |
| EPIC-159 | Le cabinet est installé par le moteur, et son app lit l'état publié | S6 (14/12) | S7 (08/01) | B | ★ |  |
| EPIC-160 | Les démos du 15/01 : chaque prospect ouvre son propre essai et teste sur place tout le parco... | S6 (14/12) | S8 (15/01) | A (moteur : B) | ★ | distributeur et assurance en S6-S7, microfinance en S7-S8 |
| EPIC-161 | Le kit des cibles : une cible reçoit une reprise en déclarant ses objets | S4 (30/11) | S4 (04/12) | B | ★ |  |
| EPIC-162 | prospera-adaptateurs : lire un fichier du client sans le trahir | S7 (04/01) | S9 (22/01) | A | ★ |  |
| EPIC-163 | Le lot de la Reprise : déposer, lire, contrôler, rapporter | S7 (04/01) | S9 (22/01) | A (écrans B) | ★ |  |
| EPIC-164 | Valider, livrer, retrouver ses données (montré le 15/01) | S8 (11/01) | S9 (22/01) | A (écrans B) | ★ |  |
| EPIC-165 | Les modules cibles reçoivent la reprise : un point d'import dans le « fini » de chacun | S5 (07/12) | S10 (29/01) | A (chaque propriétaire) | ★ | un point d'import par module, à la semaine de chaque module |
| EPIC-166 | Essai puis réel : le dossier, la reprise fraîche, l'écart nul et le feu vert | S10 (25/01) | S10 (29/01) | A (écrans B) | ★ |  |
| EPIC-167 | Le comptage d'ouverture du stock | S10 (25/01) | S10 (29/01) | A (écrans B) | ★ |  |
| EPIC-168 | Les deux reprises de février, de bout en bout, et les imports courants en libre-service | S11 (01/02) | S13 (19/02) | A (écrans B) | ★ |  |
| EPIC-169 | Les contrats de Connecteurs et la règle du point d'écriture unique, avant février | S5 (07/12) | S5 (11/12) | B | ★ |  |
| EPIC-170 | Le kit des cibles, part échange | après février | après février | à décider au déclencheur |  | hors février (spine de Connecteurs AD-32) ; part au premier contrat qui déclare un logiciel du client |
| EPIC-171 | connecteurs-service : un module installable, des domaines, un propriétaire chacun | après février | après février | à décider au déclencheur |  | hors février (spine de Connecteurs AD-32) ; part au premier contrat qui déclare un logiciel du client |
| EPIC-172 | L'adaptateur Odoo | après février | après février | à décider au déclencheur |  | hors février (spine de Connecteurs AD-32) ; part au premier contrat qui déclare un logiciel du client |
| EPIC-173 | Le connecteur dans l'essai : lire le vrai, n'écrire jamais | après février | après février | à décider au déclencheur |  | hors février (spine de Connecteurs AD-32) ; part au premier contrat qui déclare un logiciel du client |
| EPIC-174 | Relever le logiciel du client et reprendre le relais de la Reprise (FR-17, étapes 1 et 2) | après février | après février | à décider au déclencheur |  | hors février (spine de Connecteurs AD-32) ; part au premier contrat qui déclare un logiciel du client |
| EPIC-175 | La file d'envoi et les refus : rien n'est perdu | après février | après février | à décider au déclencheur |  | hors février (spine de Connecteurs AD-32) ; part au premier contrat qui déclare un logiciel du client |
| EPIC-176 | La concordance de nuit et la file des écarts : l'argent ne se corrige jamais seul (FR-17, ét... | après février | après février | à décider au déclencheur |  | hors février (spine de Connecteurs AD-32) ; part au premier contrat qui déclare un logiciel du client |
| EPIC-177 | Fraîcheur, santé et alertes : Money Vibes le sait d'abord | après février | après février | à décider au déclencheur |  | hors février (spine de Connecteurs AD-32) ; part au premier contrat qui déclare un logiciel du client |
| EPIC-178 | La marche en parallèle, puis l'arrêt de la synchro domaine par domaine | après février | après février | à décider au déclencheur |  | hors février (spine de Connecteurs AD-32) ; part au premier contrat qui déclare un logiciel du client |
| EPIC-179 | Vivre les versions : migrer, revenir, restaurer, désinstaller sans perdre un mouvement | après février | après février | à décider au déclencheur |  | hors février (spine de Connecteurs AD-32) ; part au premier contrat qui déclare un logiciel du client |
| EPIC-180 | Des produits financiers conformes à l'usure | S9 (18/01) | S10 (29/01) | A (écrans B) | ★ |  |
| EPIC-181 | Les clients, les groupes et leur KYC | S9 (18/01) | S10 (29/01) | A (écrans B) | ★ |  |
| EPIC-182 | La lutte contre le blanchiment, tenue à jour | S11 (01/02) | S12 (12/02) | A (écrans B) |  |  |
| EPIC-183 | L'échange avec le cœur de l'IMF | S9 (18/01) | S10 (29/01) | A (écrans B) | ★ |  |
| EPIC-184 | Le cœur fictif et l'IMF de démonstration | S10 (25/01) | S11 (05/02) | A | ★ |  |
| EPIC-185 | Demander un crédit et constituer le dossier | S10 (25/01) | S11 (05/02) | A (écrans B) | ★ |  |
| EPIC-186 | Instruire et décider | S10 (25/01) | S12 (12/02) | A (écrans B) | ★ |  |
| EPIC-187 | Le comité, l'échéancier et le décaissement | S11 (01/02) | S12 (12/02) | A (écrans B) | ★ |  |
| EPIC-188 | Le crédit de groupe, la clôture, le refinancement et le nouveau cycle | S12 (08/02) | S13 (19/02) | A (écrans B) | ★ |  |
| EPIC-189 | Les échéances de prêt dans paiement | S11 (01/02) | S12 (12/02) | A (écrans B) | ★ |  |
| EPIC-190 | L'IA commune v0 : le socle et l'IA du crédit | S10 (25/01) | S12 (12/02) | A (écrans B) | ★ | dépend du socle IA EPIC-245 → 248 (fini le 15/01) |
| EPIC-191 | La collecte terrain et le terrain de l'IMF | S11 (01/02) | S12 (12/02) | A (écrans B) | ★ |  |
| EPIC-192 | La caisse des collecteurs | S12 (08/02) | S13 (19/02) | A (écrans B) |  |  |
| EPIC-193 | Le risque de portefeuille | S11 (01/02) | S12 (12/02) | A (écrans B) | ★ |  |
| EPIC-194 | Le recouvrement de l'IMF | S12 (08/02) | S13 (19/02) | A (écrans B) | ★ |  |
| EPIC-195 | L'IA du suivi : relances, terrain, caisse, risque, conformité, Copilot | S12 (08/02) | S14 (26/02) | A (écrans B) |  | dépend du socle IA EPIC-245 → 248 (fini le 15/01) |
| EPIC-196 | La conformité BCEAO et l'audit | S12 (08/02) | S13 (19/02) | A (écrans B) |  |  |
| EPIC-197 | La reprise du portefeuille de prêts en cours | S13 (15/02) | S14 (26/02) | A (écrans B) |  |  |
| EPIC-198 | Le pilotage de l'IMF : tableaux de bord, rôles, équipes | S12 (08/02) | S13 (19/02) | A (écrans B) | ★ |  |
| EPIC-199 | Marketing, automatisations, support et export des écritures | S12 (08/02) | S14 (26/02) | A (écrans B) |  |  |
| EPIC-200 | L'installation chez l'IMF et les modules cadrés | S10 (25/01) | S13 (19/02) | B (A pour les services) |  | installation chez l'IMF : agent et centrale (B, affectation validée) ; relais, réseau et notification (A) |
| EPIC-201 | Le socle technique : services, migrations et protection des données | S5 (07/12) | S6 (18/12) | A (écrans B) | ★ | `document-service` : Node 24, client Confluent et BullMQ 6 en S5 |
| EPIC-202 | Les rôles, les portées, le réseau et la séparation des tâches | S7 (04/01) | S8 (15/01) | A (écrans B) | ★ |  |
| EPIC-203 | L'échange avec le logiciel de la compagnie | S6 (14/12) | S8 (15/01) | A (écrans B) | ★ |  |
| EPIC-204 | Le logiciel de compagnie fictif, la compagnie de démonstration et la recette de la démo | S7 (04/01) | S8 (15/01) | A (écrans B) | ★ |  |
| EPIC-205 | Le dossier : machine à états, versions et échéances | S7 (04/01) | S9 (22/01) | A (écrans B) | ★ |  |
| EPIC-206 | Déclarer, ouvrir et attribuer | S8 (11/01) | S9 (22/01) | A (écrans B) | ★ |  |
| EPIC-207 | Instruire et chiffrer | S9 (18/01) | S10 (29/01) | A (écrans B) | ★ |  |
| EPIC-208 | Les experts et les missions d'expertise | S10 (25/01) | S11 (05/02) | A (écrans B) | ★ |  |
| EPIC-209 | Décider et offrir | S10 (25/01) | S11 (05/02) | A (écrans B) | ★ |  |
| EPIC-210 | Payer : de l'ordre de règlement à la remise | S11 (01/02) | S12 (12/02) | A (écrans B) | ★ |  |
| EPIC-211 | Clore, sortir et rouvrir | S11 (01/02) | S12 (12/02) | A (écrans B) | ★ |  |
| EPIC-212 | Le recours et la fraude | S12 (08/02) | S13 (19/02) | A (écrans B) | ★ |  |
| EPIC-213 | Retrouver : la recherche unique, la fiche et les réclamations | S11 (01/02) | S12 (12/02) | A (écrans B) | ★ |  |
| EPIC-214 | Les pièces, l'OCR et les archives | S8 (11/01) | S10 (29/01) | A (écrans B) | ★ |  |
| EPIC-215 | Les contrats lus, la provision et les états techniques | S8 (11/01) | S9 (22/01) | A (écrans B) | ★ |  |
| EPIC-216 | Le pilotage et le contrôle interne | S12 (08/02) | S13 (19/02) | A (écrans B) | ★ |  |
| EPIC-217 | L'IA commune : le socle et les usages du chemin de la démo | S10 (25/01) | S11 (05/02) | A (écrans B) | ★ | dépend du socle IA EPIC-245 → 248 (fini le 15/01) |
| EPIC-218 | L'IA avancée : orientation d'expertise, devis, complétude, courriers de refus, recours et gr... | S12 (08/02) | S13 (19/02) | A (écrans B) | ★ | dépend du socle IA EPIC-245 → 248 (fini le 15/01) |
| EPIC-219 | La reprise des archives et la vie en parallèle | S12 (08/02) | S14 (26/02) | A (écrans B) | ★ |  |
| EPIC-220 | Prévenir : notification, relais Money Vibes et portail des cabinets | S10 (25/01) | S12 (12/02) | A (écrans B) | ★ |  |
| EPIC-221 | L'installation, l'exploitation et la mise en service | S10 (25/01) | S14 (26/02) | B (A pour les services) | ★ | affectation validée à B : dépôts de B (agent, centrale, plateforme) ; A pour les services d'assurance |
| EPIC-222 | Le socle technique : cinq services neufs, bibliothèques de la plateforme et règles d'écran | S5 (07/12) | S6 (18/12) | A (écrans B) | ★ |  |
| EPIC-223 | Les rôles, les périmètres, les droits et les données privées | S8 (11/01) | S9 (22/01) | A (écrans B) | ★ |  |
| EPIC-224 | Les séries sans perte, le jeu de répliques et l'exploitation hébergée | S6 (14/12) | S8 (15/01) | A (écrans B) | ★ |  |
| EPIC-225 | Les garde-fous, l'encours, le plafond de crédit et la saga de réservation | S8 (11/01) | S9 (22/01) | A (écrans B) | ★ |  |
| EPIC-226 | Le jeu « Grossiste du Golfe », l'essai du prospect et la recette des deux parcours | S11 (01/02) | S13 (19/02) | A (écrans B) | ★ |  |
| EPIC-227 | Les référentiels : réseau, points de vente, catalogue et stock, les écarts du distributeur | S8 (11/01) | S9 (22/01) | A (écrans B) | ★ |  |
| EPIC-228 | La commande : saisie, validation, bon de livraison et prise de commande sur le terrain | S9 (18/01) | S10 (29/01) | A (écrans B) | ★ |  |
| EPIC-229 | L'entrepôt : préparer, charger, livrer, recevoir et inventorier | S10 (25/01) | S11 (05/02) | A (écrans B) | ★ |  |
| EPIC-230 | La facturation : la facture juste, l'avoir, la proforma et le lien public | S10 (25/01) | S11 (05/02) | A (écrans B) | ★ |  |
| EPIC-231 | La Créance, le crédit du tiers et l'amendement de paiement | S7 (04/01) | S8 (15/01) | A (écrans B) | ★ |  |
| EPIC-232 | Encaisser et prévenir : PI-SPI et FedaPay, lien de paiement, ordres de paiement et WhatsApp | S11 (01/02) | S12 (12/02) | A (écrans B) | ★ |  |
| EPIC-233 | Le terrain : plan de journée, visite, commande, encaissement et remise d'espèces | S10 (25/01) | S11 (05/02) | A (écrans B) | ★ |  |
| EPIC-234 | L'application mobile prospera-terrain : Flutter, hors ligne, appareil perdu | S11 (01/02) | S12 (12/02) | A (écrans B) | ★ |  |
| EPIC-235 | Le recouvrement : dossier, escalade, relance, promesse et blocage du crédit | S11 (01/02) | S12 (12/02) | A (écrans B) | ★ |  |
| EPIC-236 | Le réseau freelance : vente pour le compte, deux prix et étanchéité par construction | S11 (01/02) | S12 (12/02) | A (écrans B) |  |  |
| EPIC-237 | L'approvisionnement et les fournisseurs | S12 (08/02) | S13 (19/02) | A (écrans B) |  |  |
| EPIC-238 | La conquête, les territoires, les objectifs et les quotas | S12 (08/02) | S13 (19/02) | A (écrans B) |  |  |
| EPIC-239 | Les équipes, la performance et le contrôle de gestion | S12 (08/02) | S13 (19/02) | A (écrans B) |  |  |
| EPIC-240 | La croissance : marketing, campagnes et studio réseaux sociaux | S12 (08/02) | S13 (19/02) | A (écrans B) |  |  |
| EPIC-241 | La comptabilité et la finance : encaissements, trésorerie, BFR et décisions de crédit | S12 (08/02) | S13 (19/02) | A (écrans B) |  |  |
| EPIC-242 | Les automatisations | S13 (15/02) | S14 (26/02) | A (écrans B) |  | dépend du socle IA EPIC-245 → 248 (fini le 15/01) |
| EPIC-243 | Le tableau de bord, les indicateurs et la provenance des règles « IA » | S12 (08/02) | S13 (19/02) | A (écrans B) |  | dépend du socle IA EPIC-245 → 248 (fini le 15/01) |
| EPIC-244 | La reprise depuis Sage : fichiers, contrôle chez la cible et bascule | S11 (01/02) | S13 (19/02) | A (écrans B) | ★ |  |
| EPIC-245 | Le socle : prospera-ia-service, le renommage et les deux façons de tourner | S6 (14/12) | S7 (08/01) | A (écrans B) | ★ |  |
| EPIC-246 | Le contrat de proposition, le port unique et le registre de l'IA | S6 (14/12) | S8 (15/01) | A (écrans B) | ★ |  |
| EPIC-247 | Les garde-fous : santé, équité, autonomie interdite, preuves et revue juridique | S7 (04/01) | S8 (15/01) | A (écrans B) | ★ |  |
| EPIC-248 | Le catalogue des capacités, les trois niveaux et les quatre premiers packs | S7 (04/01) | S8 (15/01) | A (écrans B) | ★ |  |
| EPIC-249 | Les capacités du jugement : scores, probabilités, relances, recommandations | S8 (11/01) | S9 (22/01) | A (écrans B) | ★ |  |
| EPIC-250 | Les capacités de lecture : pièces, contrôles de cohérence, anomalies et fraude | S8 (11/01) | S9 (22/01) | A (écrans B) | ★ |  |
| EPIC-251 | Les capacités de langage et de calcul : prévoir, rédiger, résumer, expliquer, simuler, rappr... | S8 (11/01) | S9 (22/01) | A (écrans B) | ★ |  |
| EPIC-252 | Les capacités du terrain, de la segmentation et du coaching | S10 (25/01) | S11 (05/02) | A (écrans B) |  |  |
| EPIC-253 | Le Copilot en texte, en lecture seule, pour les quatre logiciels | S8 (11/01) | S9 (22/01) | A (écrans B) | ★ |  |
| EPIC-254 | Les agents sous mandat et les automatisations par règles | S10 (25/01) | S12 (12/02) | A (écrans B) |  |  |
| EPIC-255 | La passerelle de langage, le modèle ouvert hébergé et llama-server sur l'instance | S8 (11/01) | S11 (05/02) | A (écrans B) |  |  |
| EPIC-256 | La boucle locale et la mesure : écarts, calibration nocturne, « qui avait raison » | S10 (25/01) | S11 (05/02) | A (écrans B) |  |  |
| EPIC-257 | L'export « apprentissage » et le consentement : ce qui sort, et ce qui n'en sort jamais | S11 (01/02) | S12 (12/02) | A (écrans B) |  |  |
| EPIC-258 | La centrale prospera-ia-centrale, la ligne de modèles et le plan de promotion | S12 (08/02) | S13 (19/02) | A (écrans B) |  |  |
| EPIC-259 | Ajouter un secteur ou un pays sans rien perturber, et la voix du pack | S13 (15/02) | S14 (26/02) | A (écrans B) |  |  |
| EPIC-260 | L'exploitation de l'IA, la performance et la recette des parcours | S13 (15/02) | S14 (26/02) | A (écrans B) |  |  |
| EPIC-261 | La feuille de route : « bientôt », « plus tard », « exclu » et l'horizon inscrits au catalog... | S9 (18/01) | S9 (22/01) | A (écrans B) |  |  |
| EPIC-262 | prospera-relais : la boîte aux lettres des instances chez le client (AD-44) | S8 (11/01) | S9 (22/01) | A | ★ | `prospera-relais` (AD-44) : boîte aux lettres des instances chez le client ; avant EPIC-200 et 220 |
| EPIC-263 | Profil d'instance hébergée (AD-43) et migrations Node 24, Confluent, BullMQ 6 | S4 (30/11) | S8 (15/01) | A | ★ | migrations Node 24 / client Confluent / BullMQ 6 (S4-S6) puis profil d'instance hébergée AD-43 (S7-S8, avant EPIC-230) |
| EPIC-264 | Droits à tiret d'auth-service et Mobile Money sortant de paiement | S4 (30/11) | S12 (12/02) | A | ★ | deux parties : format des droits à tiret d'`auth-service` (S4, avant S5) ; Mobile Money sortant de `paiement` (S11-S12, conditionné par les contrats opérateurs) |
| EPIC-265 | Coque `prospera-app` : mécanique (squelette, doublure, état publié, menu, garde, `<Ecriture>`) puis modules d'écran métier | S3 (23/11) | S8 (15/01) | A | ★ | ancien chantier CH-03, numéroté le 2026-11-14 ; écrans métier des épics de novembre par B (§3.3) |

### 7.2 Les chantiers sans identifiant

Il n'en reste aucun. Les trois chantiers de plateforme sont EPIC-262 → 264 ; la coque `prospera-app` (ancien CH-03) est EPIC-265, numérotée le 2026-11-14. Les quatre sont au tableau du §7.1 et au registre.

Déjà faits, donc non placés : la saisie des tables CIMA (barème corporel), les 44 manifestes (PR #441 et #444), les PRD, spines et épics des trois verticales et de l'IA commune.

### 7.3 Les plages du registre non replacées

Arbitrage de l'assembleur : charger le cabinet. EPIC-111 → 120 (`comptabilite-service`, aucune story encore) sont **placés** (§7.1). Les autres plages 106 → 141 ont **toutes leurs stories `done`** au registre : un épic déjà fait ne se replace pas.

| Plage | Contenu | Statut au registre |
|---|---|---|
| EPIC-106 → 109 | Socle multi-référentiel, multi-pays, multi-devise (`balance`, `bilan`, `platform-catalog`, `dossier`) ; EPIC-110 est resté libre, ce n’est pas un épic | FAIT : 12 stories `done` |
| EPIC-121 → 127 | Paquet comptable des SFD (portefeuille de crédits, prudentiel BCEAO), **non installé chez l’IMF** (décision du PO, PRD microfinance A11) | FAIT : 15 stories `done` ; motif de la mise après février si un reste apparaît |
| EPIC-128 → 134 | Comptabilité CIMA de `prospera-assurance-service`, **interrupteur `compta-cima` éteint chez la compagnie** (spine de l’assurance, AD-3) | FAIT : 17 stories `done` ; motif de la mise après février si un reste apparaît |
| EPIC-135 → 136 | Immobilisations et amortissements ; multi-société et périmètre de groupe | FAIT : 6 stories `done` |
| EPIC-137 → 141 | Consolidation SYSCOHADA, niveau 3 | FAIT : 15 stories `done` |

Si un reste apparaît dans EPIC-121 → 134, il va **après février**, avec le motif : le paquet comptable des SFD n'est pas installé chez l'IMF (PRD microfinance A11), et la comptabilité CIMA de `prospera-assurance-service` reste derrière l'interrupteur `compta-cima`, éteint chez la compagnie (spine de l'assurance, AD-3).

### 7.4 Contrôle par script

Le tableau du §7.1 a été vérifié par script contre le registre (`sprint-status.yaml` de cette branche, plages `reserved_ranges` y compris EPIC-262 → 264, plus la plage EPIC-245 → 261 de la branche de l'IA commune), le paiement (036, 038, 042) et la notification (063, 064) : **chaque épic ouvert du registre apparaît une fois et une seule**. Les plages entièrement `done` (106 → 109, 121 → 141) et EPIC-110 (resté libre) sont exclues du contrôle. Le même script a vérifié : zéro collision de dépôt ; aucune dépendance citée dans les sources qui commence après son épic, hors les dix couples expliqués au §3.3 ; la cohérence des fenêtres du plan du moteur et de celui de la Reprise.
