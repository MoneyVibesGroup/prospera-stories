# Validation Report — PRD — Moteur d'installation (platform-catalog-service)

- **PRD:** `C:/Users/thier/AppData/Local/Temp/claude/9bbf1c22b9374251/0ae42633-f0a2-4ec7-a361-b981128c3d88/scratchpad/wt/stories/prds/prd-moteur-installation-2026-11-09/prd.md`
- **Rubric:** `C:/Users/thier/AppData/Local/Temp/claude/9bbf1c22b9374251/0ae42633-f0a2-4ec7-a361-b981128c3d88/scratchpad/wt/stories/prds/prd-moteur-installation-2026-11-09/review-rubric.md`
- **Run at:** 2026-11-10T02:31:30+00:00
- **Grade:** Poor (Insuffisant) — au moins un constat critical (8 au total, dont un dans la grille)

## Overall verdict

La partie A (FR-1 → FR-7) est la meilleure partie que ce chantier ait produite : chaque exigence porte un message d'écran, un code de refus et un test, et le journal du PO y est retranscrit fidèlement, valeurs comprises (signal hebdomadaire, grâce 30 j, préavis 30 j, report unique de 7 j). Ce qui est en danger, c'est son premier consommateur. Le PRD introduit « installé (essai) ≠ en service (réel) » sans dire comment cela se lit dans l'entitlement `ACTIVE` du contrat de module, ni ce que le menu de la coque doit montrer. Il ne réconcilie pas non plus ses règles avec ce qui tourne déjà sur `dev` : STORY-727 ouvre les modules dès le paiement et donne le pack du vertical à toute organisation créée. Enfin, §8 déclare « aucune question ouverte » alors que trois contradictions internes (retour arrière, connecteurs depuis l'essai, sens de « pack ») et l'absence de découpage 15/01 / février / plus tard restent entières.

Les deux relecteurs supplémentaires durcissent ce tableau. La revue adversariale (43 constats, dont 6 critical) montre que le PRD n'a **aucun modèle d'états** : les horloges (essai, préavis, grâce, gel, retour arrière, 72 h, vagues) et les états (installé, en service, en attente, bloqué, suspendu, révoqué, gelé, figé) ne sont jamais croisés ; elle ouvre aussi deux failles de sûreté que la grille n'avait pas vues (horloge locale manipulable hors ligne, licence ancienne rejouable) et rend critical le connecteur qui écrit depuis l'essai dans le système de référence du client. La revue de cohérence (29 constats, dont 1 critical) confronte le PRD au contrat, au plan v3 et au code de `origin/dev` : le moteur ne dit pas **ce qu'il publie pour la coque** (spine due le 20/11), oublie les **droits de tenant** que le contrat et le plan lui confient (STORY-365, semaine 5), contredit D3 et Q4, et décrit des chemins d'installation que le code dément (octroi par vertical de STORY-727 lot 7).

Une fois dédoublonnés, les 97 constats se ramènent à 30 thèmes (5 critical, 20 high, 5 medium), détaillés dans `validation-report.md`, section « Constats consolidés ». Quatre thèmes bloquent la spine de `prospera-app` (états et contrat de lecture, droits de tenant et lieu des écrans client, sens de « pack », habillage) ; treize demandent un arbitrage du PO avant la validation du 13/11.

## Constats consolidés (dédoublonnés)

Les trois revues se recoupent largement : les 97 constats d'origine (25 de la grille, 43 adversariaux, 29 de cohérence) sont regroupés ici en **30 thèmes**, ordonnés par gravité. Chaque constat d'origine figure dans au moins un thème. La sévérité d'un thème est la plus haute de ses constats d'origine.

Identifiants : **G-xx** = constats de la grille `review-rubric.md` (numérotés ici G-01 → G-25 dans l'ordre de la grille, qui ne les numérote pas) ; **F-xx** = `review-adversarial-general.md` ; **R-xx** = `review-coherence-contrat.md`.

Étiquettes : `bloque-coque` = l'architecture de `prospera-app` ne peut pas avancer sans ; `decision-PO` = demande un arbitrage du PO, pas une simple réécriture ; `reecriture` = correction rédactionnelle sans arbitrage.

**Décompte :** 5 critical · 20 high · 5 medium · 0 low — 4 `bloque-coque` · 13 `decision-PO` · 13 `reecriture`.

| Thème | Sévérité | Étiquette | Titre |
|---|---|---|---|
| T-01 | critical | `bloque-coque` | Aucun modèle d'états, aucun contrat de lecture pour la coque |
| T-02 | critical | `decision-PO` | Connecteurs et sorties tierces depuis l'espace d'essai |
| T-03 | critical | `decision-PO` | Retour arrière « sans perte » contre migration irréversible |
| T-04 | critical | `reecriture` | Horloge locale manipulable, licence rejouable, clés sans cycle de vie |
| T-05 | critical | `decision-PO` | AD-P16 et les accès Money Vibes court-circuitent le consentement |
| T-06 | high | `decision-PO` | STORY-727 (déjà sur `dev`) et chemins d'installation réels |
| T-07 | high | `bloque-coque` | Droits de tenant absents, écrans côté client sans lieu |
| T-08 | high | `decision-PO` | Jalons 15/01 / février / plus tard, D3 révisée non actée, SM-1 infaisable |
| T-09 | high | `bloque-coque` | « Pack » à deux sens ; correspondance module commercial ↔ code ↔ menu |
| T-10 | high | `decision-PO` | Obligations nouvelles pour chaque module, hors contrat |
| T-11 | high | `reecriture` | Feu vert de la Reprise sans consommateur |
| T-12 | high | `decision-PO` | Essai → réel : non-copie contre réglages gardés ; rafraîchissement destructeur |
| T-13 | high | `decision-PO` | Plateforme mutualisée contre « le DSI choisit la date » |
| T-14 | high | `decision-PO` | Effacement automatique de l'essai et chronologie du prospect |
| T-15 | high | `decision-PO` | Droit d'utiliser échu : « suspension » contre C2 et STORY-727 lot 4 |
| T-16 | high | `decision-PO` | Gel : un mot pour deux états ; le gel de fin de maintenance bloque l'achat |
| T-17 | high | `decision-PO` | Fenêtre N/N-1 et version de plateforme |
| T-18 | high | `decision-PO` | Contrat ↔ licence ↔ dépendances : aucune règle de cohérence |
| T-19 | high | `reecriture` | Périmètre auto-contradictoire et §8 « aucune question ouverte » |
| T-20 | high | `reecriture` | Correctifs de sécurité : 72 h contre vagues, gel et retour arrière |
| T-21 | high | `reecriture` | Sauvegardes, installation interrompue, NFR transverses manquantes |
| T-22 | high | `reecriture` | Moteur réparti : parties B et C hors `platform-catalog-service` |
| T-23 | high | `reecriture` | Canal de données : pseudonymisation, schéma du signal, registre, retrait |
| T-24 | high | `reecriture` | Désinstallation : copies voisines, essai, export, réinstallation |
| T-25 | high | `reecriture` | Calibration IA : « empreinte identique » contre « recalibré localement » |
| T-26 | medium | `reecriture` | Sémantique des dépendances : comptage, 🟠 contre Q3, cycles |
| T-27 | medium | `reecriture` | Mise en service partielle, critères de vérification, « Réessayer » |
| T-28 | medium | `reecriture` | Indicateurs : pari central non mesuré, SM sans source, NFR-5 sans conditions |
| T-29 | medium | `bloque-coque` | Habillage et configuration d'accueil par organisation |
| T-30 | medium | `reecriture` | Parcours et dérive de vocabulaire |

### T-01 · critical · `bloque-coque` — Aucun modèle d'états, aucun contrat de lecture pour la coque

- **Sévérité max :** critical
- **Origine :** G-18 (critical), F-01 (critical), R-20 (critical), R-02 (high), R-21 (high), R-24 (medium)
- **Touche :** §3 (Installer, Mettre en service, Gel, Préavis), FR-5, FR-7, FR-8, FR-9, FR-11, FR-13, FR-14, FR-15, FR-32, §7 C5/C8
- **Écart :** Le PRD empile trois axes d'état (module × organisation × espace ; client ; instance) et des horloges sans table de transitions ni projection sur l'entitlement `ACTIVE` d'AD-P17/C8. La coque ne sait donc ni quel état lire, ni par quel canal, ni ce que le menu montre (un module 🟢 en essai, pas encore en service, est-il au menu du réel ?), ni dans quel espace elle tourne, ni comment une licence sur site devient un entitlement. La spine de `prospera-app` est due le 20/11 et sa première décision porte sur le menu.
- **Correction suggérée :** Une section « États et transitions » : par axe, les états, transitions, déclencheurs et traces ; la matrice des combinaisons. Puis une FR « Ce que le moteur publie pour la coque » : état effectif unique par module dans une énumération fermée (ex. `EN_SERVICE`, `EN_ATTENTE`, `BLOQUE`, `ESSAI_PROSPECT{finLe}`, `PREAVIS{finLe}`, `LECTURE_SEULE`, `SUSPENDU`, `NON_INSTALLE`) → statut d'entitlement → visibilité au menu → refus de la gate ; état de l'instance (espace, gel, fin de maintenance) ; canal (topic versionné + route) ; projection licence → entitlements (source `licence`) ; espace = propriété de l'instance déployée, deux URL.
- **Étiquette :** `bloque-coque`

### T-02 · critical · `decision-PO` — Connecteurs et sorties tierces depuis l'espace d'essai

- **Sévérité max :** critical
- **Origine :** F-08 (critical), G-07 (high)
- **Touche :** FR-8, FR-9, UJ-3 ; PRD Connecteurs
- **Écart :** FR-8 met les connecteurs dans la répétition générale, et FR-9 n'intercepte qu'une liste de canaux (SMS, WhatsApp, e-mail, liens de paiement). Un connecteur bidirectionnel branché depuis l'essai écrira des décaissements fictifs dans le core-banking de l'IMF ou l'Odoo du distributeur, c'est-à-dire dans le système de référence. Le PRD Connecteurs ne parle jamais d'espace d'essai.
- **Correction suggérée :** Trancher : depuis l'essai, un connecteur est en lecture seule, ou pointe vers un bac à sable déclaré du logiciel client. Étendre FR-9 à « toute sortie vers un système tiers » avec refus serveur nommé, et porter la même règle dans le PRD Connecteurs.
- **Étiquette :** `decision-PO`

### T-03 · critical · `decision-PO` — Retour arrière « sans perte » contre migration irréversible

- **Sévérité max :** critical
- **Origine :** F-02 (critical), G-06 (high)
- **Touche :** FR-18, §1 (promesse « en un clic, sans rien perdre »), contrat de module C1/C5
- **Écart :** Restaurer la sauvegarde exigée pour une migration irréversible efface les sept jours de saisie que FR-18 promet de conserver. Même avec une migration réversible, la version N doit relire les données et les topics écrits par N+1 : c'est une obligation de chaque module, que le contrat ne porte pas.
- **Correction suggérée :** Choisir : (a) clause de module « étendre puis contracter » sur 7 jours, testable (promouvoir, saisir, revenir, tout est lisible), écrite au contrat ; ou (b) une version à migration irréversible n'offre pas de retour arrière sans perte, et le DSI le voit avant de choisir la date. Retirer « sans perte » partout où ce n'est pas garanti.
- **Étiquette :** `decision-PO`

### T-04 · critical · `reecriture` — Horloge locale manipulable, licence rejouable, clés sans cycle de vie

- **Sévérité max :** critical
- **Origine :** F-16 (critical), F-17 (critical), G-08 (high, volet clés)
- **Touche :** FR-14, FR-15, FR-18, FR-19, FR-22, FR-32, FR-33, NFR-1
- **Écart :** Hors ligne, toutes les échéances (droit d'utiliser, préavis, essai, grâce, retour arrière) lisent l'horloge du serveur du client : la reculer les prolonge à l'infini. Une licence ancienne mais authentique se redépose pour lever une suspension. Rotation, expiration et compromission de la clé de signature ne sont pas traitées, alors qu'une licence perpétuelle doit rester vérifiable à vie.
- **Correction suggérée :** Horloge monotone signée côté instance (date antérieure ⇒ état « horloge incohérente » et gel) ; pour chaque délai, l'horloge de référence et l'événement de départ ; licence à `numero` croissant, refus `LICENCE_ANTERIEURE` ; NFR « cycle de vie des clés » (chaîne de confiance, rotation compatible avec les perpétuelles, révocation par paquet signé). Tests : reculer la date, redéposer une ancienne licence.
- **Étiquette :** `reecriture`

### T-05 · critical · `decision-PO` — AD-P16 et les accès Money Vibes court-circuitent le consentement

- **Sévérité max :** critical
- **Origine :** F-25 (critical), G-21 (high), F-37 (high), R-18 (medium)
- **Touche :** §4.C, FR-10, FR-13, FR-17, FR-22, FR-23, FR-26 → FR-30, SM-4 ; AD-P16
- **Écart :** La partie 4.C ne garde que ce qui « sort » d'une instance. Sur la plateforme, Money Vibes lit déjà la base (AD-P16) et rien ne sort : le registre des consentements n'y garde aucune porte, SM-4 y est invérifiable. Sur site, la recette jouée par Money Vibes dans un essai rafraîchi depuis le réel, et les comptes de Rachid et Yao sur la console de l'instance, sont des accès non encadrés. La tension relevée au journal n'est pas tranchée.
- **Correction suggérée :** Décider la portée d'AD-P16 (lecture d'exploitation ≠ apprentissage ; sur site, seulement en session de support ouverte par le client) ; faire du registre une garde technique sur la plateforme aussi ; dire si la recette est automatique ou passe par le tunnel de niveau 2 ; exigence « Identités sur site » (comptes Money Vibes désactivés par défaut, activés pour une durée bornée, journalisés).
- **Étiquette :** `decision-PO`

### T-06 · high · `decision-PO` — STORY-727 (déjà sur `dev`) et chemins d'installation réels

- **Sévérité max :** high
- **Origine :** G-13 (high), R-27 (high), F-04 (high), F-15 (medium)
- **Touche :** FR-4, FR-8, FR-11, FR-12, FR-14, SM-1, SM-3
- **Écart :** Le code a quatre chemins qui ne sont pas ceux du PRD : octroi d'opérateur, échéance soldée qui ouvre les modules (727 lot 2), propagation des packs (lot 6), et octroi par vertical sans contrat ni terme dès la création de l'organisation (lot 7). FR-11 (« aucune commande n'installe directement dans le réel »), FR-12 (`MODULE_NON_SOUSCRIT`) et SM-1 (« organisation vierge ») sont faux sur `dev`. Les changements de droits (suspension, révocation, licence) contournent aussi l'essai, ce qui rend SM-3 faux dès le premier impayé.
- **Correction suggérée :** Lister les cinq chemins (les quatre existants et la licence) : installe ou rend installable, passe ou non par l'essai, soumis ou non à `MODULE_NON_SOUSCRIT`. Trancher : 727 est repris (payé ⇒ souscrit, plus `ACTIVE`) ou devient une exception nommée (vertical, opérateur, organisation Money Vibes). Classer les changements (code/schéma ⇒ essai ; droits ⇒ directs, journalisés, hors SM-3). Test de mutation de FR-4 sur tous les chemins.
- **Étiquette :** `decision-PO`

### T-07 · high · `bloque-coque` — Droits de tenant absents, écrans côté client sans lieu

- **Sévérité max :** high
- **Origine :** R-01 (high), G-20 (high), R-22 (high), R-16 (medium), R-06 (medium, volets C7/C8), R-26 (low)
- **Touche :** FR-17, FR-18, FR-19, FR-22, FR-23, FR-27, FR-32, FR-33, §7 C7/C8 ; plan §5 (STORY-365), D1
- **Écart :** Le contrat §7 et le plan (semaine 5, STORY-365, première story de code de Dev B) confient au moteur la lecture des droits depuis les manifestes et leur filtrage par modules installés ; aucune FR ne le porte. Les écrans du DSI, du DG, du prospect et de l'abonné échu sont placés dans la console Money Vibes (CRM interne), ce qui force des rôles plateforme pour des utilisateurs du client ; `prospera-app` n'est jamais cité. Le §7 C7 ne crée qu'un droit client, et la visibilité des bandeaux n'a pas de droit associé.
- **Correction suggérée :** FR « Les droits suivent l'installation » (attribuables sans déploiement ; droits effectifs = attribués ∩ modules installés ; STORY-365 requalifiée contre 166/167). Partager C8 : console Money Vibes (offre, installation, bilan, supervision, licences) / `prospera-app` « Administration de mon instance » (mises à jour, retour arrière, fichier, tunnel, consentements, export, essai, import en libre-service), chaque écran avec son droit `<module>:<objet>:<action>` et chaque bandeau avec son public.
- **Étiquette :** `bloque-coque`

### T-08 · high · `decision-PO` — Jalons 15/01 / février / plus tard, D3 révisée non actée, SM-1 infaisable

- **Sévérité max :** high
- **Origine :** G-01 (high), G-15 (high), R-09 (high), F-31 (high), F-39 (medium), G-05 (low)
- **Touche :** §0, §1, §4 (toutes FR), SM-1, FR-20, FR-29, FR-30, FR-31 ; plan §5/§8 (D3), contrat §9, AD-P17
- **Écart :** Le PRD vise la démo du 15/01 et deux clients en février sans dire quelles FR chaque jalon exige ; FR-20, FR-29 et FR-30/31 n'ont pas de sens en février. La partie B applique D3 révisée (prête avant février 2027) sans la citer, alors que le plan, le contrat §9 et AD-P17 disent encore le contraire et ne donnent qu'une semaine au moteur. SM-1 (« en une action, organisation vierge, bilan tout vert ») est impossible sans tricher sur FR-6.
- **Correction suggérée :** Une table FR × {15/01, février, plus tard} validée par le PO ; acter D3 révisée au §0 et faire amender plan §8, contrat §9 et AD-P17 avec la charge de Dev B et l'ordre de sacrifice ; réécrire SM-1 « en une action dans l'essai, sans 🔴 hors prérequis externes, avec prérequis de démonstration déclarés ».
- **Étiquette :** `decision-PO`

### T-09 · high · `bloque-coque` — « Pack » à deux sens ; correspondance module commercial ↔ code ↔ menu

- **Sévérité max :** high
- **Origine :** G-19 (high), R-14 (high), R-25 (medium), R-12 (medium)
- **Touche :** §3, §4.A, FR-1, QA-1, SM-1, NFR-5 ; PRD Connecteurs FR-3 ; contrat C1/C8, Q1
- **Écart :** Le §3 et le code (`VerticalPack`, `packs.seed-data.ts`, octroi par vertical 727) font du pack un pack de vertical de 7 codes ; le §4.A et QA-1 en font quatre bouquets commerciaux sur 18 modules qui n'existent pas au catalogue, dont beaucoup n'ont ni service ni dépôt pour leur manifeste. SM-1 et NFR-5 deviennent ambigus, et la coque ne sait pas si son menu se construit par code ou par module commercial.
- **Correction suggérée :** Deux termes (« pack » = `VerticalPack`, « bouquet » pour les sous-ensembles commerciaux, ou l'inverse avec migration du seed) ; une table bouquet → module commercial → codes catalogue → dossier d'écran / libellé de menu ; menu construit par code ; manifeste d'un module sans service tenu au catalogue en « non octroyable » ; préciser SM-1/NFR-5 et reporter dans Connecteurs.
- **Étiquette :** `bloque-coque`

### T-10 · high · `decision-PO` — Obligations nouvelles pour chaque module, hors contrat

- **Sévérité max :** high
- **Origine :** R-04 (high), R-07 (medium), R-06 (medium, volets C1/C4/C5), R-08 (low)
- **Touche :** FR-2, FR-4, FR-5, FR-6, FR-9, FR-10, FR-16, FR-26, §7 C1/C4/C5/C10 ; contrat §6
- **Écart :** Prérequis, vérifications chiffrées, santé, interception des envois en essai, export/import par organisation, indicateurs IA de niveau 0, effacement par organisation : le PRD impose tout cela à chaque module, mais aucune des onze lignes du contrat ne le porte, donc les PRD des lots 2 à 4 l'ignoreront. La publication du manifeste au catalogue (Q1, garde de comparaison, `MANIFESTE_CYCLE`) et la nouvelle forme de `depends` ne sont décrites nulle part.
- **Correction suggérée :** Faire amender le contrat par le PO : clause C12 « installable sous contrôle » (ou extension de C1/C10) ; FR « Publier le manifeste d'une version » ; exemple C1 en `depends: [{ code, raison }]` ; compléter le propre manifeste du moteur et les topics consommés au §7 C5.
- **Étiquette :** `decision-PO`

### T-11 · high · `reecriture` — Feu vert de la Reprise sans consommateur

- **Sévérité max :** high
- **Origine :** G-14 (high), R-15 (medium)
- **Touche :** §3, FR-6, FR-7, FR-8, §7 C5 ; PRD Reprise FR-3/FR-15
- **Écart :** Le PRD Reprise dit que le moteur ne peut pas mettre en service sans feu vert ; côté moteur, FR-6 ne lit qu'un comptage et FR-8 ne pose aucune condition. C5 ne cite pas le fait consommé, et la « réception définitive » qui déclenche la suppression des fichiers chez la Reprise n'est définie nulle part.
- **Correction suggérée :** Dans FR-8 : mise en service refusée sans feu vert (code nommé) ; FR-7 : ligne Reprise 🟢 seulement au feu vert du lot rejoué dans le réel ; §7 C5 « consomme : `reprise.feu-vert` » ; définir « réception définitive » au §3.
- **Étiquette :** `reecriture`

### T-12 · high · `decision-PO` — Essai → réel : non-copie contre réglages gardés ; rafraîchissement destructeur

- **Sévérité max :** high
- **Origine :** F-06 (high), F-07 (high), R-17 (medium), note mécanique « à frais »
- **Touche :** FR-8, FR-10, FR-33, NFR-3
- **Écart :** FR-8 et NFR-3 interdisent toute copie essai → réel, mais FR-33 garde tables de correspondance, rôles, zones et calibration du prospect, qui doivent bien passer dans le réel. Le rafraîchissement obligatoire avant une majeure écrase, sur la plateforme partagée, les essais prospects et les répétitions des autres clients, et copie des données personnelles réelles dans un espace moins gardé.
- **Correction suggérée :** Un objet nommé, versionné et journalisé — la recette d'installation (offre, tables, rôles, zones, réglages) — exporté de l'essai et rejoué par le contrat de chaque module propriétaire ; NFR-3 nomme ce seul flux. Trancher la calibration du prospect (recalculée sur la reprise fraîche, recommandé). Rafraîchissement par organisation, hors essais prospects, bloqué si une répétition est en cours, avec règle d'accès et de masquage. Corriger « à frais ».
- **Étiquette :** `decision-PO`

### T-13 · high · `decision-PO` — Plateforme mutualisée contre « le DSI choisit la date »

- **Sévérité max :** high
- **Origine :** F-09 (high)
- **Touche :** FR-13, FR-17, FR-18, FR-20, §4.B
- **Écart :** Sur la plateforme Money Vibes, une instance multi-organisations n'a qu'une ligne de version et un essai commun : on ne promeut pas N+1 pour un distributeur seul, on ne revient pas en arrière pour un seul client. FR-13 promet pourtant les « mêmes étapes » qu'au site.
- **Correction suggérée :** Deux variantes de FR-17/18/20 : sur site (date du DSI, retour arrière par instance) ; plateforme (fenêtre fixée par Money Vibes, préavis aux organisations, retour arrière global). Restreindre FR-13 à ce qui est vraiment identique.
- **Étiquette :** `decision-PO`

### T-14 · high · `decision-PO` — Effacement automatique de l'essai et chronologie du prospect

- **Sévérité max :** high
- **Origine :** F-22 (high), R-10 (high), F-21 (high), G-17 (medium)
- **Touche :** §3 « Effacer », FR-33 ; contrat Q4, C3
- **Écart :** FR-33 efface tout 30 jours après un essai non signé, alors que le §3 met l'effacement « hors de ce PRD » et que Q4 garde les données jusqu'à une demande. Personne n'exécute l'effacement dans chaque module, son périmètre (sauvegardes, journaux, read-models, calibration) et sa preuve sont absents. La chronologie de l'essai (export après fin, prolongation, signature tardive, rappels, J0) est floue.
- **Correction suggérée :** Faire acter par le PO que la non-signature vaut demande d'effacement (exception écrite à Q4) ou un effacement « proposé » ; contrat d'effacement par organisation dans chaque module (voir T-10) ; périmètre et certificat ; une chronologie J0 → rappels → fin → fenêtre d'export → signature tardive → effacement → preuve.
- **Étiquette :** `decision-PO`

### T-15 · high · `decision-PO` — Droit d'utiliser échu : « suspension » contre C2 et STORY-727 lot 4

- **Sévérité max :** high
- **Origine :** R-03 (high), G-24 (medium), F-23 (medium), note mécanique « Suspension » à deux comportements
- **Touche :** §3 « Préavis », FR-32 ; contrat C2 ; STORY-280, STORY-727 lot 4
- **Écart :** FR-32 appelle « suspension (consulter et exporter) » ce que le code appelle « échu » (lecture seule, `ABONNEMENT_EXPIRE`, immédiat), cite STORY-280 qui ferme tout (`SUSPENDED`), et ajoute 30 jours de préavis que le code n'a pas. « Préavis » désigne déjà l'avis émis 7 jours avant l'échéance. Le mode lui-même n'est pas spécifié (encaissement, connecteurs, états BCEAO, correctifs).
- **Correction suggérée :** Décider si les 30 jours décalent l'échéance ou ajoutent un état « en préavis » ; renommer « expiré (lecture seule) » et citer 727 lot 4 ; renommer l'un des deux préavis ; une exigence « Mode lecture seule » par catégorie d'action et un format d'export minimal ; signaler au contrat que C2 doit distinguer expiré et `SUSPENDED`/`REVOKED`.
- **Étiquette :** `decision-PO`

### T-16 · high · `decision-PO` — Gel : un mot pour deux états ; le gel de fin de maintenance bloque l'achat

- **Sévérité max :** high
- **Origine :** F-18 (high), G-03 (medium), F-41 (low), F-42 (low)
- **Touche :** §3 « Gel », FR-14, FR-15, FR-16, FR-32
- **Écart :** Gel de silence (levé au retour du signal) et gel de fin de maintenance (levé par paiement) partagent un mot : un client figé qui coupe son signal déclenche à vie les alertes, et son retour « lève le gel » d'après FR-15. Un client figé ne peut plus acheter de module. « Contact » n'est pas défini, et J+7 avec un battement hebdomadaire produit des faux positifs.
- **Correction suggérée :** Deux termes (gel / version figée) avec entrée, sortie, alertes ; trancher si un ajout de module rouvre la maintenance ou reste permis en version figée ; définir « contact » ; alerte à deux signaux manqués et retente.
- **Étiquette :** `decision-PO`

### T-17 · high · `decision-PO` — Fenêtre N/N-1 et version de plateforme

- **Sévérité max :** high
- **Origine :** F-19 (high), G-23 (medium), R-28 (medium)
- **Touche :** FR-17, FR-21, FR-32, §3 « une seule ligne de version »
- **Écart :** « Plus de deux majeures en retard » contredit N/N-1 ; `fenetre-de-support.ts` règle la publication des versions d'un module, pas le retard d'une instance ; `Entitlement.versionCode` épingle une version par organisation, alors que le §3 parle d'une ligne de plateforme. Rien ne dit ce qui arrive hors fenêtre, ni ce qui force une instance maintenue dont le DSI ne choisit jamais de date.
- **Correction suggérée :** Fixer N-1 au plus (règle nouvelle reprenant le principe) ; version de plateforme = ensemble figé de `versionCode` ; hors fenêtre = fin du support contractuel avec escalade au DG, exemption des instances figées ; décider si une promotion forcée existe (seconde exception nommée à FR-17).
- **Étiquette :** `decision-PO`

### T-18 · high · `decision-PO` — Contrat ↔ licence ↔ dépendances : aucune règle de cohérence

- **Sévérité max :** high
- **Origine :** F-10 (high), F-11 (high), F-24 (medium), F-43 (low), note mécanique « codes de refus voisins »
- **Touche :** FR-2, FR-4, FR-7, FR-12, FR-13, FR-14, FR-17, FR-21 ; contrat Q5
- **Écart :** Un contrat vendu sans sa dépendance fait se contredire FR-2 (ajoute) et FR-12 (refuse). Une version N+1 qui ajoute une dépendance non souscrite bloque la mise à jour ou installe hors contrat. Sur site, contrat et licence peuvent diverger sans règle de préséance, « sans autre action » est faux, et l'ordre des refus (`MODULE_NON_SOUSCRIT`, `MODULE_HORS_LICENCE`, `MODULE_DEPENDANCE_MANQUANTE`) n'est pas fixé.
- **Correction suggérée :** Même résolution de dépendances à la vente (727) et à l'émission de licence ; licence dérivée du contrat par émission automatique (contrat fait foi sur la plateforme, licence sur site) ; écart de dépendances calculé avant chaque mise à jour, interdit pour une mineure ; ordre d'évaluation des refus fixé (ou toutes les causes renvoyées).
- **Étiquette :** `decision-PO`

### T-19 · high · `reecriture` — Périmètre auto-contradictoire et §8 « aucune question ouverte »

- **Sévérité max :** high
- **Origine :** F-36 (high), G-02 (medium), G-16 (medium), R-13 (medium), R-29 (low), note mécanique « bandeau périmé »
- **Touche :** en-tête (l. 16), §0, §2.2, §8, FR-33, QA-3
- **Écart :** §2.2 exclut le libre-service alors que FR-33 et le PRD Reprise le prévoient en février ; §0 met Connecteurs « plus tard » contre QA-3 ; l'en-tête dit que §4 n'existe pas ; §8 déclare « aucune question ouverte » alors que les thèmes decision-PO ci-dessus le sont. C'est la première chose que le PO lira vendredi.
- **Correction suggérée :** Aligner §0 et §2.2 (installation faite par Money Vibes, y compris l'offre d'essai ; usage, import et essai en libre-service dès février) ; supprimer l'en-tête périmé ; remplacer le §8 par la liste des thèmes decision-PO en `[NOTE FOR PM]`, avec propriétaire et date.
- **Étiquette :** `reecriture`

### T-20 · high · `reecriture` — Correctifs de sécurité : 72 h contre vagues, gel et retour arrière

- **Sévérité max :** high
- **Origine :** F-20 (high), G-11 (low)
- **Touche :** FR-15, FR-18, FR-19, FR-20
- **Écart :** Un correctif soumis aux vagues de 7 jours ne peut pas tenir 72 h ; une instance gelée ne peut pas l'appliquer ; le report porte le délai réel à 72 h + 7 j. « Sans incident » n'est pas défini, et le DSI pourrait revenir en arrière d'un correctif qu'il n'avait pas le droit de refuser.
- **Correction suggérée :** Exempter les correctifs de sécurité des vagues ; le gel n'empêche pas un correctif par fichier ; échéance « 72 h, ou 72 h + report » ; définir « incident » ; encadrer le retour arrière d'un correctif de sécurité.
- **Étiquette :** `reecriture`

### T-21 · high · `reecriture` — Sauvegardes, installation interrompue, NFR transverses manquantes

- **Sévérité max :** high
- **Origine :** F-03 (high), G-08 (high, volet sauvegardes), F-38 (medium)
- **Touche :** FR-4, FR-17, FR-18, FR-25, §5 (NFR-1 → NFR-6), NFR-6
- **Écart :** Rien ne dit ce qui reste quand une installation de 18 modules ou une promotion meurt à mi-chemin (coupure électrique). Les sauvegardes, dont dépendent retour arrière et calibration, n'ont ni fréquence, ni rétention, ni lieu hors du serveur, ni perte acceptable ; l'interruption tolérée pendant une promotion et la capacité minimale du serveur client manquent.
- **Correction suggérée :** Installation = plan persistant reprenable, bilan « interrompue à l'étape X », promotion interrompue ⇒ retour arrière automatique, test de chaos ; NFR-7 sauvegarde chiffrée (RPO/RTO, emplacement hors serveur, test de restauration), NFR-8 interruption maximale par promotion, NFR-9 configuration minimale d'un serveur client.
- **Étiquette :** `reecriture`

### T-22 · high · `reecriture` — Moteur réparti : parties B et C hors `platform-catalog-service`

- **Sévérité max :** high
- **Origine :** R-05 (high), G-22 (medium)
- **Touche :** frontmatter `service`, §7 C3, C10
- **Écart :** Émission de licences, distribution de paquets, supervision, agent d'instance (signal, promotion, retour arrière), registre des consentements : autant d'agrégats et de lieux d'exécution distincts, alors que le contrat §4 pose « un agrégat distinct, c'est un service distinct ». Un retour arrière ne peut pas être exécuté par le service qu'il remplace. Le PRD fige ce que les PRD frères laissent à la spine.
- **Correction suggérée :** « Partie A dans `platform-catalog-service` ; parties B et C : services à trancher dans la spine » (ou `[ASSUMPTION]`) ; ajuster C3 et C10 (agent d'instance dans le socle, hors `docker compose` des modules).
- **Étiquette :** `reecriture`

### T-23 · high · `reecriture` — Canal de données : pseudonymisation, schéma du signal, registre, retrait

- **Sévérité max :** high
- **Origine :** F-26 (high), G-10 (medium), F-27 (medium), F-28 (medium), F-29 (medium)
- **Touche :** FR-26, FR-27, FR-28, FR-29, FR-30, §7 C7
- **Écart :** « Pseudonymisé » n'est ni défini ni suffisant (réidentifiable par recoupement, champs libres, pièces jointes) ; « un test vérifie chaque envoi » est irréalisable sur un flux libre ; le registre n'a ni lieu ni garde contre un administrateur local, et le droit de consentir n'est pas réservé au DG ; FR-29 n'a pas de conséquence vérifiable ; le retrait ne purge rien chez Money Vibes.
- **Correction suggérée :** Transformation définie (champs supprimés, hachés avec sel sur l'instance, généralisés ; champs libres exclus ; seuil de k-anonymat ; test qui rougit sur un champ non déclaré) ; schéma fermé du signal ; consentement signé et contresigné, droit attribuable par le DG seul ; FR-29 journalisée sans transfert de fichier ; purge et durée de conservation des contributions ; validation juridique en prérequis daté.
- **Étiquette :** `reecriture`

### T-24 · high · `reecriture` — Désinstallation : copies voisines, essai, export, réinstallation

- **Sévérité max :** high
- **Origine :** F-05 (high), F-40 (low)
- **Touche :** §3 « Désinstaller » / « Suspendre », FR-3, FR-21 ; contrat C3, C4, C9, Q2/Q3
- **Écart :** Le PRD ne traite que les données du module désinstallé : rien sur les read-models des voisins, l'essai, la calibration, l'export des données d'un module révoqué sur site, ni la réinstallation après plusieurs majeures. Le §3 donne à Suspendre et Désinstaller la même définition, alors que le contrat leur donne des effets opposés.
- **Correction suggérée :** Une exigence « Désinstallation » (sort des read-models, de l'essai, de la calibration ; export toujours possible ; migration rejouée ou refus nommé à la réinstallation) ; distinguer Suspendre et Désinstaller (qui décide, effet sur les dépendants, réversibilité, menu).
- **Étiquette :** `reecriture`

### T-25 · high · `reecriture` — Calibration IA : « empreinte identique » contre « recalibré localement »

- **Sévérité max :** high
- **Origine :** F-30 (high)
- **Touche :** FR-24, FR-31, FR-18
- **Écart :** Une mise à jour du modèle commun est une mise à jour et produit une nouvelle calibration : le test d'empreinte de FR-24 échoue par construction. Le retour arrière de code ne dit rien du modèle.
- **Correction suggérée :** Distinguer mise à jour de code (calibration intacte) et mise à jour de modèle (nouvelle calibration ajoutée, la précédente réactivable) ; appariement modèle ↔ calibration ; retour arrière conjoint.
- **Étiquette :** `reecriture`

### T-26 · medium · `reecriture` — Sémantique des dépendances : comptage, 🟠 contre Q3, cycles

- **Sévérité max :** medium
- **Origine :** F-12 (medium), F-13 (medium), R-11 (medium), F-14 (medium)
- **Touche :** FR-1, FR-2, FR-4, FR-5, FR-14 ; contrat Q3
- **Écart :** La règle « décoche ceux qu'aucun autre choix ne retient » n'a pas de comptage des raisons, donc pas de test. FR-5 ferme les dépendants d'un module bloqué à l'installation, Q3 les garde ouverts en exploitation, et rien n'empêche de généraliser FR-5 contre Q3. Un cycle introduit par N+1 bloque la release au dernier moment.
- **Correction suggérée :** Sélection = ensemble de raisons par module, avec un cas de dépendance partagée ; « une suspension ne change ni le voyant ni la visibilité des dépendants (Q3) » à FR-14 ; dépendant optionnel d'un 🔴 = 🟢 avec emplacement vide ; détection de cycle dans la CI de chaque dépôt, `enrichiPar` sans ordre imposé.
- **Étiquette :** `reecriture`

### T-27 · medium · `reecriture` — Mise en service partielle, critères de vérification, « Réessayer »

- **Sévérité max :** medium
- **Origine :** G-09 (medium), F-34 (medium), F-35 (medium), G-12 (low)
- **Touche :** UJ-1, FR-5, FR-6, FR-7, FR-8, FR-9, FR-11, NFR-6, §7 C4
- **Écart :** UJ-1 met en service par étapes, mais FR-7/FR-8 n'ont qu'une date et laissent l'assureur « En installation » des mois. Un comptage n'est pas un critère (0 importé = 🟢 ?), une invitation interceptée en essai ne peut pas être « envoyée », « Réessayer » renvoie des messages, et les lignes « non installé » d'un module non acheté bloquent peut-être la mise en service.
- **Correction suggérée :** Mise en service par sous-ensemble de l'offre et définition d'un client partiellement en service ; critère déclaré par vérification (attendu, seuil, source) ; « intercepté » vaut 🟢 en essai ; « sans doublon » et clef d'idempotence par vérification ; seules les lignes de l'offre comptent.
- **Étiquette :** `reecriture`

### T-28 · medium · `reecriture` — Indicateurs : pari central non mesuré, SM sans source, NFR-5 sans conditions

- **Sévérité max :** medium
- **Origine :** G-04 (medium), F-33 (medium), F-32 (medium), G-05 (low)
- **Touche :** §1, §6 (SM-2 → SM-5), NFR-5, §4.C
- **Écart :** Rien ne mesure « sans dix produits à maintenir » ; les SM à « 0 » n'ont ni source ni sonde, donc zéro par défaut ; NFR-5 (15 min) ne fixe ni machine, ni cache, ni périmètre ; la partie C n'a aucun indicateur.
- **Correction suggérée :** SM « règles propres à un client = 0 » (garde C6) et durée d'installation du 2ᵉ distributeur ; pour chaque SM, source, fréquence, date et test d'intrusion ; conditions de mesure de NFR-5 et cible séparée pour le site ; un SM de partie C si elle n'est pas « plus tard ».
- **Étiquette :** `reecriture`

### T-29 · medium · `bloque-coque` — Habillage et configuration d'accueil par organisation

- **Sévérité max :** medium
- **Origine :** R-23 (medium)
- **Touche :** §4.A ; D1, plan §1.4 ; `Entitlement.config`
- **Écart :** D1 fait de la vertical « une configuration : un pack, une marque, un tableau de bord d'accueil », que la coque doit lire. Le PRD ne dit ni qui possède marque, logo, couleurs et accueil, ni si l'installation les pose.
- **Correction suggérée :** FR « L'installation pose la configuration d'accueil » (marque, accueil, langue) avec son propriétaire (catalogue, offre ou `auth`) et sa lecture par la coque, ou « hors moteur, porté par … ».
- **Étiquette :** `bloque-coque`

### T-30 · medium · `reecriture` — Parcours et dérive de vocabulaire

- **Sévérité max :** medium
- **Origine :** G-25 (medium), R-19 (low), notes mécaniques (vocabulaire, glossaire, titre §2.3, frontmatter Cabinet)
- **Touche :** §2.3 (UJ-1 → UJ-3), §3 ; PRD Reprise et Connecteurs
- **Écart :** Les trois parcours racontent les verticales, pas le moteur ; Rachid et Koffi n'ont pas d'UJ. « Environnement de test », « production », « rapport d'import » et « bascule » échappent au glossaire « sans synonyme » ; plusieurs termes (offre d'essai, prospect, bilans, recette, module commercial) n'y figurent pas.
- **Correction suggérée :** Garder UJ-1 → UJ-3 en contexte partagé et promouvoir Rachid et Koffi en UJ-4/UJ-5 ; remplacer les synonymes ; définir ou bannir « bascule » ; compléter le glossaire ; corriger le niveau de titre et le frontmatter.
- **Étiquette :** `reecriture`

## Dimension verdicts

- Decision-readiness — adequate
- Substance over theater — strong
- Strategic coherence — adequate
- Done-ness clarity — thin
- Scope honesty — thin
- Downstream usability — thin
- Shape fit — adequate

## Findings by severity

### Critical (8)

**[Downstream usability]** — G-18 · Aucun modèle d'état du module par organisation et par espace, donc pas de règle de menu (§3, FR-5, FR-9, §7 C5/C8)
Le contrat définit « Installer = poser l'entitlement `(organisation × module)` en `ACTIVE` », et C8 : « une entrée est visible si et seulement si l'entitlement effectif est `ACTIVE` ». Le PRD redéfinit Installer comme « dans l'espace d'essai » et ajoute 🟢/🟠/🔴, En installation / En service, gel, préavis et suspension de licence, sans jamais dire comment ces états se projettent sur l'entitlement, ce que porte `entitlement.changed`, ni quels états rendent une entrée visible dans quel espace. Le cas central reste ouvert : un module 🟢 en essai, pas encore en service, apparaît-il dans le menu du réel ?
Fix: Une table d'états (module × organisation × espace) → statut d'entitlement → visibilité au menu → refus API, plus une conséquence de FR-9 qui dise comment la coque sait dans quel espace elle tourne.

**[Adversarial]** — F-01 · Aucun automate d'états (§3, FR-5, FR-7, FR-11, FR-15, FR-32)
Le PRD empile au moins trois axes d'état indépendants (module × espace, client, instance) sans table de transitions ni de combinaisons. Un client En service à qui l'on ajoute un module au prérequis manquant repasse-t-il En installation alors que tout tourne ? Un prérequis qui disparaît après la mise en service (clé PI-SPI révoquée) fait-il sortir le module du menu en pleine production ? Un module 🟢 en essai et 🔴 au rejeu : quel état ? Une instance à la fois en préavis et en gel de silence : quoi ?
Fix: Une section « États et transitions » : un diagramme par axe, les transitions autorisées avec déclencheur et trace (NFR-4), une matrice des combinaisons. Distinguer « client en service » d'« offre complète ».

**[Adversarial]** — F-02 · « Sans perte » contre migration irréversible (FR-18)
Restaurer la sauvegarde d'avant promotion efface sept jours de saisie : c'est exactement la perte que la phrase précédente interdit. Même réversible, la version N doit lire des données écrites par N+1 (nouveaux champs, `topic@2` qu'un consommateur revenu en N n'entend pas). Le « retour arrière en un clic, sans rien perdre » du §1 est une promesse que le PRD ne sait pas tenir.
Fix: Discipline « étendre puis contracter » écrite au contrat de module comme clause testable (promouvoir, saisir, revenir, tout est lisible). Cas irréversibles : pas de retour arrière annoncé au DSI, ou perte chiffrée et acceptée. Supprimer « sans perte » partout où ce n'est pas garanti.

**[Adversarial]** — F-08 · Un connecteur dans l'essai écrit dans le vrai logiciel du client (FR-8, FR-9, UJ-3)
FR-9 n'intercepte que SMS, WhatsApp, e-mail et liens de paiement. Un connecteur bidirectionnel branché depuis l'essai écrira dans l'Odoo du distributeur ou dans le core-banking de l'IMF — le système de référence — des décaissements et remboursements fictifs saisis pendant la formation. C'est l'incident le plus grave possible pour une IMF, et rien ne l'empêche.
Fix: Depuis l'essai, tout connecteur est en lecture seule ou pointe vers un bac à sable déclaré ; écriture externe refusée côté serveur (code nommé) ; même règle au PRD Connecteurs ; intercepter « toute sortie vers un système tiers », pas une liste de canaux.

**[Adversarial]** — F-16 · Toutes les horloges lisent une horloge que le client contrôle (FR-15, FR-18, FR-19, FR-32, FR-33)
Sur site hors ligne, la seule horloge est celle du serveur du client. Reculer la date système d'un an prolonge à l'infini le droit d'utiliser, le préavis, l'essai, la grâce et la fenêtre de retour arrière. Le PRD affirme l'inverse de ce qu'il peut garantir. Et « J+30 sans signal » part-il du signal envoyé ou reçu ?
Fix: Horloge monotone côté instance (plus grande date vue, persistée et signée) ; date système antérieure ⇒ état « horloge incohérente » et gel. Pour chaque délai, l'horloge de référence et l'événement de départ. Test : reculer la date du serveur.

**[Adversarial]** — F-17 · Licence rejouable et clé de signature sans cycle de vie (FR-14, NFR-1)
Une licence ancienne mais authentique est bien signée. Le client qui reçoit une licence de suspension n'a qu'à redéposer la précédente, gardée dans sa boîte e-mail : elle passe la vérification et lève la suspension. Rotation, expiration et compromission de la clé ne sont pas traitées, alors qu'une licence perpétuelle doit rester vérifiable hors ligne à vie.
Fix: `numero` strictement croissant par instance, refus `LICENCE_ANTERIEURE`, mémorisation du plus grand numéro. NFR « clés » : chaîne de confiance, rotation sans casser les perpétuelles, révocation par paquet signé, procédure de fuite.

**[Adversarial]** — F-25 · Le canal de données ne s'applique pas à la plateforme Money Vibes (§4.C, FR-26 → FR-30, AD-P16)
Toute la partie 4.C est écrite comme ce qui sort d'une instance. Pour un distributeur hébergé, rien ne sort : Money Vibes lit déjà la base, et AD-P16 l'y autorise. Le registre des consentements ne garde donc aucune porte réelle sur la plateforme, et SM-4 y est invérifiable. La tension relevée au journal n'a reçu ni décision ni exigence.
Fix: Registre des consentements = garde technique sur la plateforme aussi (tout traitement d'apprentissage passe par le même point de contrôle, journalisé) ; borner AD-P16 (lecture d'exploitation ≠ apprentissage) ; ouvrir une question au PO et retirer « aucune question ouverte ».

**[Cohérence contrat]** — R-20 · Le moteur ne dit pas ce qu'il expose à la coque (absence (FR-5, FR-9, FR-15, FR-32, §7 C5/C8))
C8 rend la visibilité fonction de « entitlement `ACTIVE` + droit ». Le PRD ajoute espace, voyant, état du client, essai prospect, préavis, échu en lecture seule, gel, suspension, et en tire des règles de menu et des bandeaux, sans dire par quel canal la coque obtient cet état. La spine de la coque est due le 20/11 et sa première décision porte sur le menu : sans réponse, l'architecte écrit une exigence produit à la place du PO.
Fix: FR « Ce que le moteur publie pour la coque » : (1) un état effectif unique par module dans une énumération fermée (`EN_SERVICE`, `EN_ATTENTE`, `BLOQUE`, `ESSAI_PROSPECT{finLe}`, `PREAVIS{finLe}`, `LECTURE_SEULE`, `SUSPENDU`, `NON_INSTALLE`), sa règle de menu et son canal (topic versionné + route) ; (2) l'état de l'instance ; (3) la garantie que gate et menu lisent la même énumération.

### High (39)

**[Decision-readiness]** — G-01 · Pas de découpage par échéance (§1, §4, SM-1, FR-20, FR-30, FR-31)
Le PRD a deux jalons (démo du 15/01, deux clients en février) mais ne dit nulle part quelles FR chaque jalon exige. FR-30/FR-31 ne peuvent rien produire en février, puisque le contrat C11 constate qu'« aucun module IA n'existe en code ». FR-20 (vagues avec un client pilote) n'a pas de sens avec deux clients. SM-1 (« bilan tout vert ») suppose que les modules du pack distributeur existent le 15/01 et passent leurs vérifications réelles. Sans découpage, Dev B ne peut ni chiffrer ni arbitrer.
Fix: Une table FR × {15/01, février, plus tard}, et un `[NOTE FOR PM]` sur la faisabilité de SM-1.

**[Done-ness clarity]** — G-06 · FR-18 promet l'impossible tel qu'écrit (FR-18)
« Les données saisies depuis la promotion sont conservées », puis « une mise à jour dont la migration n'est pas réversible ne peut pas être publiée sans sauvegarde restaurable ». Restaurer cette sauvegarde perd justement les données saisies depuis la promotion. Tenir « sans perte » 7 jours suppose des migrations rétrocompatibles (étendre, puis contracter) : c'est une clause de module, et le contrat ne l'a pas.
Fix: Imposer la rétrocompatibilité sur 7 jours (et l'ajouter au contrat de module, C1 ou une nouvelle clause), ou dire honnêtement qu'une migration irréversible ferme le retour arrière sans perte.

**[Done-ness clarity]** — G-07 · Les connecteurs écrivent depuis l'espace d'essai vers le système de référence du client (FR-8, FR-9, UJ-3)
FR-8 met « connecteurs » dans la répétition générale. Pour l'IMF, UJ-3 dit que ce qui est saisi dans Prospera « repart vers le logiciel, qui reste la référence ». FR-9 n'intercepte que « SMS, WhatsApp, e-mail et liens de paiement ». Une écriture d'essai peut donc arriver dans le core-banking réel, et le PRD Connecteurs ne parle jamais d'espace d'essai.
Fix: Ajouter à FR-9 que toute écriture sortante d'un connecteur depuis l'essai est interceptée, ou va vers un bac à sable du logiciel client, et le faire reprendre par le PRD Connecteurs.

**[Done-ness clarity]** — G-08 · Sauvegardes et clés de signature sans bornes (FR-17, FR-22, FR-25, NFR-1)
FR-25 et FR-17 disent seulement « sauvegardes automatiques » : ni fréquence, ni rétention, ni lieu, ni perte acceptable, pour un assureur dont les données ne quittent jamais ses locaux. NFR-1 fait reposer toute la confiance sur la signature, sans rotation, révocation ni procédure en cas de clé compromise ; une instance hors ligne n'apprend une révocation que par fichier (FR-22).
Fix: Une NFR de sauvegarde chiffrée, et une NFR « cycle de vie des clés » qui dise ce que fait une instance quand elle reçoit une liste de révocation.

**[Scope honesty]** — G-13 · STORY-727 (déjà sur `dev`) contredit FR-8, FR-11 et SM-1, et le PRD ne le dit pas (FR-4, FR-8, FR-11, SM-1)
STORY-727 ouvre « tous les modules des packages » dès qu'une échéance est soldée (lot 2). Son lot 7 donne à toute organisation `distributeur`, `imf-sfd` ou `assurance-cima`, dès sa création, le package de son vertical sans terme. Le PRD dit à l'inverse qu'« il n'existe aucune commande qui installe […] directement dans l'espace réel » (FR-11), et SM-1 suppose une « organisation vierge » qui n'existe donc pas pour un distributeur. FR-4 cite ces chemins sans dire que leur effet change.
Fix: Une conséquence explicite. Soit le paiement et l'identité rendent un module *souscrit* (installable, FR-12) et plus `ACTIVE`, et 727 est à reprendre. Soit c'est une exception nommée.

**[Scope honesty]** — G-14 · Le feu vert de la Reprise n'est porté par aucune FR (§3, FR-6, FR-8)
Le PRD Reprise (§C5) dit que « le moteur d'installation ne peut pas mettre le client en service (PRD moteur FR-6, FR-8) » sans feu vert, et le journal le note. Côté moteur, seul le §3 le suggère. FR-6 ne lit qu'un comptage, et FR-8 ne pose aucune condition. Le contrat entre les deux PRD est cassé du côté consommateur.
Fix: Dans FR-8 : « la mise en service est refusée tant que la Reprise n'a pas publié son feu vert pour l'organisation » (code nommé, événement consommé).

**[Scope honesty]** — G-15 · D3 révisée et contrat de module §9 non cités (§0, partie 4.B)
Le contrat (§9) dit encore que l'installation chez le client « est renvoyée après les 8 semaines » par D3. Le journal enregistre la révision de D3 (« prête AVANT FÉVRIER 2027 »), mais le PRD ne cite ni D3 ni cette révision : toute la partie B annule en silence un document qu'il déclare appliquer.
Fix: Une ligne au §0 qui acte la révision de D3, et une demande d'amendement du §9 du contrat.

**[Downstream usability]** — G-19 · « Pack » a deux sens (§3, §4.A, QA-1, SM-1, NFR-5)
Le §3 reprend la définition du contrat (`VerticalPack` : `distributeur`, `imf-sfd`…). Le §4.A donne au contraire quatre packs au seul distributeur (« Terrain & Ventes, Finance & Recouvrement… »), QA-1 parle de « 18 modules, 4 packs », et SM-1/NFR-5 reviennent au singulier (« le pack distributeur »). Le modèle de données du catalogue dépend de la réponse.
Fix: Deux termes, par exemple **pack de vertical** et **pack commercial**, et dire lequel le catalogue stocke.

**[Downstream usability]** — G-20 · Les écrans du client ne sont situés nulle part, et leurs droits manquent (FR-17, FR-18, FR-19, FR-22, FR-23, FR-27, §7 C7/C8)
Le DSI choisit la date, revient en arrière, reporte un correctif, dépose un fichier, ouvre le tunnel ; le DG consent. Ces écrans sont-ils dans la console Money Vibes, qui tourne « sur l'instance du client » (§3), ou dans `prospera-app` (C8, D1) ? Le §7 C8 ne liste que des écrans de console, et le §7 C7 ne crée qu'un seul droit client (consentement).
Fix: Lister les surfaces client et leurs droits `<module>:<objet>:<action>`.

**[Downstream usability]** — G-21 · AD-P16 et la recette dans l'essai court-circuitent les niveaux de consentement (§4.C, FR-10, FR-17, FR-29, SM-4)
Le journal a relevé qu'AD-P16 permet à Money Vibes de lire les données métier, « à trancher ». Le PRD ne cite jamais AD-P16. Pour un distributeur hébergé, Money Vibes est donc toujours « sur place », et le niveau 2 (FR-29) n'a pas de sens. Sur site, Money Vibes « y joue la recette » dans un essai rafraîchi depuis le réel, donc sur des données réelles, sans connexion entrante : par quel accès, sous quel niveau ? SM-4 est en jeu.
Fix: Dire si la recette est automatique (sans accès humain) ou passe par le tunnel de niveau 2, et réconcilier explicitement 4.C avec AD-P16.

**[Adversarial]** — F-03 · Échec à mi-chemin d'une installation (FR-4, NFR-6, contrat §3.4)
L'idempotence dit ce qui se passe quand on rejoue ; rien ne dit ce qui reste quand une installation de 18 modules meurt au 9ᵉ (coupure électrique fréquente sur site) : entitlements à moitié écrits, comptes créés pour certains modules, bilan absent. Même trou pour une promotion interrompue entre la sauvegarde et le contrôle de santé.
Fix: Installation = plan persistant d'étapes avec statut, reprenable ; bilan « interrompue à l'étape X ». Une promotion interrompue déclenche le retour arrière automatique. Test de chaos : tuer le processus à chaque étape.

**[Adversarial]** — F-04 · La désinstallation et la licence contournent l'essai (FR-11, FR-14, SM-3)
FR-11 ne liste que des ajouts. Retirer, suspendre, appliquer une licence qui retire un droit : ce sont des changements dans le réel sans essai. Soit SM-3 est faux dès le premier impayé, soit une suspension attend une répétition générale, ce qui est absurde. Et une licence qui ajoute un module l'installe-t-elle d'office ?
Fix: Classer les changements : code/schéma → toujours essai puis promotion ; droits (suspension, révocation, licence) → appliqués directement, journalisés, hors SM-3. Une licence qui ajoute un module le rend seulement installable.

**[Adversarial]** — F-05 · Données orphelines et copies chez les voisins (§3 « Désinstaller », FR-3, C9)
Le PRD ne parle que des données du module désinstallé. Les read-models des voisins (`enrichiPar`) restent-ils affichés ? Désinstaller dans le réel désinstalle-t-il dans l'essai ? Que devient la calibration IA ? Sur site, qui exporte encore les données d'un module révoqué ? Réinstaller après N+3 « retrouve tout » suppose de relire des données de N, contre la fenêtre N/N-1.
Fix: Une exigence « Désinstallation » : sort des read-models voisins, de l'essai, de la calibration ; export toujours possible ; règle de réinstallation après plus d'une majeure (migration rejouée ou refus nommé).

**[Adversarial]** — F-06 · « On ne copie jamais l'essai vers le réel » contre « il garde ses réglages » (FR-8, FR-33, NFR-3)
Rejouer « les mêmes tables de correspondance » dans le réel, c'est lire l'essai pour écrire le réel : NFR-3 l'interdit. Les rôles, zones et comptes réglés pendant la répétition ne figurent pas dans la liste rejouée. La calibration du prospect, apprise dans l'essai sur des données non validées, devrait passer dans le réel : copie interdite par FR-8.
Fix: Un objet explicite, versionné et journalisé — la **recette d'installation** — exporté de l'essai et rejoué dans le réel ; amender NFR-3 pour nommer ce seul flux. Calibration : recalculée sur la reprise fraîche (recommandé) ou copiée par exception nommée.

**[Adversarial]** — F-07 · Le rafraîchissement obligatoire écrase l'essai en cours (FR-10)
Sur la plateforme, l'essai est partagé : rafraîchir avant une majeure efface les prospects en essai et les répétitions des autres clients. Sur site, il efface la recette d'un module en cours d'ajout. Il copie aussi des données personnelles réelles dans un espace aux contrôles plus lâches, sans traitement au titre de la loi 2019-014, et sans prévoir le disque pour doubler la base.
Fix: Rafraîchissement par organisation, jamais par instance ; exclure les essais prospects ; bloquer si une répétition est en cours ; dire qui accède à l'essai et si un masquage s'applique ; capacité disque au bilan d'instance.

**[Adversarial]** — F-09 · « Le DSI choisit la date » est impossible sur une plateforme mutualisée (FR-13, FR-17, FR-18, FR-20)
La plateforme Money Vibes est une instance multi-organisations avec une ligne de version : on ne peut pas promouvoir N+1 pour un distributeur et laisser son voisin en N, ni revenir en arrière pour un seul client. Les « mêmes étapes » n'y ont pas de sens, et l'espace d'essai y est commun.
Fix: Deux variantes de FR-17/18/20 : sur site (date du DSI, retour arrière par instance) et plateforme (fenêtre fixée par Money Vibes, préavis, retour arrière global). Restreindre FR-13 à ce qui est vraiment identique.

**[Adversarial]** — F-10 · Une dépendance que le contrat ne couvre pas (FR-2, FR-12, FR-14)
Le commercial vend « Relances » sans « Facturation » : FR-2 ajoute Facturation, FR-12 la refuse. Rachid est bloqué entre deux règles qui se contredisent, et le PRD ne dit ni laquelle gagne, ni où l'incohérence aurait dû être arrêtée. Sur site, refus hors ligne sans recours avant la prochaine licence.
Fix: Même résolution de dépendances à la création du contrat (STORY-727) et à l'émission de la licence ; refus nommé « dépendance non souscrite » avec l'action « faire amender le contrat ».

**[Adversarial]** — F-11 · Une nouvelle version ajoute ou retire une dépendance (FR-17, FR-21, contrat Q5)
N+1 du module A déclare `depends: ['X']`, que le client n'a pas souscrit : la mise à jour est-elle bloquée (et l'instance sort de la fenêtre), ou X s'installe-t-il d'office, hors contrat ? Une dépendance retirée laisse X facturé sans raison. La « propagation d'un pack » n'est jamais définie.
Fix: Calculer l'écart de dépendances par client avant de déposer une version dans l'essai (refus `MISE_A_JOUR_DEPENDANCE_NON_SOUSCRITE` ou ajout proposé) ; interdire à une mineure d'ajouter une dépendance dure ; définir la propagation d'un pack.

**[Adversarial]** — F-18 · Un même mot « gel » pour deux états aux sorties différentes (§3 « Gel », FR-15, FR-32)
Gel de silence : levé au retour du signal. Gel de fin de maintenance : levé seulement par paiement et rattrapage. Un client figé qui cesse d'envoyer son signal déclenche à vie les alertes J+7, le ticket et l'appel, et gonfle le contre-indicateur. Le retour de son signal « lève le gel » d'après FR-15 : contradiction directe.
Fix: Deux termes (**gel** / **version figée**), chacun avec entrée, sortie et alertes ; dire si une instance figée envoie encore un signal.

**[Adversarial]** — F-19 · N/N-1 contre « figé à vie » et contre « le DSI choisit » (FR-17, FR-21, FR-32)
N/N-1 autorise une version de retard, « plus de deux » en autorise deux : le chiffre est faux d'un côté. Une instance figée sortira forcément de la fenêtre. Et qu'est-ce qui empêche une instance maintenue de rester en retard si le DSI ne choisit jamais de date ? Une promotion forcée contredit FR-17.
Fix: Fixer N-1 au plus ; hors fenêtre = fin du support contractuel (pas de blocage), escalade au DG ; exemption des instances figées ; une promotion forcée, si elle existe, est une seconde exception nommée à FR-17.

**[Adversarial]** — F-20 · 72 heures incompatibles avec les vagues et le gel (FR-15, FR-18, FR-19, FR-20)
Un correctif soumis aux vagues met au moins 7 jours à atteindre la 2ᵉ vague ; une instance gelée ne peut pas l'appliquer ; le report rend le délai réel 72 h + 7 j, ce que les indicateurs ignorent. Le DSI peut-il revenir en arrière d'un correctif qu'il n'avait pas le droit de refuser ?
Fix: Exempter les correctifs de sécurité des vagues ; le gel n'empêche pas un correctif par fichier ; échéance « 72 h, ou 72 h + report » ; encadrer le retour arrière d'un correctif de sécurité.

**[Adversarial]** — F-21 · Essai : fin, prolongation, signature tardive (FR-33)
Entre la fin de l'essai et l'effacement : le prospect peut-il encore exporter ? La prolongation se donne-t-elle après la fermeture ? Un prospect qui signe à J+45 retrouve-t-il ses données ? Qui reçoit les rappels ? Les 60 jours partent de quoi ?
Fix: Une chronologie de l'essai : J0 nommé, rappels J-7/J-1, fin, fenêtre d'export, signature tardive, effacement, preuve.

**[Adversarial]** — F-22 · L'effacement est « hors de ce PRD » mais le PRD en fixe l'échéance (§3 « Effacer », FR-33, C9/Q4)
Le PRD exige un effacement automatique et daté sans dire qui le construit, ce qu'il couvre (sauvegardes, journal des envois interceptés, journal en ajout seul qui contient des noms, calibration, read-models) ni ce que veut dire « tracé ». Un effacement qui laisse les données dans les sauvegardes n'est pas un effacement au sens de la loi 2019-014.
Fix: Porter l'effacement dans ce PRD (périmètre exhaustif, sort des sauvegardes, certificat), ou le renvoyer vers un PRD nommé qui doit exister avant février ; retirer « hors de ce PRD ».

**[Adversarial]** — F-26 · « Pseudonymisé » n'est ni défini ni suffisant (FR-28, FR-30)
Une donnée pseudonymisée reste personnelle (montant + date + agence suffisent dans une petite IMF). Ni technique, ni détenteur de la clé, ni traitement des champs libres et pièces jointes, ni test. Les dossiers « où l'IA s'est trompée » sont les plus atypiques, donc les plus réidentifiables.
Fix: Transformation définie (champs supprimés, hachés avec sel gardé sur l'instance, généralisés) ; champs libres et fichiers exclus par défaut ; seuil de k-anonymat ; test qui échoue si un champ non déclaré sort ; validation juridique en prérequis daté.

**[Adversarial]** — F-30 · « Empreinte identique » contre « recalibré localement » (FR-24, FR-31)
Une mise à jour du modèle commun est une mise à jour (FR-31 le dit) et produit une nouvelle calibration : le test d'empreinte de FR-24 échoue par construction. Le retour arrière de code revient-il aussi au modèle précédent ?
Fix: Distinguer mise à jour de code (calibration intacte) et mise à jour de modèle (nouvelle calibration ajoutée, précédente réactivable) ; appariement modèle ↔ calibration et retour arrière conjoint.

**[Adversarial]** — F-31 · « En une action, bilan tout vert » est impossible par construction (SM-1, FR-6, FR-8, §7 C4)
Une organisation vierge n'a ni données à reprendre, ni numéro WhatsApp vérifié, ni clé PI-SPI : FR-5/FR-6 la mettent en 🔴. FR-8 impose essai puis rejeu : deux actions minimum. La démo du 15/01 ne peut être « atteinte » qu'en trichant sur les vérifications — exactement ce que FR-6 interdit.
Fix: Réécrire SM-1 : « en une action dans l'espace d'essai, bilan sans 🔴 hors prérequis externes, avec prérequis de démonstration déclarés », et lister les lignes attendues avec leur voyant.

**[Adversarial]** — F-36 · Le document se contredit sur son propre périmètre (§0, §2.2, §8, FR-33, en-tête)
§2.2 exclut le libre-service ; FR-33 fait tester le prospect « sans Money Vibes » ; le PRD Reprise prévoit le libre-service en février. §0 met Connecteurs « plus tard », QA-3 « prêt en février ». L'en-tête dit que §4 n'existe pas. Et §8 déclare « aucune question ouverte » alors qu'il en reste (AD-P16, loi 2019-014, contrat client, horloge, clés) : le dire au PO qui valide le 13/11 est la pire des erreurs de forme.
Fix: Aligner §0 et §2.2 sur QA-3 et FR-33 (libre-service d'essai dans le périmètre, installation d'une offre signée non) ; supprimer l'en-tête périmé ; remplacer §8 par une liste honnête de questions et de prérequis datés avec propriétaire.

**[Adversarial]** — F-37 · L'accès de l'équipe Money Vibes à une console sur site (FR-13, FR-22, FR-23, §3)
Rachid et Yao doivent se connecter à la console de l'instance. Avec quel compte, quel fournisseur d'identité ? Un compte Money Vibes permanent sur l'instance est un accès permanent, que FR-23 interdit ; un compte par visite suppose une procédure absente. Qui a le droit de déposer une licence ou un paquet ?
Fix: Exigence « Identités sur site » : comptes Money Vibes désactivés par défaut, activés par le client pour une durée bornée, journalisés ; rôle nommé côté client pour déposer licence et paquets.

**[Cohérence contrat]** — R-01 · Les droits de tenant ne sont pas traités (§4.A, §7 C7)
Le contrat §7 confie au moteur la « lecture [des droits] depuis les manifestes » (sem. 5), la mesure du filtrage des droits d'un module non installé et la requalification de STORY-365 ; le plan §5 fait de STORY-365 (droits de tenant) le jalon de la semaine 5 et la première story de code de Dev B. Le PRD n'en couvre aucun, et la garde C7 (`manifeste.droits ⊂ TENANT_PERMISSION_CATALOG`) n'a pas de consommateur.
Fix: FR « Les droits suivent l'installation » : droits du manifeste attribuables sans déploiement ; droits d'un module non installé, suspendu ou révoqué hors des droits effectifs ; STORY-365 requalifiée contre 166/167 ; SM « droits visibles sans déploiement ».

**[Cohérence contrat]** — R-02 · Le cycle de vie contredit AD-P17 et C8 (§3 « Installer » / « Mettre en service », FR-5, FR-7, FR-8)
Le PRD redéfinit « installer » (dans l'espace d'essai) alors qu'AD-P17 dit « Installer = entitlement `ACTIVE` », et ajoute l'espace et le voyant, que l'entitlement ne porte pas. Si l'entitlement d'un module 🔴 est `ACTIVE`, il apparaît au menu (contre FR-5) et ses dépendants passent la garde 422. Sinon, on ne sait pas quand il le devient. L'espace est-il un déploiement distinct ou une dimension de l'entitlement ?
Fix: Table d'états du couple (organisation × module) : statut d'entitlement, voyant, visibilité au menu, gate. Dire si essai et réel sont deux déploiements avec chacun son catalogue ; aligner le vocabulaire sur AD-P17.

**[Cohérence contrat]** — R-03 · La suspension « consulter et exporter » contredit C2, et le code la dément (FR-32, §3 « Préavis »)
`SUSPENDED` ferme tout (`paiement-access.guard.ts`, STORY-280 AC-1). La lecture seule existe, mais pour un droit échu (STORY-727 lot 4, `ABONNEMENT_EXPIRE`), et elle est immédiate, sans 30 jours de préavis. « Préavis » désigne déjà autre chose dans STORY-280. Au passage, C2 (« expiré ⇒ 403 sans donnée ») est lui aussi démenti par 727 lot 4.
Fix: « Expiré (lecture seule) » au lieu de « suspension », citer 727 lot 4 ; dire si les 30 jours décalent l'échéance ou ajoutent un état « en préavis » ; renommer le préavis ; signaler au contrat que C2 doit distinguer expiré et `SUSPENDED`/`REVOKED`.

**[Cohérence contrat]** — R-04 · De nouvelles obligations pèsent sur chaque module, hors contrat (FR-5, FR-6, FR-9, FR-10, FR-16, FR-26, §7 C1)
Prérequis, vérifications chiffrées, interception des envois en essai, export/import par organisation pour le rafraîchissement, santé par module, indicateurs IA de niveau 0 : aucune des onze lignes du contrat ne les porte. Les PRD des lots 2 à 4, qui remplissent le gabarit du §6, les ignoreront, et le contrôle de préparation ne les verra pas.
Fix: Faire amender le contrat par le PO : clause **C12 « installable sous contrôle »** (prérequis, vérifications, santé exposés ; mode essai ; export/import par organisation), ou extension officielle de C1/C10 ; les lister au §7.

**[Cohérence contrat]** — R-05 · Les parties B et C ne peuvent pas vivre dans le catalogue (frontmatter `service`, §7 C3, C10)
Émission de licences, distribution de paquets, supervision, agent de signal, outil de promotion et de retour arrière sur l'instance, registre des consentements, canal sortant : autant d'agrégats et de lieux d'exécution distincts. Un retour arrière de la plateforme ne peut pas être exécuté par un service qu'il remplace. Contrat §4 : « un agrégat distinct, c'est un service distinct ».
Fix: « Partie A dans `platform-catalog-service` ; parties B et C : services à trancher dans la spine » ; ajuster C3 et C10 (agent d'instance dans le socle, hors `docker compose` des modules).

**[Cohérence contrat]** — R-09 · D3 est contredite, et le plan n'est pas amendé (partie 4.B, FR-25)
Plan §8 (D3) et contrat §9 renvoient le packaging client après les 8 semaines ; le journal enregistre D3 révisée (avant février 2027), que le PRD ne mentionne pas. Le plan donne une seule semaine au moteur. Le PRD ne découpe pas 15/01 et février, et la charge des parties B et C n'apparaît pas au plan.
Fix: Section « Jalons » qui affecte chaque FR ; inscrire D3 révisée au plan §8, au contrat §9 et à AD-P17, avec ses conséquences sur la charge et l'ordre de sacrifice.

**[Cohérence contrat]** — R-10 · Q4 est contredite, et le PRD se contredit lui-même (FR-33, §3 « Effacer »)
FR-33 crée un effacement automatique à échéance, que le PRD spécifie tout en le déclarant hors périmètre, contre Q4 (« sans limite jusqu'à une demande d'effacement »). C3 interdit au moteur d'effacer les collections des autres modules.
Fix: Faire acter que la non-signature vaut demande d'effacement (exception écrite à Q4), ou un effacement « proposé » ; dans les deux cas, un contrat d'effacement par organisation dans chaque module (voir R-04).

**[Cohérence contrat]** — R-14 · « Pack » a deux sens incompatibles (FR-1, QA-1, SM-1, NFR-5, Connecteurs FR-3)
Le contrat et le code (`packs.seed-data.ts`) font du pack un `VerticalPack` (`distributeur` = 7 codes), clé de l'octroi par vertical et des contrats de packages (727). Le PRD emploie « pack » pour quatre sous-ensembles commerciaux qui n'existent pas au catalogue. SM-1 et NFR-5 deviennent ambigus (7 ou 18 modules ?), et Connecteurs FR-3 hérite de l'ambiguïté.
Fix: Un seul sens (« pack » = `VerticalPack`, « bouquet » pour les sous-ensembles, ou l'inverse avec migration du seed) ; table bouquet → modules commerciaux → codes ; préciser SM-1/NFR-5 ; reporter dans Connecteurs.

**[Cohérence contrat]** — R-21 · La coque ne sait pas dans quel espace elle tourne (FR-9)
Bandeau jaune, couleur et titre d'onglet : mais la source de vérité (variable de déploiement, champ d'instance, licence) n'est pas dite, ni si un utilisateur passe d'un espace à l'autre, ni le cas d'un prospect qui n'a que l'essai.
Fix: « L'espace est une propriété de l'instance déployée, exposée par le moteur à la coque (route publique de configuration) ; deux URL distinctes ».

**[Cohérence contrat]** — R-22 · D1 ignorée : les écrans côté client n'ont pas de lieu (§7 C8, FR-17, FR-18, FR-19, FR-22, FR-23, FR-27, FR-32, FR-33)
DG qui consent, DSI qui choisit une date, revient en arrière, dépose un fichier, ouvre un tunnel, prospect en essai, abonné échu qui exporte : tous sont des utilisateurs du client. Les placer dans la console Money Vibes (le CRM interne, plan §1.5) oblige à leur donner des rôles plateforme, ce qui mêle portées plateforme et tenant (AD-P15). Le PRD ne mentionne jamais `prospera-app`.
Fix: Partager C8 : console Money Vibes (offre, installation, bilan, supervision, licences) ; `prospera-app`, espace « Administration de mon instance » (mises à jour, retour arrière, fichier, tunnel, consentements, export, essai), chaque écran avec son droit de tenant.

**[Cohérence contrat]** — R-27 · Les chemins d'installation réels contredisent le PRD (FR-4, FR-11, FR-12)
Le code a quatre chemins, mais pas ceux du PRD : `PUT :orgId/:moduleCode` (opérateur), `octroi-par-abonnement` (727 lot 2 : une échéance soldée ouvre les modules), `propagation-des-packs` (lot 6), et `octroi-par-vertical` (lot 7 : package sans terme, sans contrat, dès `identity.org.created`). Le PRD oublie l'octroi par vertical, qui installe sans contrat (contre FR-12) et directement (contre FR-11). Appliquée telle quelle, FR-12 casserait les octrois d'opérateur existants.
Fix: Lister les cinq chemins (quatre existants + licence) : installe ou rend installable, passe ou non par l'essai, soumis ou non à `MODULE_NON_SOUSCRIT` ; exceptions nommées (vertical, opérateur, organisation Money Vibes) ; test de mutation de FR-4 sur les cinq.

### Medium (39)

**[Decision-readiness]** — G-02 · « Il ne reste aucune question ouverte » (§8) est faux (§8)
Les constats high de ce rapport (§4, §5, §6) sont des choix que le PO n'a pas encore rendus.
Fix: Rouvrir un §8 court (retour arrière et migrations, alignement sur STORY-727, connecteurs depuis l'essai, sens de « pack », AD-P16) et marquer chaque point en `[NOTE FOR PM]`.

**[Decision-readiness]** — G-03 · Le gel permanent bloque l'achat d'un module (§3 « Gel », FR-14, FR-32)
§3 définit le gel comme « ni installation, ni mise à jour », et FR-32 en fait l'état à vie d'un client qui a acheté le logiciel puis arrêté la maintenance. Ce client ne peut donc plus acheter de module, alors que son droit d'utiliser est perpétuel et que FR-14 fait arriver un ajout « par une nouvelle licence ». Est-ce voulu ?
Fix: Trancher : un ajout de module rouvre-t-il la maintenance, ou l'installation reste-t-elle permise en gel de fin de maintenance ?

**[Strategic coherence]** — G-04 · Aucun indicateur ne valide « sans dix produits à maintenir » (§1, §6 (SM-3, SM-4))
SM-3 et SM-4 comptent ce qui est interdit. Rien ne compte les exceptions client (C6) ni l'effort d'une installation après la première.
Fix: SM « branches ou règles propres à un client = 0 » (la garde de balayage C6 le mesure déjà), et durée d'installation du 2ᵉ client distributeur comparée au 1ᵉʳ.

**[Done-ness clarity]** — G-09 · UJ-1 met en service par étapes ; FR-7 et FR-8 ne le permettent pas (UJ-1, FR-7, FR-8, FR-11)
UJ-1 étape 4 met en service la recherche, puis le circuit sinistre, puis l'IA locale. FR-8 prévoit une seule date et une seule offre rejouée, et FR-7 laisse le client « En installation » tant qu'une ligne n'est pas verte, donc pendant des mois chez l'assureur.
Fix: Autoriser une mise en service par sous-ensemble de l'offre (FR-11 le permet presque) et définir « En service » pour un client partiellement en service.

**[Done-ness clarity]** — G-10 · Partie C peu vérifiable (FR-27, FR-28, FR-29)
FR-28 ne dit pas ce que « pseudonymisé » recouvre (champs, méthode, détenteur de la table de correspondance) ni qui approuve chaque export. FR-29 n'a qu'une conséquence, « rien n'est copié hors de l'instance », qu'aucun test ne peut vérifier quand une personne analyse par tunnel.
Fix: Une liste minimale de champs retirés, le rôle qui approuve, et pour FR-29 une conséquence vérifiable (session journalisée, aucun transfert de fichier par le tunnel).

**[Scope honesty]** — G-16 · §0 contredit QA-3 (§0, QA-3)
§0 : « Connecteurs (synchronisation permanente, plus tard) ». QA-3 : « Connecteurs doit être prêt en février ; son PRD entre au lot 1 ». Le journal montre que la première version a été remplacée ; le §0 n'a pas suivi.
Fix: Aligner le §0 sur QA-3.

**[Scope honesty]** — G-17 · FR-33 crée un effacement automatique sans propriétaire (§3 « Effacer », FR-33, contrat Q4)
§3 : « Effacer : […] acte séparé, demandé, tracé, hors de ce PRD ». Le contrat (Q4) garde les données « sans limite jusqu'à une demande d'effacement ». FR-33 impose pourtant un effacement non demandé 30 jours après un essai non signé. La décision est légitime, mais aucun document ne dit qui exécute l'effacement dans chaque module.
Fix: Nommer l'exception à Q4 et le porteur (le moteur ordonne, chaque module efface par contrat C5 ?).

**[Downstream usability]** — G-22 · Le §7 range tout dans `platform-catalog-service` (§7 C3, frontmatter)
La partie B décrit au moins deux acteurs : côté Money Vibes (émission de licences, distribution des paquets, supervision) et côté instance (agent de mise à jour, sauvegarde, retour arrière, signal). Le §7 C3 fait en plus « posséder » les consentements, qui vivent chez le client. Le contrat (§4) pose qu'« un agrégat distinct, c'est un service distinct ».
Fix: Laisser le découpage à la spine, mais retirer l'affirmation du §7 ou la marquer `[ASSUMPTION]`.

**[Shape fit]** — G-23 · FR-21 cite mal l'existant (FR-21, §3 « une seule ligne de version »)
`fenetre-de-support.ts` est une règle par module (au plus `MAX_ACTIVE_MAJORS` majeures `ACTIVE`), appliquée quand Money Vibes publie : ce n'est pas une limite au retard d'une instance. « Plus de deux versions majeures en retard » ne dit pas N/N-1. Le lien entre la ligne de version unique et les versions semver par module (`ModuleVersion`) reste sans réponse, comme le sort d'une instance hors fenêtre.
Fix: Définir la version de plateforme (ensemble de versions de modules), la règle de retard admissible, et sa conséquence.

**[Shape fit]** — G-24 · FR-32 cite STORY-280, mais c'est STORY-727 qui s'applique (FR-32)
STORY-280 suspend les accès (contrat C2 : « 403 nommé, aucune donnée »). C'est le lot 4 de STORY-727 qui donne « échu ⇒ lecture seule ». Le mot « préavis » est aussi déjà pris : `paiement.abonnement.preavis.emis` part 7 jours avant l'échéance, le préavis du PRD dure 30 jours après.
Fix: Citer 727 lot 4 et renommer l'un des deux préavis.

**[Shape fit]** — G-25 · Les parcours racontent les verticales, pas le moteur (§2.3 (UJ-1 → UJ-3))
Les trois « moments gagnés » appartiennent aux modules métier, à la Reprise et aux Connecteurs. UJ-3 (IMF) ne concerne aucun client de février. Les vrais protagonistes du moteur, Rachid (installation) et Koffi (mise à jour), ne sont racontés que dans le §4.
Fix: Garder les trois UJ en contexte partagé du lot et promouvoir en UJ-4 et UJ-5 les récits de Rachid et de Koffi, déjà écrits.

**[Adversarial]** — F-12 · Comptage des raisons de sélection non défini (FR-1, FR-2)
Une dépendance ajoutée par FR-2 est-elle « retenue » ? Facturation ajoutée par Relances et par Encaissements : annuler l'ajout décoche-t-il les deux ? Sans règle, deux implémentations donneront deux sélections, et le test est inécrivable.
Fix: Sélection = ensemble de raisons par module (pack, manuel, requis par M) ; décoché quand l'ensemble est vide ; lister tous les demandeurs avant de décocher. Un cas de test avec dépendance partagée.

**[Adversarial]** — F-13 · 🟠 « en attente » contre « reste ouvert » (FR-5, contrat Q3)
À l'installation, un dépendant d'un module bloqué est fermé ; en exploitation, un dépendant d'un module suspendu reste ouvert (Q3). Deux règles pour le même graphe, et rien sur les dépendants optionnels d'un module 🔴.
Fix: Dépendant dur d'un 🔴 = 🟠 (installation seulement) ; optionnel = 🟢 avec emplacement vide ; après mise en service, Q3. Justifier la différence en une phrase.

**[Adversarial]** — F-14 · Cycle introduit par une nouvelle version (FR-4)
Un cycle peut naître de la version N+1 de B alors que A est publié : la publication est refusée, la release entière bloquée au dernier moment. Les cycles via `enrichiPar` ne sont pas traités.
Fix: Détection de cycle dans la CI de chaque dépôt de module ; `enrichiPar` peut être cyclique et n'impose aucun ordre.

**[Adversarial]** — F-15 · « Quatre chemins » mal énumérés (FR-4)
La liste oublie la mise à jour, la réinstallation, l'offre d'essai et la promotion. Sur site, le point de décision tourne sur l'instance : c'est un second point de décision, à garder à l'octet près du central.
Fix: Lister tous les chemins d'entrée ; une seule implémentation embarquée à l'identique, même suite de conformité.

**[Adversarial]** — F-23 · La suspension « consulter et exporter » n'est pas spécifiée (FR-32)
Exporter quoi, dans quel format, par qui ? Une IMF suspendue doit-elle refuser l'argent d'un remboursement ? Les connecteurs synchronisent-ils encore ? Les correctifs de sécurité et les états BCEAO sont-ils produits ?
Fix: Une exigence « Mode suspendu » par catégorie d'action (lecture, export, saisie, envois, connecteurs, tâches, mises à jour) ; un format d'export minimal commun au contrat de module.

**[Adversarial]** — F-24 · Deux sources de droits, aucune règle de cohérence (FR-12, FR-13, FR-14)
Sur site, ajouter un module au contrat ne change rien tant qu'une nouvelle licence n'est pas émise et reçue : « sans autre action » est faux. Qui émet la licence quand le contrat change ? Si contrat et licence divergent, lequel fait foi ?
Fix: Licence dérivée du contrat par émission automatique ; le contrat fait foi sur la plateforme, la licence sur site ; contrôle de supervision « licence en retard sur le contrat ».

**[Adversarial]** — F-27 · « Un test le vérifie sur chaque envoi » est irréalisable (FR-26)
On ne détecte pas un identifiant arbitraire dans un flux libre, et un agrégat sur trois dossiers est une donnée personnelle.
Fix: Schéma fermé du signal (liste blanche de champs typés, refus d'un champ inconnu) et seuil minimal d'effectif.

**[Adversarial]** — F-28 · Où vit le registre, et qui le falsifie (FR-27, §7 C7)
Le registre est-il sur l'instance ou chez Money Vibes ? Un administrateur local peut-il insérer un consentement ? « Désigne par écrit » : comment le système le sait-il ? Le droit « donner un consentement » est attribuable par l'administrateur du client, donc pas réservé au DG.
Fix: Consentement = document signé contresigné par Money Vibes, stocké des deux côtés ; droit de consentir attribuable par le DG seul ; la porte de sortie vérifie la signature.

**[Adversarial]** — F-29 · Retrait de consentement et contributions déjà envoyées (FR-30)
Les contributions reçues mais pas encore utilisées sont-elles purgées ? Combien de temps Money Vibes les garde-t-il ?
Fix: Purge des contributions non consommées au retrait, durée de conservation maximale, trace visible du client.

**[Adversarial]** — F-32 · « Moins de 15 minutes » sans conditions de mesure (NFR-5)
Quelle machine, quelles images en cache, quel réseau, « complet » = 18 modules ou 4 ? Les attentes de réception comptent-elles ? Un test sans ces paramètres passera ou échouera au hasard.
Fix: Configuration de référence, état de départ, périmètre exact et bornes du chronomètre ; une cible séparée pour le site.

**[Adversarial]** — F-33 · Indicateurs sans source de mesure (SM-2, SM-3, SM-4, SM-5)
Zéro est la valeur qu'affiche toute mesure qui n'existe pas. Rien ne dit quel journal compte les changements ni quel point d'observation voit une sortie non consentie. SM-2 et SM-5 n'ont ni date ni définition.
Fix: Pour chaque SM : source, fréquence, date ; pour les « 0 », un test d'intrusion qui prouve que la sonde verrait l'événement.

**[Adversarial]** — F-34 · « Vérifié » sans critère de réussite (FR-6, FR-9)
Un nombre n'est pas une vérification : 0 point de vente importé est-il 🟢 ? Et FR-6 exige « l'invitation envoyée » alors que FR-9 intercepte tous les e-mails de l'essai : la vérification ne peut être que fausse ou interceptée.
Fix: Chaque vérification porte son critère (attendu, seuil, source de l'attendu) ; dans l'essai, « intercepté » vaut 🟢, l'envoi réel a lieu au rejeu.

**[Adversarial]** — F-35 · « Réessayer sans effet de bord » contre des vérifications qui envoient (FR-5, NFR-6)
Une vérification réelle envoie un WhatsApp, génère un lien, crée un compte : la rejouer a un effet de bord par nature. Une vérification échouée après envoi en envoie un deuxième.
Fix: « Sans doublon » et une clef d'idempotence par vérification (réutiliser l'envoi, recontrôler la réception).

**[Adversarial]** — F-38 · Exigences transverses absentes (§5 (NFR-1 → NFR-6))
Rien sur la sauvegarde (RPO/RTO, emplacement — le NAS tombe avec le serveur), l'interruption tolérée pendant une promotion, la capacité minimale du serveur client, la rétention du journal, le chiffrement des paquets sur clé USB.
Fix: NFR-7 sauvegarde, NFR-8 interruption maximale par promotion, NFR-9 configuration minimale d'un serveur client.

**[Adversarial]** — F-39 · Aucun ordre de priorité pour février (§1, §4)
33 FR, trois parties, deux hébergements, deux PRD voisins requis en février, et aucune distinction entre 15/01, février et plus tard. Les épics ne pourront pas arbitrer quand le calendrier glissera.
Fix: Étiqueter chaque FR ; reports évidents : FR-20, FR-29, FR-30/31.

**[Cohérence contrat]** — R-06 · Le contrat du moteur lui-même est incomplet (§7 C1, C4, C5, C7, C8)
C1 décrit ce que le moteur exige des autres, pas son propre manifeste. C5 ne cite aucun topic consommé (feu vert Reprise, santé Connecteurs, `echeance.encaissee`, `identity.org.created/updated`). C7 omet les droits du DSI. C8 omet les écrans côté client.
Fix: Compléter ces cinq lignes ; une ligne « à nommer dans la spine » liste au moins les faits échangés.

**[Cohérence contrat]** — R-07 · Aucune FR ne dit comment un manifeste entre au catalogue (Q1) (FR-2, FR-4, §7 C1)
`MANIFESTE_CYCLE` suppose une publication de manifeste que le PRD ne décrit pas (qui, quand, quelle garde de comparaison). FR-2 change la forme de `depends` (code + libellé) sans le dire au contrat.
Fix: FR « Publier le manifeste d'une version » ; amender l'exemple de C1 (`depends: [{ code, raison }]`).

**[Cohérence contrat]** — R-11 · Q3 n'est pas reprise, et FR-5 peut être lue contre elle (FR-5, FR-14)
FR-5 traite un prérequis manquant à l'installation, mais rien ne dit qu'une suspension ultérieure ne bascule pas les dépendants en 🟠. L'architecte peut généraliser FR-5 et violer Q3.
Fix: À FR-14 : « Une suspension ne change ni le voyant ni la visibilité des modules dépendants (Q3). »

**[Cohérence contrat]** — R-12 · Les 18 modules commerciaux n'ont pas de dépôt où tenir leur manifeste (QA-1, contrat Q1)
La plupart (CRM, Terrain & Tournées, Application mobile…) n'ont ni service ni dépôt, et certains ne correspondent à aucun code du catalogue. Q1 ne dit pas où vit le manifeste d'un module encore sans service.
Fix: Correspondance module commercial ↔ codes (R-14) ; manifeste tenu au catalogue avec le statut « non octroyable » (`MODULE_NON_OCTROYABLE`) jusqu'à la création du dépôt.

**[Cohérence contrat]** — R-13 · La limite « pas de libre-service » est contredite par FR-33 et Reprise FR-19 (§2.2, §8)
Le §8 dit l'inférence « sans effet sur février » ; or le prospect se sert seul dès février (comptes, import, interface).
Fix: « L'installation reste faite par Money Vibes (y compris l'offre d'essai) ; l'usage, l'import et l'essai sont en libre-service dès février » ; retirer la phrase du §8.

**[Cohérence contrat]** — R-15 · Le feu vert de la Reprise n'a pas de consommateur explicite (FR-6, FR-7, §7 C5)
Aucune FR ne dit que la ligne Reprise reste 🟠 sans feu vert ; C5 ne cite pas le fait. La « réception définitive », qui déclenche une suppression chez la Reprise, n'est définie dans aucun des deux PRD.
Fix: Règle « feu vert ⇒ 🟢 de la ligne Reprise » à FR-7/FR-8 ; « consomme : `reprise.feu-vert` » au §7 C5 ; définir « réception définitive ».

**[Cohérence contrat]** — R-16 · L'écran de libre-service de février n'a pas de lieu (FR-33, Reprise §7 C8 et FR-19)
Un prospect n'a pas accès à la console Money Vibes ; les deux PRD supposent un écran client que ni l'un ni l'autre ne place.
Fix: Décision PO : import en libre-service et essai prospect dans `prospera-app` dès février ; corriger Reprise C8.

**[Cohérence contrat]** — R-17 · Le sort des « réglages » de l'essai contredit la règle de non-copie (FR-8, FR-33)
Les rôles appartiennent à `auth-service`, les zones à `reseau` ; FR-8 ne rejoue que l'offre et les tables. On ne sait pas comment rôles et zones passent dans le réel sans copie.
Fix: Lister ce qui est rejoué et par quel contrat de chaque module propriétaire ; corriger « à frais ».

**[Cohérence contrat]** — R-18 · AD-P16 n'est pas conciliée avec la règle de non-mise en commun (partie 4.C, §3)
Sur site, une console Money Vibes munie des routes AD-P16 est un accès de niveau 2 sans consentement. Sur la plateforme, lecture AD-P16 et niveau 1 se recouvrent. La tension relevée au journal n'est pas tranchée.
Fix: Sur site, routes AD-P16 utilisables seulement en session de support ouverte par le client (FR-23) ; sur la plateforme, une lecture AD-P16 ne vaut jamais contribution ; amender AD-P16.

**[Cohérence contrat]** — R-23 · L'habillage et la configuration par organisation ne sont pas traités (D1, §4.A)
D1 : « la vertical n'est qu'une configuration : un pack, une marque, un tableau de bord d'accueil ». `Entitlement.config` existe déjà. Le PRD ne dit pas qui possède marque, logo, couleurs et accueil, ni si l'installation les pose.
Fix: FR « L'installation pose la configuration d'accueil » avec propriétaire et lecture par la coque, ou « hors moteur, porté par … ».

**[Cohérence contrat]** — R-24 · La relation entre la licence et les entitlements n'est pas définie (FR-13, FR-14)
Gates et coque lisent l'entitlement ; on ne sait pas si la licence importée s'y projette (et sur quelle `source`). `miseAJour` et le gel n'ont pas d'équivalent dans l'entitlement : ce sont des états d'instance.
Fix: « Une licence importée se projette en entitlements (source `licence`) par le point de décision unique de FR-4 ; `usage` → `terme`/`echeanceLe` ; `miseAJour` et le gel sont des états d'instance exposés à part ».

**[Cohérence contrat]** — R-25 · Correspondance module commercial ↔ code ↔ dossier d'écran non écrite (QA-1, contrat C8)
Si un module commercial regroupe plusieurs codes ou si un code n'a pas d'écran propre, la coque ne sait pas si le menu se construit par code ou par module commercial, ni avec quel libellé.
Fix: Colonne « dossier d'écran / libellé de menu » dans la table de R-14 ; menu construit par code, libellé commercial en affichage seulement.

**[Cohérence contrat]** — R-28 · La « fenêtre N/N-1 » du catalogue ne règle pas le retard d'une instance (FR-21)
`fenetre-de-support.ts` limite les majeures `ACTIVE` d'un module à la publication ; elle ne mesure aucune instance. « Deux versions en retard » = N-2, hors N/N-1. Et `Entitlement.versionCode` épingle une version par organisation, alors que le §3 parle d'une ligne de version de plateforme.
Fix: « Au plus une majeure de retard (N-1) », règle nouvelle reprenant le principe ; version de plateforme = ensemble figé de `versionCode`.

### Low (11)

**[Strategic coherence]** — G-05 · La partie C n'a aucun indicateur (§4.C, §6)
Le §1 promet un modèle « meilleur à chaque client signé », mais aucun SM ne le suit. Acceptable si C est explicitement « plus tard » (voir G-01).
Fix: Sinon, ajouter le nombre d'organisations sous consentement de niveau 3.

**[Done-ness clarity]** — G-11 · FR-20 : « sans incident » n'est pas défini (FR-19, FR-20)
Le PRD ne dit pas non plus si le chemin rapide de FR-19 (72 h) contourne les vagues de 7 jours. Il doit les contourner, sinon les deux FR se contredisent.
Fix: Définir « incident » et exempter explicitement les correctifs de FR-19 des vagues.

**[Done-ness clarity]** — G-12 · FR-7 et les lignes « non installé » du §7 C4 (FR-7, §7 C4)
Les lignes Reprise ou Connecteurs « non installé, jamais vertes » bloquent-elles le passage En service d'un client qui n'a pas acheté ces modules ?
Fix: Préciser que seules les lignes de l'offre comptent.

**[Adversarial]** — F-40 · « Suspendre » et « Désinstaller » ont la même définition (§3)
Le contrat distingue `SUSPENDED` et `REVOKED`, avec des effets opposés sur les dépendants (Q2/Q3) ; le vocabulaire « sans synonyme » les rend indiscernables.
Fix: Ajouter qui décide, l'effet sur les dépendants, la réversibilité et la présence au menu.

**[Adversarial]** — F-41 · La vérification quotidienne « n'envoie aucune donnée » (FR-15, FR-16)
Pour savoir s'il existe un correctif « pour elle », l'instance doit au moins s'authentifier et dire sa version. Cette requête compte-t-elle comme contact pour le délai de grâce ?
Fix: Préciser ce qui est transmis et définir « contact » pour FR-15.

**[Adversarial]** — F-42 · J+7 avec un signal hebdomadaire (FR-15, FR-16)
Avec un battement exactement hebdomadaire, un signal retardé de quelques minutes déclenche l'alerte : faux positifs garantis, alertes ignorées ensuite.
Fix: Mesurer « deux signaux manqués » (ou J+8) et retenter le signal en cas d'échec.

**[Adversarial]** — F-43 · Ordre des refus non défini (FR-4, FR-7, FR-12, FR-14)
Un même appel peut cumuler trois causes de refus ; sans ordre, deux implémentations renverront deux codes. « PDF reçu par le dirigeant » n'est pas vérifiable par le système.
Fix: Fixer l'ordre d'évaluation ou renvoyer toutes les causes ; « envoyé et journalisé » au lieu de « reçu ».

**[Cohérence contrat]** — R-08 · La preuve C11 dépend d'un tuyau non décrit (§7 C11, FR-26)
FR-26 liste les indicateurs, mais aucune FR ne dit comment un module avec IA les remet au signal.
Fix: Traiter avec R-04 (clause d'exposition des indicateurs de niveau 0).

**[Cohérence contrat]** — R-19 · Dérive de vocabulaire (UJ-1, UJ-2, PRD Reprise et Connecteurs)
« Environnement de test », « production », « rapport d'import » ; « bascule » (Reprise, Connecteurs) n'est pas définie au §3 et y recouvre « mise en service ».
Fix: Remplacer par les termes du §3 ; définir « bascule » ou la bannir des PRD frères.

**[Cohérence contrat]** — R-26 · Visibilité des bandeaux et fonction d'export non précisées (FR-15, FR-32, FR-33)
Qui est « administrateur » (quel droit) ? Qui voit l'avertissement de préavis et le compte à rebours de l'essai ? Où vit l'export ?
Fix: Une ligne par bandeau dans la FR de R-20 (public, droit, texte) et une FR « Exporter mes données » avec son propriétaire.

**[Cohérence contrat]** — R-29 · En-tête, numérotation, §3 « Organisation » (en-tête, FR-32, FR-33, §3)
En-tête périmé, ordre des FR confus ; une instance sur site héberge aussi l'organisation Money Vibes, qui porte les rôles plateforme de la console.
Fix: Mettre l'en-tête à jour, renuméroter ou renvoyer, et écrire « sert une organisation cliente (plus l'organisation Money Vibes, pour la console) ».

## Mechanical notes

- **Bandeau périmé (ligne 16) :** « Brouillon. Sections rédigées : §0, §1, §2, §3. À venir : §4 […] » alors que tout est rédigé. À corriger avant la lecture du PO, car c'est la première chose qu'il lira.
- **Ambiguïté :** FR-33, « la reprise est rejouée à frais ». « À frais » se lit comme « aux frais du client » ; le sens voulu est « fraîche » (FR-8). Le journal porte la même tournure.
- **Dérive de vocabulaire :** UJ-1 étapes 1 et 3 emploient « environnement de test » et « la production », que le §3 bannit. Le §3 donne à **Suspendre** et **Désinstaller** la même définition. « Suspension » a deux comportements : 403 pour un module (contrat C2) et « consulter et exporter » pour une licence (FR-32).
- **Termes absents du glossaire :** offre d'essai, prospect, bilan d'essai, bilan de mise en service, bilan d'instance (FR-25), recette, module commercial (QA-1).
- **Identifiants :** FR-1 → FR-33 sont uniques et sans trou, mais pas dans l'ordre (FR-33 entre FR-13 et FR-14, FR-32 après FR-25). On peut le garder pour la traçabilité, à condition de le signaler. SM-1 → SM-5 et NFR-1 → NFR-6 sont contigus.
- **Niveau de titre :** « ## 2.3 Parcours clés » devrait être `###` sous « ## 2 ».
- **Codes de refus voisins :** `MODULE_NON_SOUSCRIT` (FR-12) et `MODULE_HORS_LICENCE` (FR-14) sont deux 422 pour « le droit ne couvre pas ce module ». Sur site, lequel prime ? (low)
- **FR-14 :** une suspension par litige arrive « par une nouvelle licence, au contact suivant ». Un client à licence perpétuelle peut l'éviter en coupant la liaison, puisque FR-15 ne sanctionne que par le gel. (low, à acter)
- **Frontmatter :** `verticales` liste Cabinet, que le corps ne traite jamais.
- **Index des hypothèses :** une seule `[ASSUMPTION]` en ligne (§2.2), reprise au §8 : l'aller-retour tient. Aucun `[NOTE FOR PM]`.
- **Contrat de module :** bien cité (§0, §3, §7), et le §7 respecte les onze lignes exigées par le §6 du contrat.

## Reviewer files

- `review-rubric.md`
- `review-adversarial-general.md`
- `review-coherence-contrat.md`
