# Revue de la spine « IA commune de Prospera » (grille good-spine)

Relue : `ARCHITECTURE-SPINE.md` (40 AD) + `.memlog.md` (arbitrages en fin, qui font foi), contre le PRD IA commune (190 FR, annexes A-D), la spine du moteur (amendée le 2026-11-13), la spine de l'assistant (AD-1 à AD-23) et les spines sœurs (microfinance, assurance, distributeur). Lecture seule hors ce fichier. Les versions de la Stack ne sont pas revérifiées ici (elles postdatent mes sources) : je m'en tiens au journal.

## Verdict

La doctrine est juste et bien tenue (proposition immuable, deux boucles séparées, ligne de modèles distincte, gardes doubles), mais la spine n'est pas prête pour les épics : deux contradictions de fond (validité des modèles contre « sert indéfiniment » ; mesure d'équité à la centrale contre l'exclusion des variables sensibles de tout lot) et des amendements du moteur incomplets doivent être corrigés d'abord.

Décompte : **CRITIQUE 2 · HAUTE 8 · MOYENNE 11 · BASSE 6** (27).

---

## CRITIQUE

**C-1. AD-21, AD-33, AD-34 : un modèle installé peut s'éteindre à l'échéance d'une clé, contre la promesse « l'IA sert indéfiniment ».**
AD-21 fait lire « la période de validité sur l'horloge scellée », porte une « fin de validité » au manifeste de modèles et dit qu'un modèle installé « dont la validité est échue retombe en N0 ». Or les clés `ci` sont annuelles (moteur AD-28). Une instance gelée ou à version figée (aucun nouveau certificat ni manifeste) verrait tous ses N1 retomber en N0 au bout d'un an, ce qui contredit AD-33 / FR-85 et le test « horloge avancée de 10 ans : chaque capacité répond » (la capacité répond, mais en règle, donc l'IA « acquise » disparaît).
*Correction :* AD-21 écrit que la validité (certificat, manifeste, fin de validité du paquet) est vérifiée **une seule fois, à l'installation**, sur l'horloge scellée ; un artefact installé n'est ensuite déchu **que** par la liste de révocation ou le fichier d'urgence (AD-34), jamais par l'écoulement du temps. « Fin de validité » du manifeste = fenêtre pendant laquelle le paquet peut être installé. Ajouter à AD-33 le test « horloge +10 ans, gel, modèle N1 toujours servi ».

**C-2. AD-18 contre AD-19 et annexe C.2 : l'équité d'un N1 est mesurée à la centrale, mais le genre, l'âge et les sous-groupes n'y arrivent jamais.**
AD-18 exige une porte d'équité (par genre, zone, secteur, impact disparate) avant toute promotion N1, évaluée « à la centrale » avec Fairlearn. AD-19 impose un lot « sans variable interdite » (le genre l'est) et C.2 liste la variable interdite comme ne sortant jamais. Aucun chemin décidé n'amène les attributs de mesure à la centrale : la porte est inexécutable, ou un développeur ouvrira un champ à l'export pour la faire passer.
*Correction :* trancher dans AD-18/AD-19. Option recommandée : une classe d'export **« agrégats de mesure »** (comptes par sous-groupe × décision × issue, effectif ≥ `k`, calculés sur l'instance par le service, listés au manifeste type, jamais au niveau de l'écart) ; AD-19 reformule « sans variable interdite » en « jamais en entrée, jamais en identifiant, seulement en agrégat de mesure ». Variante : la porte d'équité d'un N1 se joue en ombre sur l'instance et seul son résultat remonte. Dans les deux cas, écrire laquelle des deux implémentations fait foi pour la porte.

---

## HAUTE

**H-1. Amendements du moteur incomplets (AD-39, en-tête du moteur).**
Le moteur est amendé en AD-3, AD-7, AD-14, AD-17, AD-28, AD-32, mais la spine IA en dépend aussi ailleurs sans amendement :
- AD-12 : la liste fermée `type` du journal n'a ni modèle installé, refusé, promu, retour arrière, ni lot d'apprentissage envoyé (`JOURNAL_FORME_INVALIDE` les rejetterait) ;
- AD-22 : l'état voulu n'a pas de cible de ligne de modèles ni de date du DSI pour une promotion, alors qu'AD-21 parle de `versionCible` de modèle ;
- AD-37 : « retour arrière en une action, commande de l'agent » (AD-22 IA) n'existe pas dans la liste des commandes ;
- AD-9 : le signal est un schéma fermé ; `CALIBRATION_DISCORDANTE`, `MODELE_REFUSE_SIGNATURE`, `PALIER_INSUFFISANT` et `ia.indicateurs` ne s'y trouvent pas ;
- AD-13 : la finalité « apprentissage commun » doit figurer au vocabulaire fermé des finalités.
AD-39 omet aussi AD-28 dans sa liste alors que l'en-tête du moteur l'annonce.
*Correction :* ajouter ces cinq amendements (chacun d'une ligne) à AD-39 et à l'en-tête du moteur ; garder chaque amendement minimal.

**H-2. AD-14/AD-19 : l'amendement du niveau « apprentissage » est ambigu et affaiblit l'AD-14 du moteur.**
(a) Le moteur définit les niveaux 0, 1, 2, 3 ; le niveau 3 = contributions (dont l'apprentissage). L'amendement dit qu'`apprentissage-service` « garde les niveaux 0, 1 et 3 » tandis que le niveau « apprentissage » va à la centrale IA : le niveau 3 est donc à la fois gardé et retiré. (b) Le moteur dit « sans les deux approbations, pas d'export » (manifeste avec nombre de lignes, par export) ; AD-19 introduit un « manifeste type approuvé une fois » et « un lot conforme part sans nouvelle approbation », sans l'écrire comme amendement.
*Correction :* nommer le niveau (ex. niveau 4 « apprentissage commun », le niveau 3 restant celui du moteur) ; écrire l'assouplissement comme amendement explicite d'AD-14 : approbation portée par `approbationsExport` de l'état voulu, liée au condensat du manifeste type, caduque à tout changement de manifeste, révocable par nouvel état voulu.

**H-3. AD-2, AD-29, AD-30 : la frontière `assistant` / `automatisations` est indécidable.**
Les deux modules « ne s'importent jamais », mais AD-30 veut des règles `AUTO` sur types non engageants **sans** `assistant`, qui possède mandats, exécutions et outbox. Le tableau d'AD-2 omet les exécutions et la file d'arbitrage d'`automatisations` (que le PRD A.3 lui attribue), et AD-32 produit trois faits voisins pour l'ordre d'exécution (`assistant.action.demandee` produit par les deux modules, `assistant.execution.demandee@1`, `automatisations.execution.demandee@1`) : deux producteurs pour un même fait, ce que l'AD dit empêcher.
*Correction :* décider d'un seul propriétaire de l'agrégat `Execution`, de l'outbox et de la file d'arbitrage, soit en code partagé dans le noyau `ia` (`src/domaine/execution`) que les deux modules appellent par leur contrat public, soit par duplication assumée avec un seul topic sortant. Donner la liste exacte des faits : lequel est l'ordre (topic ratifié par le PO `assistant.action.demandee`), lequel est la trace (`*.execution.*@1`).

**H-4. AD-24/AD-25 contre l'assistant AD-21 : aucun modèle auto-hébergé en ligne.**
La spine ratifiée dit « modèle de production auto-hébergé sur l'infrastructure Money Vibes, API externe jamais un défaut ». AD-24 ne décrit en ligne que des fournisseurs hébergés par la passerelle ; AD-25 ne décrit le modèle ouvert que sous l'agent en local. Conséquences non décidées : un pays à résidence interdite (AD-24 « modèle local seulement ») et un contenu classé santé (AD-27 « modèle local ou refus ») n'ont aucune issue **en ligne** (le distributeur est hébergé par Money Vibes) ; AD-3 range « source du modèle » en une seule différence.
*Correction :* AD-24 ajoute qu'un `LlmProvider` en ligne peut cibler un serveur d'inférence ouvert hébergé par Money Vibes (même port, même garde-fous), et dit si c'est un amendement d'assistant AD-21 ou son application ; sinon déclarer en AD-27 que ces cas rendent le repli en ligne.

**H-5. Enveloppe opérationnelle de `prospera-ia-centrale` non décidée, ni différée.**
Rien sur : sauvegarde/restauration du registre MLflow et des fiches de composition (seule preuve de « quel modèle a vu les données de cette organisation », à conserver comme le registre), RPO/RTO de la centrale, supervision de la centrale elle-même (muette, entraînement bloqué, publication en échec), capacité de calcul d'entraînement (CPU/GPU, hébergement), garde de la clé de signature de la CI de publication côté IA, continuité (le moteur a son AD-35 pour sa centrale). AD-33 ne couvre que les instances.
*Correction :* un AD (ou un alinéa d'AD-20) : sauvegarde 3-2-1 du registre et des compositions avec rétention égale à `ia.registre.retention_annees`, test de restauration mensuel, alerte « centrale IA muette » au ticket de Money Vibes (moteur AD-40), dimensionnement de départ, ou à défaut une ligne en Deferred avec « revoir quand ».

**H-6. AD-20 : la pile de l'API de réception est laissée « au choix du dépôt » `[ASSUMPTION]`.**
La réception vérifie hors ligne le jeton d'export (JWS Ed25519, JCS RFC 8785, chaîne de clés, usage, révocation) : avec FastAPI, c'est une **seconde implémentation** de l'AD-7 du moteur, hors de la Stack (jose est listé pour Node seulement) et des vecteurs signés testés « des deux côtés ». C'est exactement une divergence que la spine doit fermer.
*Correction :* réception en NestJS (réutilise la bibliothèque de vérification et les vecteurs de `prospera-plateforme`) ; Python limité aux travailleurs d'entraînement et d'évaluation, qui lisent le préparé déposé en base ou en stockage objet.

**H-7. AD-19 : le « préparateur » en ligne n'a ni propriétaire, ni unité, ni port.**
« Un préparateur (service de plateforme) lit par la garde les écarts… séparé techniquement de l'entraîneur » : il n'est ni dans le tableau d'AD-2, ni dans le Structural Seed, ni dans les contrats d'AD-32. Deux équipes le construiront différemment (ou il ira dans `ia`, qui lit déjà les écarts, ou dans la centrale, ce qui violerait la séparation).
*Correction :* le nommer, fixer son dépôt, sa base, son compte, son seul droit de lecture (par la garde) et d'écriture (le préparé vers la centrale), ajouter la ligne à AD-2 et au Seed.

**H-8. AD-3 : « exactement sept » différences de profil est faux, donc le balayage de la CI sera faux.**
D'autres différences réelles de comportement sont décidées plus loin : la préparation d'export (préparateur en ligne, agent en local, AD-19), la décision de promotion (fenêtre Money Vibes, date du DSI, AD-22), le N2 « par l'instance ou le service en ligne » (AD-9), le préparateur du taux global, l'essai (AD-36). Le balayage « branche hors des sept points » donnera des faux positifs ou, pire, fera contourner la règle.
*Correction :* porter la liste à ses vrais éléments (ou déclarer ces cas comme adaptateurs sélectionnés par le nom de profil, donc dans la liste) et réécrire le balayage en conséquence.

---

## MOYENNE

**M-1. AD-5, AD-16, AD-39 : états et champs hors de l'annexe B, et un désaccord avec l'assistant ratifié.**
(a) `masquee: true` (échantillon aveugle) n'est pas un champ de l'annexe B, que l'AD dit reprendre « sans la redéfinir ». (b) `NON_SOURCEE` : « non affichée » (AD-5, annexe B) contre l'assistant AD-3 « visible, non acceptable, jamais une absence de ligne » ; le PRD lui-même se contredit (« retirée de l'affichage » vs « visible »). (c) L'assistant AD-3 a aussi `BLOQUEE`, absent des statuts d'AD-5 et non amendé.
*Correction :* trancher (recommandé : visible au registre et au rôle habilité, jamais comme proposition acceptable à l'utilisateur), amender l'assistant AD-3 dans AD-39, ajouter `masquee` à l'annexe B ou le porter en en-tête de réponse, dire le sort de `BLOQUEE`.

**M-2. AD-1 contre ses propres écarts et l'assistant AD-7.**
« Le noyau ne détient aucune donnée métier » alors que l'écart garde valeur prédite, valeur retenue, issue et montant (AD-13/AD-14). L'assistant AD-7 dit « ce que l'assistant possède… rien d'autre » ; la microfinance (AD-25) attend l'amendement explicite d'AD-7 pour le journal des écarts. AD-39 dit « ratifiées et étendues » sans le faire.
*Correction :* définir « donnée dérivée d'apprentissage » (minimale, pseudonymisée, hors texte libre) comme seule exception à AD-1 et amender l'assistant AD-7 en toutes lettres.

**M-3. AD-21, AD-25, AD-33 : le paquet de modèle de langage et sa sauvegarde.**
AD-21 définit l'artefact comme « poids ONNX (ou règles et gabarits) » ; le GGUF (AD-25) n'est pas dans la définition, ni sa taille (plusieurs Go : téléchargement repris, clé USB, quota de disque, N et N-1 conservés deux fois). AD-33 sauvegarde « modèles en service et précédent avec les données » **et** dit « un modèle absent est réinstallé du paquet signé » : deux stratégies contradictoires, la première gonfle la copie quotidienne.
*Correction :* sauvegarder le manifeste, l'empreinte et la calibration ; garder les paquets signés N/N-1 dans un cache local hors sauvegarde de données ; AD-21 inclut GGUF, reprise sur morceaux et budget de disque.

**M-4. AD-18, Stack : parité des deux implémentations et chaîne de conversion.**
Métriques implémentées deux fois (Fairlearn, TypeScript) « à la tolérance près » sans tolérance chiffrée ni arbitre ; ONNX entraîné/validé avec `onnxruntime` Python 1.32.0 mais servi par `onnxruntime-node` 1.31.1 (opset non épinglé) ; `skl2onnx` 1.20.0 (janvier 2026) face à `scikit-learn` 1.9.1 (septembre 2026) : compatibilité non vérifiée au journal.
*Correction :* épingler l'opset et ajouter un test de parité d'inférence Python/Node sur vecteurs signés ; chiffrer la tolérance (paramètre) ; vérifier et consigner la compatibilité skl2onnx/sklearn et onnxmltools/LightGBM, sinon épingler l'ancienne sklearn de la centrale.

**M-5. AD-34 : « la clé `centrale` ne signe que le jeton d'export et l'état voulu » contredit le moteur AD-28.**
Le moteur lui fait signer licences, sanctions, état voulu, heure de référence, jetons d'export, approbations d'export et fichiers de rétablissement/prolongation.
*Correction :* « la clé `centrale` ne signe **jamais** un artefact de modèle ; ses signatures restent celles d'AD-28 ».

**M-6. AD-5 : règle de la confiance auto-contradictoire.**
« Aucun test, file, mode ne lit la confiance pour décider » mais « sous `ia.proposition.confiance_min` : je ne sais pas et règle N0 » : le service décide sur la confiance.
*Correction :* « la confiance n'ouvre aucune autonomie, ne route aucune validation, n'ouvre aucun mode ; son seul usage décidé est le repli d'affichage sous `confiance_min` ».

**M-7. AD-5, AD-22, AD-32 : codes et délais.**
`MODULE_DEPENDANCE_MANQUANTE` : 409 (annexe B) contre 422 (moteur AD-23 et conventions d'erreurs). `ia.promotion.retour_max_min` (15 min, SM-10) n'apparaît dans aucun AD alors que la bascule/retour doit rester sous la coupure du moteur (AD-11). Les valeurs HTTP restent `[ASSUMPTION]` sans date de fermeture.
*Correction :* une seule table de codes (adopter 422 du moteur pour ce code), lier `retour_max_min` à AD-22, fermer les valeurs avant la première story du port.

**M-8. AD-39 : les spines sœurs ne sont pas encore amendées et leurs champs divergent.**
Microfinance AD-14, assurance AD-10, distributeur AD-19 disent toujours « service porteur à cadrer / PropositionPort ne bougera pas / son propre contrat », avec `parametresVersion` et `strategieVersion` ; la spine IA et l'annexe B disent `versionParametres` et n'ont pas `strategieVersion`.
*Correction :* ajouter à AD-39 la table de correspondance des champs (renommages) et la liste des trois amendements à porter (avec leur PR), ou aligner la spine IA sur les noms existants.

**M-9. AD-3, AD-17, AD-21 : montée en charge en ligne et chemin chaud en Node non décidés (FR-175, FR-177, FR-185).**
ONNX en processus, recalibration TypeScript pour toutes les organisations, files de langage et API dans le même processus Node : rien n'impose de séparer l'API des travailleurs (`worker_threads` ou déploiement `worker`), ni de répartir la nuit par organisation entre répliques, ni de lier 99,5 %, RTO 60 min, RPO 60 min à une disposition (jeu de répliques, plusieurs répliques sans état). Un travailleur de nuit peut affamer la boucle d'événements et casser `n0_p95_ms`.
*Correction :* un alinéa : même image, deux rôles (API, travailleur) ; calcul et inférence hors boucle d'événements ; répartition par `organisationId` ; dimensionnement de recette 50 organisations.

**M-10. AD-8 contre AD-17 : « N2 = calibration ou modèle de l'organisation ».**
Aucun Python sur l'instance, donc aucun modèle d'organisation ne peut exister (AD-17, AD-21).
*Correction :* AD-8 : « N2 = calibration de l'organisation » en v1 ; un modèle d'organisation est un horizon (Deferred).

**M-11. Le journal des arbitrages (`.memlog.md`, « fait foi ») n'est pas replié dans la spine.**
Q-1 (port 3418), Q-3 (llama-server : conteneur à part, activé à P1+, P0 sans modèle par défaut), Q-4 (réception séparée de `apprentissage-service`), Q-5 (5 % retenu) sont tranchés au journal mais restent « question » ou `[ASSUMPTION]` dans la spine ; AD-25 dit toujours « dans le projet Compose de l'IA », alors que le moteur AD-10 ne connaît que les projets d'espace (essai, réel) et le projet de l'agent : un tel projet n'existe pas, et la question « un serveur de langage par espace, ou partagé entre essai et réel ? » (mémoire) n'est ni posée ni tranchée.
*Correction :* passer les points tranchés en `[ADOPTED]`, vider les questions closes, réécrire AD-25 sur la décision du journal et trancher le partage essai/réel (recommandé : un seul serveur, rattaché au projet de l'agent, deux espaces clients).

---

## BASSE

**B-1. Conventions : le format de droit cité est périmé.** `^[a-z]+:[a-z-]+:[a-z]+$` refuse `ia-centrale:modele:entrainer` ; le moteur l'a élargi (EPIC-142). Citer le format courant ou renommer `iacentrale`.

**B-2. AD-5 : le « schéma JSON » du contrat n'indique pas la version de JSON Schema** (draft-07 chez la Reprise, AD-26 du moteur). L'épingler.

**B-3. `ia.export.k_min` à trois sens** (effectif par groupe en AD-19, nombre d'organisations en AD-15 et AD-20) avec `k_personnes_min` à côté. Écrire, à chaque emploi, lequel des deux paramètres s'applique, ou scinder `k_organisations_min`.

**B-4. Capability → Architecture Map : des FR sans liaison directe** (FR-22, FR-98, FR-101, FR-103 à FR-109, FR-111, FR-115 à FR-124, FR-126, FR-146 à FR-159, FR-175, FR-185, FR-187). La plupart sont des fiches de capacité couvertes par AD-7 ; dire qu'elles le sont. FR-175 (latences), FR-185 (charge) et FR-187 (accessibilité) méritent une ligne dans AD-38 ou AD-35.

**B-5. Deferred : « machine d'IA à part » (trou T-02).** AD-25 la promet déjà « avec sauvegarde, supervision, horloge, clés comme le reste » : le report ne doit pas permettre de la livrer sans cela. Ajouter la condition de sortie « aucun devis sans sa sauvegarde ».

**B-6. Versions : épingler et dater au journal l'identité exacte de `llama-server`** (tag de publication `v1.0.0` à confirmer, empreinte de l'image) et rejouer la vérification des versions à la story de pointe de chaque dépôt ; plusieurs versions du journal (MLflow 3.18.0, onnxruntime-node 1.31.1, openai 7.57.0) n'ont pas été revérifiées ici.
