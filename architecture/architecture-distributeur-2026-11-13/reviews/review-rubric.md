# Relecture (grille good-spine) — Spine Distributeur, 2026-11-13

Lecture seule de `ARCHITECTURE-SPINE.md` (28 AD) et de son `.memlog.md` (dernières entrées = arbitrages de l'assembleur, qui font foi), contre le PRD, la spine du moteur, les spines microfinance et assurance, les manifestes et le code mesuré de `prospera-paiement-service`.

## Verdict

La spine est solide sur la chaîne de vente, la Créance, les séries et le freelance, mais elle n'est pas prête pour les épics : trois points font diverger deux développeurs (l'encours que l'arbitrage a déjà changé mais que l'AD-9 contredit encore, la perte zéro de NFR-1 sans mécanisme décidé, l'étanchéité du freelance qui fuit par la Créance), et huit points de gravité haute, dont des contradictions avec les spines microfinance et moteur sur les modules partagés.

Décompte : CRITIQUE 3, HAUTE 8, MOYENNE 12, BASSE 6.

## CRITIQUE

### C-1 — AD-9, AD-16, AD-20, Q-3 : la spine contredit l'arbitrage de l'assembleur sur l'encours
- Le `.memlog.md` (dernière entrée) tranche : la fonction d'encours est UNIQUE et identique partout, recouvrement compris, qui lit les commandes validées non facturées par les faits de commande ; la variante « sans les commandes » est refusée.
- L'AD-9 écrit encore la variante refusée (`[ASSUMPTION]`, « recouvrement évalue sur créances moins crédit du tiers, sans les commandes non facturées »), Q-3 reste ouverte, le tableau d'AD-20 ne donne pas `commande.engagement-tiers.changed@1` à `recouvrement` comme consommateur, et le manifeste `recouvrement` n'a pas `commande` dans `enrichiPar`. Résultat : deux formules, exactement ce que le Prevents d'AD-9 dit empêcher.
- Correction : réécrire la ligne AD-9 « Blocage » : `recouvrement` appelle `prospera-plateforme/encours` (même version épinglée que `commande` et `pdv`) avec les trois entrées ; supprimer le `[ASSUMPTION]` et fermer Q-3 ; ajouter `recouvrement` aux consommateurs de `commande.engagement-tiers.changed@1` (AD-20) et `commande` à `enrichiPar` du manifeste recouvrement (AD-27) ; préciser que sans `commande` (IMF) l'engagement vaut 0 ; ajouter l'arête `CMD -.-> REC` au diagramme ; ajouter un test « même entrée, même encours dans commande, pdv et recouvrement ».

### C-2 — AD-5, AD-26, Deferred : NFR-1 (aucune perte de facture, avoir, bon, compteur, encaissement) n'a aucun mécanisme décidé
- NFR-1 exige zéro perte ; le RPO hérité (moteur AD-16) est 1 h, copie hors machine sur l'hôte du poste central, MongoDB en jeu de réplicas à un nœud. L'AD-5 « le compteur repart au maximum de ce qu'il lit, des Créances de `paiement` et des têtes ancrées chaque jour (AD-21) » ne protège pas : `paiement` est restauré au même instant, l'ancrage est quotidien, et un numéro déjà remis au client (PDF par WhatsApp) peut être réémis. Le mécanisme est `[ASSUMPTION]` et l'écriture synchrone est renvoyée en Deferred ; or c'est ce qui fait diverger Dev A (moteur) et Dev B (ventes).
- Correction : un AD (ou amendement du moteur AD-16 porté par AD-27) qui décide : (a) les collections de séries, factures, avoirs, bons et les encaissements confirmés de `paiement` s'écrivent avec `writeConcern {w: majority, j: true}` ET sont répliquées en continu vers le second support (flux d'oplog ou outbox acquittée) avant que le numéro ou le PDF ne soit remis ; (b) la tête de série est publiée avec `acks=all` et le topic `facturation.serie.changed@1` est conservé sans expiration, la restauration le rejoue ; (c) à défaut, le PO accepte par écrit une perte plafonnée (ex. 5 min) et NFR-1 est amendé. Retirer l'item de Deferred ; le mettre en Question ouverte avec propriétaire et échéance.

### C-3 — AD-7, AD-10, AD-20 : la Créance du freelance fait fuir son prix vers les consommateurs de la société
- L'AD-10 isole la facture du freelance par un fait distinct, mais la Créance de cette facture est ouverte dans `paiement` (périmètre du freelance) et `paiement.creance.changed@1` / `paiement.encaissement.changed@1` sont lus par `recouvrement`, `pdv`, `dashboard`, `finance-transactions`, `facturation` (balances). Rien ne dit comment ces consommateurs ne voient pas une Créance au prix du freelance (montant, reste dû, tiers = détaillant du freelance) : « n'entre dans aucune balance » (AD-7) est un voeu, pas une règle. Le test annoncé ne couvre que les réponses et faits reçus par un consommateur de la société, sans dire que les topics `paiement.*.changed@1` sont partitionnés.
- « Seuls `paiement` et le service du freelance consomment » (AD-10) n'a aucun moyen d'application : un groupe de consommateurs quelconque peut s'abonner à un topic Kafka.
- Correction : (1) topics distincts pour le périmètre freelance (`paiement.creance-freelance.changed@1`, `paiement.encaissement-freelance.changed@1`) ou champ `perimetre` obligatoire filtré côté publieur ; (2) ACL Kafka par groupe de consommateurs sur ces topics, déclarées dans les manifestes (C5) et vérifiées par un test de câblage ; (3) dire où vivent les factures du freelance dans `facturation` (collection séparée `facturation_factures_freelance`, jamais une colonne filtrée de `facturation_factures`) ; (4) étendre le test « zéro occurrence du prix freelance » aux faits `paiement.*` et aux lectures de `recouvrement` et `dashboard`.

## HAUTE

### H-1 — Q-1, Q-2, Q-4, AD-2, AD-11, AD-13 : les autres arbitrages du `.memlog.md` ne sont pas portés
- Arbitrés par l'assembleur : Q-1 `entrepot` reste dans `prospera-ventes-service` ; Q-2 fait `facturation.releve-vente.emis@1` et source `RELEVE_VENTE_COMPTE` acceptés, fait `facturation.facture-freelance.emise@1` accepté ; Q-4 `politiqueAppareilPerdu` réglage de verticale. La spine garde AD-2, AD-11, AD-13 en `[ASSUMPTION]` et Q-1, Q-2, Q-4 ouvertes.
- Correction : passer ces trois AD à `[ADOPTED]` (en gardant `[ASSUMPTION]` sur l'écriture de l'amendement de `paiement` par Dev A), retirer Q-1, Q-2, Q-4 de « Questions ouvertes » ; aligner le manifeste `entrepot` (« peut s'adosser à stock-service » à amender, AD-27).

### H-2 — AD-3 : « dans une seule transaction » traverse deux services
- La validation enchaîne contrôles, réservation chez `stock` (appel API synchrone, AD-8), émission des bons `BL-` (compteur `$inc`) : une transaction MongoDB ne couvre pas l'appel à `stock`. « Un contrôle qui échoue ne laisse aucune réservation » n'est pas réalisable tel qu'écrit ; aucune compensation n'est décidée (réservation posée puis écriture du bon en échec, crash du processus).
- Correction : réécrire la Rule en séquence : (1) contrôles, (2) réservation `<commandeId>:<version>` idempotente chez `stock`, (3) transaction locale (états, bons, numéros, engagement), (4) sur échec de (3), `commande` libère la réservation par la même API avec la même clé ; un job de réconciliation compare `stock.reservation.changed@1` aux commandes `VALIDEE` et libère toute réservation orpheline ; test « crash entre (2) et (3) ».

### H-3 — AD-20 : le catalogue « fermé » contredit les spines sœurs et le moteur
- La règle « un nom absent du tableau ne se publie ni ne se consomme » exclut des faits déjà fixés : `recouvrement.plan-etalement.decide@1`, `recouvrement.contentieux.transfere@1`, `recouvrement.perte.decidee@1` (IMF AD-9 et AD-20, consommés par `coeur-sfd`) ; `terrain.visite.changed@1` doit porter `visitePar` (IMF AD-15) ; `paiement.abonnement.impayee` et `.regularise` (moteur AD-19, AD-42) ; faits de la Reprise (`reprise.feu-vert.changed`).
- Correction : ajouter ces faits au tableau, ou écrire « ce catalogue s'ajoute à ceux de la microfinance, de l'assurance et du moteur, qui font foi pour leurs faits » ; ajouter `visitePar` à la charge de `terrain.visite.changed@1` ; faire de « faits du noyau partagé = union des verticales » une règle d'AD-15.

### H-4 — AD-9, AD-16 vs IMF AD-6 et AD-20 : qui calcule les jours de retard, et ce que voit `recouvrement`
- Spine IMF : `recouvrement` « ne calcule ni pénalité, ni intérêt, ni retard » ; les jours de retard viennent de `risque-par`. Spine distributeur : `recouvrement` possède la table des seuils (J+1, J+30, 60 jours) et ouvre un dossier « quand une Créance passe le premier palier » ; `paiement.creance.changed@1` ne donne que `montantExigible` et `lueLe` : aucune échéance ; il n'y a pas de `risque-par` pour le distributeur. Deux développeurs écriront deux calculs de retard.
- Même module : IMF AD-6 définit `montantExigible` par une formule unique ; AD-7 distributeur définit `reste_du` et un encaissement « déclaré » qui réduit l'affichage ; on ne dit pas si `montantExigible` compte le déclaré (une relance doit-elle s'arrêter sur un encaissement déclaré non confirmé ?). Les tranches de la balance âgée sont calculées par `facturation` et `recouvrement` sans propriétaire unique.
- Correction : ajouter `echeanceLe` et `montantExigible` (déclaré exclu, `montantDeclare` à part) à `paiement.creance.changed@1` ; fonction pure `prospera-plateforme/retard` (jours, tranches) utilisée par `recouvrement`, `facturation`, `dashboard` ; réglage de verticale `sourceDuRetard: CREANCE | RISQUE_PAR` ; un seul propriétaire des tranches (`recouvrement`) ; le tout en AD-15.

### H-5 — AD-13, AD-15 vs IMF AD-19 : une application mobile, deux règles d'envoi, aucune décision pour les départager
- `prospera-terrain` est une seule application, servie à l'IMF (ordre : collectes, puis missions de recouvrement urgentes ; plages de reçus `RC-…` attribuées par `collecte` ; encaissement d'espèces = ligne de `collecte`) et au distributeur (ordre causal visite, commande, livraison, encaissement ; espèces envoyées à `paiement`, remise chez `terrain`). Le manifeste `terrain` sait que la remise est propre au distributeur, mais AD-13 et AD-15 ne le disent pas et AD-15 promet des objets « neutres ».
- Correction : en AD-15, ajouter « la table des routes de synchronisation, l'ordre d'envoi, la politique d'appareil perdu et les objets optionnels (remise d'espèces) sont une donnée de la verticale, chargée par l'application à l'ouverture de session » ; nommer que `terrain.remise.*` n'existe que lorsque `paiement` est la voie d'encaissement des espèces ; test « IMF et distributeur sur le même binaire ».

### H-6 — AD-26 et Déploiement : l'enveloppe opérationnelle hébergée est décrite par ce qui change, pas décidée
- Non décidés ni différés explicitement : (a) disponibilité cible et remise en route (le RTO de 4 h du moteur n'est pas repris ; NFR-9 ne parle que du retour arrière) ; (b) capacité : 5 services neufs × 2 espaces plus `paiement`, `notification`, `assistant`, Kafka, Mongo sur un hôte unique (haute disponibilité différée par le moteur) : dimensionnement et point de défaillance unique non nommés ; (c) **garde des clés** : l'IMF repose sur une clé maîtresse déverrouillée par DG et DAF, hors du compte d'administration (IMF AD-18) ; pour un hébergé, Money Vibes est exploitant ET sous-traitant, et l'AD-26 ne dit pas qui détient la clé de `champs-sensibles`, ni si le support Money Vibes peut lire une pièce, un téléphone ou une position ; (d) accès du support (moteur AD-20) et localisation des données ; (e) isolation essai et réel (bases, topics, Karapace par espace) ; (f) supervision : la route `sante` est citée, pas les alertes propres aux 5 services (consommateurs bloqués, retard de l'outbox, dérive d'une série).
- Correction : ajouter un AD « Enveloppe opérationnelle hébergée » qui décide ou renvoie en Question ouverte chaque ligne (a à f) avec propriétaire ; pour (c), proposer : clé détenue par l'organisation (DG et DAF au déverrouillage), jamais par le personnel de Money Vibes ; sinon l'écrire comme risque assumé par le PO.

### H-7 — AD-6, AD-18 : le lien public de la facture n'est couvert par aucun AD
- Le PRD (FR-46, FR-249, ligne 805) prévoit un lien propre à la facture, expirant à 7 jours, ouvertures journalisées, envoyé par WhatsApp ou SMS, exigé en février. C'est une route publique sans authentification qui sert un PDF ; l'AD-23 (portée appliquée par le serveur) ne s'y applique pas. Qui le sert, format du jeton, limitation de débit, révocation, cas d'une facture de freelance : rien.
- Correction : un AD « liens d'accès publics » : jeton opaque de 128 bits stocké haché, servi par un seul module (`facturation`), expiration paramétrée, limitation de débit, journal d'ouverture en piste d'audit, jamais le prix du freelance dans un lien de la société ; test d'énumération.

### H-8 — AD-16, AD-1 : la spine marque `[ADOPTED]` ce que le code existant contredit
- `paiement-service` contient déjà un module `promesses` (schéma, statuts, `constateeLe`, montant constaté) : `paiement` écrit la promesse. AD-1 et AD-16 donnent la promesse à `recouvrement` et le constat seul à `paiement`, Q-6 reste ouverte, et aucun AD ne dit comment le module codé migre. Le code n'a ni crédit du tiers, ni source de Créance, ni `paiement.creance.changed@1` ; il porte `organizationId`/`orgId` ; son module `points-de-vente` (affiches de paiement) n'est pas nommé face au `pdv` du distributeur.
- Correction : AD-27 : table « existant de `paiement` → cible » (promesses : propriété cédée à `recouvrement` par migration SANS_PERTE ; `points-de-vente` de `paiement` documenté « affiche de paiement », jamais le `pdv` ; consommateurs qui lisent les deux graphies d'organisation) ; fermer Q-6 avec un propriétaire (Dev A) ; AD-16 passe à `[ASSUMPTION]` tant que la migration n'est pas décidée.

## MOYENNE

- **M-1 — AD-4 : clés d'idempotence incomplètes.** Seules la facture d'une livraison, la réservation et la sortie ont une clé. Manquent : avoir, relevé `RVC-`, facture du freelance (même bon que la facture société), seconde facture d'un reliquat, ordre de versement de commission. Correction : tableau complet « geste → clé » ; `<bonId>:facture-freelance`, `<bonId>:rvc`.
- **M-2 — AD-9 : fenêtre de cohérence engagement / Créance.** L'engagement baisse (fait de `commande`) pendant que la Créance monte (fait de `paiement`, moins de 5 s) : la même vente compte deux fois ou zéro, et deux validations de 600 000 peuvent passer. Correction : l'engagement d'un bon ne baisse que quand la Créance de sa facture est lue (la Créance porte `bonId`), ou l'encours déduplique par `bonId`.
- **M-3 — AD-24 : le contrôle de reprise ignore les crédits clients.** La balance Sage est nette des avoirs et acomptes non imputés ; aucun objet `credit-tiers` n'est repris. Correction : objet `credit-tiers@1` (propriétaire `paiement`) ou contrôle sur factures ouvertes seules avec crédits signalés.
- **M-4 — AD-6, Stack : le PDF figé n'est ni placé ni dimensionné.** Moment du rendu, stockage (MinIO, empreinte, sauvegarde), bibliothèque en ASSUMPTION, lien avec NFR-7 (facture en moins d'une seconde). Correction : numéro attribué dans la transaction, état `PDF_EN_ATTENTE`, rendu asynchrone, SHA-256 sur la facture, bibliothèque épinglée avant la première story.
- **M-5 — AD-1, AD-20 : trois grammaires déclaratives sans règle commune** (KPI de `dashboard`, segments de `marketing`, règles d'`automatisations`). Correction : schéma JSON commun (draft-07, moteur AD-26) pour les conditions, ou trois grammaires nommées avec propriétaires.
- **M-6 — AD-19 : le port d'IA n'hérite pas de tout ce que fixe la microfinance.** Absents : paramètres du score en entrée de la demande, liste fermée de variables autorisées, consentement avant export des écarts, amendements de la spine de l'assistant (IMF AD-25) si elle porte l'instance. Correction : recopier ces règles dans AD-19.
- **M-7 — AD-13, AD-23, Deferred : positions chiffrées et géofencing.** Le chiffrement par champ interdit les requêtes de distance côté base ; le lieu du calcul n'est pas dit. Le chiffrement de la base locale est en Deferred alors que l'application est partagée avec l'IMF. Correction : « déchiffrement dans le service, calcul en mémoire » ; une décision unique pour les trois verticales.
- **M-8 — AD-14 : distribution et mise à jour de l'application.** « Lien d'installation sans boutique » laisse Android seul (iOS non traité), et `CLIENT_TROP_ANCIEN` suppose une mise à jour que l'appareil doit pouvoir faire hors boutique. Correction : décider la plateforme, le mécanisme de mise à jour et le comportement de la file pendant le blocage.
- **M-9 — AD-2, AD-27 : propriétaires de dépôts et publication des bibliothèques.** Pas de propriétaire par service (règle moteur : Dev A et Dev B jamais dans le même dépôt la même semaine), pas de mode de publication des bibliothèques (`series`, `encours`, `champs-sensibles`) : « version épinglée » sans paquet. Correction : tableau service, propriétaire, semaine de naissance ; paquets privés comme `prospera-adaptateurs` (moteur AD-26).
- **M-10 — AD-17 et AD-25 : essai de paiement, deux règles.** AD-17 : mode de test du fournisseur ; AD-25 et C13 : sortie réelle interceptée. Le mode de test de PI-SPI n'est pas vérifié. Correction : interception d'abord, bac à sable seulement s'il est vérifié (source citée).
- **M-11 — AD-15 : « cinq capacités existent dès maintenant dans les contrats ».** Demande-t-on au distributeur de construire épargne, tiers collectif, PAR ? Correction : « contrats réservés, non implémentés ici ; propriétaire = spine microfinance ».
- **M-12 — AD-8 vs manifeste `commande` : `stock` est `enrichiPar` mais la validation est impossible sans lui.** Le moteur peut installer `commande` sans `stock`. Correction : `depends` (amender le manifeste, AD-27) ou mode brouillon seul explicite.

## BASSE

- **B-1** Stack : NestJS 12 et Mongoose 9 existent (la spine assurance le note) ; écrire « report assumé » ; vérifier Flutter 3.50 avant l'épinglage.
- **B-2** Capability map : `studio-social` est rattaché à AD-16 (recouvrement) ; `conquete-objectifs` et `approvisionnement` ne sont couverts que par des AD généraux.
- **B-3** AD-9 écrit « décidé par le DAF seul » : écrire le droit (`recouvrement:credit:debloquer`) pour que l'IMF (ROC) règle autrement sans changer le code.
- **B-4** Q-7 (port 3011) reste ouverte : assistant et microfinance le revendiquent ; décider ou renvoyer au moteur.
- **B-5** Le manifeste `facturation` (« M09 partiel, STORY-647/649 ») et le memlog (« seuls paiement et notification sont codés ») ne sont pas réconciliés.
- **B-6** Diagramme : manquent `CMD -.-> REC` (C-1), `FRL -.-> PAY`, `dashboard` et `automatisations`.

## Grille

| Critère | Résultat |
|---|---|
| Points de divergence fixés | Partiel : C-1, C-2, C-3, H-2, H-4, H-5 |
| Rule applicable, empêche la divergence | Bon pour AD-1, 4, 5, 6, 7, 8, 12, 21, 22 ; faible pour AD-9 (contredit), AD-10, AD-13, AD-26 |
| Deferred sans divergence possible | Non : écriture synchrone (NFR-1), chiffrement local, distribution de l'application |
| Technologie vérifiée | Oui (versions datées) ; reste B-1, M-4 |
| Ratifie le code et les spines existants | Partiel : H-8 (promesses), H-3 (faits), manifestes entrepot, recouvrement, commande |
| Couverture du PRD parties 2, 3, 4 | Bonne ; trous : H-7 (lien public), M-3 (reprise), M-4 (PDF) |
| N'affaiblit pas l'hérité, ne contredit pas IMF et assurance | Non : H-3, H-4, H-5, H-6 (clés) |
| Enveloppe opérationnelle décidée, différée ou en question | Non : H-6, C-2 |
