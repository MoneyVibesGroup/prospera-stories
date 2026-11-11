# Vérification finale : contrôle ciblé et concordance des documents

Date : 2026-11-11. Spine vérifiée : `ARCHITECTURE-SPINE.md` (finale, AD-1 → AD-42), `.memlog.md` (D-1 → D-18, Q-1 → Q-11). Aucun fichier modifié hors celui-ci.

**Bilan** : partie 1 : 38 lignes (5 P, 13 C, 20 N) → **35 OK, 3 PARTIEL (P-4, N-7, N-8), 0 KO** ; plus **5 nouvelles contradictions ou trous** (NC-1 à NC-5) introduits par la dernière passe ; aucun reste de TPM, de scellement matériel, de gel à 7 jours ni de `min(7 j, moitié)` hors Deferred. Partie 2 : 8 fichiers, 33 passages → **27 concordent, 6 écarts** (1 de fond : « suspension » d'un hébergé impayé en spine contre le PRD ; 5 mineurs de formulation ou de renvoi). Les renvois « AD-n de la spine du moteur » pointent tous vers la bonne AD (le renvoi AD-41 de la spine de la coque AD-23 est exact mais incomplet : AD-24 est la règle).

## Partie 1 : le contrôle ciblé

### P-1 → P-5 (constats partiels)

| id | verdict | preuve | correction |
|---|---|---|---|
| P-1 | OK | AD-28 : deux familles de clés d'`usage` distinct (`ci` scellées dans la CI : images, manifeste, agent ; `centrale` scellée sur l'hôte de la centrale, trimestrielle : licences, état voulu, heure de référence, jetons d'export, approbations, fichiers de rétablissement et de prolongation) ; AD-7 reprend les deux `usage` ; D-14. | aucune |
| P-2 | OK | AD-35 : le fichier de rétablissement porte le dernier compteur et un jeton d'enrôlement à usage unique ; l'agent fixe `dernier + 1` ; le certificat vient du jeton (AD-29). Plus de compteur NV de TPM. | aucune |
| P-3 | OK | AD-17 : `abonnement.contrat.signe` (une ligne de niveau 3 par finalité), producteur `paiement-service`, consommateur agent de la plateforme ; AD-13 le cite. D-17. | aucune |
| P-4 | PARTIEL | AD-19 ferme le trou (la partie A de la plateforme consomme `.impayee` et `.regularise` d'un hébergé) et AD-42 est corrigée. Mais (a) AD-19 nomme `paiement.abonnement.echeance.impayee` : le nom réel, partout ailleurs, est `paiement.abonnement.impayee` (et `.regularise` sans `.echeance`) ; la ligne d'AD-17 « `…echeance.encaissee`, `.impayee`, `.regularise` » est ambiguë ; (b) AD-19 et AD-42 parlent de « suspension » de l'hébergé, alors que le PRD (§3.1 « Suspendre », FR-32, FR-41, addendum A-9, décision PO du 2026-11-10) dit qu'un impayé ne produit **jamais** `SUSPENDU` : le parcours est `PREAVIS` 30 jours puis `LECTURE_SEULE`. | AD-17 : trois lignes distinctes (`paiement.abonnement.echeance.encaissee`, `paiement.abonnement.impayee`, `paiement.abonnement.regularise`). AD-19 et AD-42 : remplacer « en déduit la suspension et la reprise » par « en déduit le parcours de l'impayé (préavis 30 jours, lecture seule, FR-32 et FR-41) et la régularisation ; `SUSPENDU` reste une sanction décidée ». |
| P-5 | OK | AD-15 : l'agent ordonne à la partie A de l'essai cible `SUSPENDRE_ECHEANCES` puis `REPRENDRE_ECHEANCES` par `instance.espace.ordre.donne` / `.execute` (AD-17, D-17) ; la partie A annule puis recalcule ses tâches (AD-6) ; l'agent n'a jamais accès à son Redis. | aucune |

### C-1 → C-13 (contradictions)

| id | verdict | preuve | correction |
|---|---|---|---|
| C-1 | OK | D-12 : pas de TPM. AD-4 niveau unique `LOGICIEL` ; « TPM » n'apparaît que dans le Deferred (ligne « Niveau d'ancrage `TPM` »). Config minimale sans TPM, second support obligatoire. | aucune |
| C-2 | OK | AD-4 : le compteur s'incrémente de un à chaque contact préparé, l'empreinte envoyée est celle calculée à cet incrément, un contact repris renvoie le même couple ; compteur du miroir logiciel défini. | aucune |
| C-3 | OK | `sanctions` retiré comme champ distinct : AD-22 (« portées par la licence, son seul canal »), AD-1, AD-7, AD-26 (vecteurs sans « sanction »). AD-8 : un seul canal. | aucune |
| C-4 | OK | AD-17 couvre désormais : route interne d'`auth-service`, `identity.org.created`, ordre de naissance (`POST …/naissances`), contrat d'envoi de `notification-service`, approbation d'export (`approbationsExport`), jeton d'enrôlement, fichiers de rétablissement et de prolongation, `instance.commande.executee`, contact, registre. Résidus mineurs : voir NC-2. | voir NC-2 |
| C-5 | OK | AD-36 « Répartition » : l'exécuteur porte magasin, miroir, état de confiance, horloge, `GET /heure`, clients Kafka, vérification, chargement des images, `docker compose` ; le contact porte la liaison sortante et le tirage vers un volume de dépôt, sans Kafka ni vérification. AD-6, AD-10, AD-17 (`GET /heure` : agent exécuteur), AD-34 concordent. Résidu : NC-3. | voir NC-3 |
| C-6 | OK | AD-22 : `agentCible` dans l'en-tête protégé du JWS, lisible par toute version ; AD-26 le répète ; mise à jour de l'agent seul, hors plan (AD-3), tirée par le contact. | aucune |
| C-7 | OK | AD-37 : `module.installer`, `module.retirer`, `espace.rafraichir` déposées par la partie A ; AD-2 et AD-15 y renvoient ; AD-17 a la ligne `POST …/commandes` et `instance.commande.deposee`. | aucune |
| C-8 | OK | AD-10 : un seul Traefik, projet `<instance>-agent`, hors socle d'espace ; diagramme 2 concordant ; D-5. | aucune |
| C-9 | OK | Diagramme 1 : `PAY` et `NOT` dans « Services de la plateforme », flèche `PAY → AGP → CEN` ; AD-25 et AD-36 (l'exécuteur consomme les faits, le contact les relaie) ; D-13 ; la seule flèche centrale → plateforme est la demande d'envoi (D-16). | aucune |
| C-10 | OK | AD-31 : « en version figée, seul un correctif critique passe (AD-30) ; pendant un gel, par fichier seulement (AD-1) ». | aucune |
| C-11 | OK | Convention de nommage élargie (flux, ordres au passé) ; `instance.etat.modifie`, `reprise.feu-vert.donne`, `instance.commande.deposee`, `…executee`, `instance.espace.ordre.donne` / `.execute` ; D-17 valide les noms demandés. Réserve : `instance.bilan.changed` est un `.changed` sans précédent existant. | optionnel : `instance.bilan.modifie` ou ajouter ce nom aux précédents de la convention |
| C-12 | OK | AD-37 : la commande porte le jeton de l'appelant ; l'agent revérifie la signature de l'`auth-service` de l'espace et `instance:*` ; consentement et export : identité contre le DG enregistré de l'état voulu (AD-22) ou le désigné par écrit (AD-13). | aucune |
| C-13 | OK | AD-14 : approbation du responsable des données de Money Vibes signée par la clé de la centrale, transportée dans l'état voulu (`approbationsExport`, AD-22) ou le fichier ; AD-17 a la ligne. | aucune |

### N-1 → N-20 (choix de l'architecte, validés par D-15)

Lecture : « écrit tel que validé » = le texte de l'AD reprend le choix de D-15 (adapté à D-12 quand le TPM disparaît) ; `[ADOPTED]` attendu dans le titre de l'AD là où seul D-15 couvre le choix.

| id | verdict | preuve | correction |
|---|---|---|---|
| N-1 | OK | AD-9 `[ADOPTED]` : 443 vers deux noms sans inspection TLS, `versionProtocole` N/N-1 ; l'alerte `min(7 j, moitié)` est remplacée par J+7 fixe (D-12 : « alerte J+7 inchangée », gel unique 30 j) ; AD-35 `[ADOPTED]` : prolongation après 3 jours de panne imputable. | aucune |
| N-2 | OK | AD-4 `[ADOPTED]` : compteur d'empreinte, recul, bifurcation, lacune ; incrément horaire et `TPM2_Clear` retirés avec le TPM (D-12), compteur par contact. | aucune |
| N-3 | OK | AD-3 `[ADOPTED]` : bail exclusif dans le magasin, compatibilité d'agent N/N-1 distincte de la fenêtre d'AD-30. | aucune |
| N-4 | OK | AD-6 `[ADOPTED]` : périmé au-delà de 5 min, clef `<organisationId>:<module>:<transition>:<date>:<epoque>`, réponse `instantUtc` / `horlogeId` / `numeroHeureReference`. | aucune |
| N-5 | OK | AD-10 `[ADOPTED]` : projet `<instance>-agent`, binaire `docker compose` (dockerode en inspection), Redis et MinIO par espace, sonde SM-3. | aucune |
| N-6 | OK | AD-12 `[ADOPTED]` : enveloppe unique, JCS, pseudonyme stable, table hors chaîne, tampon local et fait « trou ». | aucune |
| N-7 | PARTIEL | AD-13 écrit bien la copie de plus de 14 jours inopérante et la quarantaine ou suppression d'une finalité retirée, mais son titre ne porte pas `[ADOPTED]` alors que seul D-15 couvre ces deux choix. | Ajouter `[ADOPTED]` au titre d'AD-13. |
| N-8 | PARTIEL | AD-14 écrit le jeton d'export signé à courte durée, seul lien centrale → apprentissage ; choix validé par D-15 seul, titre sans `[ADOPTED]`. | Ajouter `[ADOPTED]` au titre d'AD-14. |
| N-9 | OK | AD-16 `[ADOPTED]` : 7/4/3 sur site et plateforme, sauvegarde antérieure à « migrer », copie hors machine croisée, test mensuel en projet jetable. | aucune |
| N-10 | OK | AD-20 `[ADOPTED]` : 2 h par défaut, prolongeable par le même clic ; comptes Money Vibes distincts. | aucune |
| N-11 | OK | AD-21 `[ADOPTED]` : « le réel fait foi, l'essai le reçoit ». | aucune |
| N-12 | OK | AD-22 `[ADOPTED]` : document unique, `revision`, retour arrière en proposition au DSI. | aucune |
| N-13 | OK | AD-26 `[ADOPTED]` : JWS Ed25519, JCS, champs obligatoires, vecteurs rejoués des deux côtés, schémas dans `prospera-plateforme`. | aucune |
| N-14 | OK | AD-27 `[ADOPTED]` : Karapace 6.2, `organisationId`, partition `instanceId` pour les topics sans organisation. | aucune |
| N-15 | OK | AD-29 `[ADOPTED]` : CA dédiée de la centrale, certificat 30 j renouvelé à chaque contact, grâce 30 j, jeton d'enrôlement. | aucune |
| N-16 | OK | AD-34 `[ADOPTED]` : SQLite chiffré à écriture anticipée, clé sur le second support (D-12), réseau dédié. | aucune |
| N-17 | OK | AD-36 `[ADOPTED]` : deux processus, liste blanche, gabarits sans `privileged`, SBOM et analyse bloquante. | aucune |
| N-18 | OK | AD-37 `[ADOPTED]` : `POST /api/instance/v1/commandes` déposée par la partie A, tirée par l'agent. | aucune |
| N-19 | OK | AD-41 `[ADOPTED]` : premier incrément simulé ; démo du 15/01 sur l'horloge système. | aucune |
| N-20 | OK | AD-42 `[ADOPTED]` : BullMQ 6, `@nestjs/bullmq` 11, verrou d'outbox, Mongo en réplicas à un nœud par espace (AD-10), ports 3401 → 3405, 5001, 8081 (Conventions), autorité de certificats à la centrale (AD-2). | aucune |

### Nouvelles contradictions ou trous introduits par la dernière passe

Contrôles demandés : mention de TPM, de scellement matériel, de gel à 7 jours ou de `min(7 j, moitié)` hors Deferred : **aucune** (les occurrences de « 7 jours » restantes sont le report de FR-19, le retour arrière, la vague, l'annonce, l'avis d'essai). Les « clés matérielles » d'AD-28 sont les clés hors ligne de la racine, sans lien avec le TPM.

| id | AD | écart | correction |
|---|---|---|---|
| NC-1 | AD-19, AD-17, AD-42 | Voir P-4 : nom de topic inexact (`paiement.abonnement.echeance.impayee`) et « suspension » d'un hébergé impayé contraire au PRD (impayé jamais `SUSPENDU`). | Voir P-4. |
| NC-2 | AD-17 contre AD-1, AD-6, AD-7, AD-24 | (a) AD-6, AD-24, le diagramme de séquence et les documents voisins disent `etat-publie.changed` ; la table ne nomme que `.essai` et `.reel` (AD-24 dit « le topic de son espace » sans nommer le suffixe). (b) Le **fichier d'urgence** (signé par la racine, AD-7 et AD-1) n'a pas de ligne dans AD-17 (producteur : cérémonie de la racine ; consommateur : agent) alors que le fichier de rétablissement et celui de prolongation en ont une. | (a) Écrire dans AD-24 « `etat-publie.changed.essai` ou `.reel` » ; (b) ajouter à AD-17 la ligne « fichier d'urgence (JWS racine) : Money Vibes, hors ligne ; agent ». |
| NC-3 | AD-36 contre AD-16, AD-20 | La répartition exécuteur et contact ne dit pas qui porte (a) le **tunnel de support** (réseau sortant, donc contact, mais ouvert sur commande exécutée par l'exécuteur) et (b) la **copie hors machine** vers l'hôte de l'autre poste (plateforme, centrale), qui sort aussi sur le réseau. Le contact n'a ni Kafka ni vérification : ni (a) ni (b) ne figure dans sa liste. | Ajouter à AD-36 : tunnel et copie hors machine côté contact, sur ordre de l'exécuteur par le socket local. |
| NC-4 | AD-31 contre D-18 | D-18 : le correctif « s'applique seul 72 h après que le client est prévenu, un seul report de 7 jours ». AD-31 dit « il ne peut pas refuser » mais ne dit pas qu'il s'applique seul passé le délai ou le report (le PRD FR-19 le dit). | AD-31 : ajouter « passé les 72 heures, ou le report, le correctif s'applique seul ». |
| NC-5 | AD-17 contre le plan §4 | Le plan v3 §4 prévoit pour `paiement-service` un « read-model de manifestes pour la vente » ; aucune ligne d'AD-17 ne fournit à `paiement-service` les manifestes (ou les dépendances) : la garde « une seule source par décision » n'a pas de contrat pour ce flux. | Soit ajouter à AD-17 un contrat « manifestes de version » (producteur partie A, consommateur `paiement-service`), soit retirer le read-model du plan §4. |

## Partie 2 : concordance entre documents

Vérifié sur le diff de la branche (`git diff HEAD~1`) et sur le texte restant ; recherche des termes contraires dans les huit fichiers : « TPM », « puce », gel à 7 jours, `kafkajs`, mono-dépôt, `packages/adaptateurs`, licence pour un client hébergé, sanction hors licence. Résultat : aucun terme contraire actif (les occurrences de `kafkajs`, « Mono-repo » et `packages/adaptateurs` restantes sont des mentions d'historique ou de correction, voir P10 ci-dessous).

| fichier | passage | verdict | écart | correction en une phrase |
|---|---|---|---|---|
| `prds/prd-moteur-installation-2026-11-09/prd.md` | NFR-7 (paliers 7/4/3 sur site et plateforme, centrale 4 h, copie croisée) | OK | AD-16 et AD-35 concordent ; Q-3. | aucune |
| idem | NFR-8 (clé d'exécution de la centrale) | OK | AD-28, D-14. | aucune |
| idem | NFR-10 (aucun TPM, second support obligatoire) | OK | AD-4, D-12, configuration minimale. | aucune |
| idem | NFR-11 (compteur, recul, bifurcation, lacune, époque, fichier de rétablissement, miroir) | OK | AD-4, AD-35, AD-16. | aucune |
| idem | FR-14 (fait de paiement relayé par l'agent de la plateforme) | OK | AD-25, D-13. | aucune |
| idem | FR-15 (non amendé : gel J+30, horloge scellée bornée) | OK | D-12 laisse FR-15 inchangé ; aucun reste de 7 jours. | aucune |
| idem | FR-19 (report unique de 7 jours, application seule, ticket d'appel, horloge 72 h au client prévenu) | OK | AD-31, D-18 (voir NC-4 : c'est la spine qui est plus pauvre). | aucune côté PRD |
| idem | FR-32 et FR-33 (certificat d'effacement calculé sur la rétention de NFR-7) | OK | AD-38, AD-16. | aucune |
| idem | FR-35 (DG = identité enregistrée à la signature, transmise dans l'état voulu) | OK | AD-22, AD-13. | aucune |
| idem | §8 (note PM tranchée : ancrage logiciel, quatre unités) ; tableau §3 `paiement-service` | OK | AD-4, AD-2, AD-25. | aucune |
| idem | §3.1 « Suspendre », FR-32, FR-41 (un impayé ne produit jamais `SUSPENDU`) contre spine AD-19 et AD-42 | **ÉCART** | La spine écrit que la partie A « en déduit la suspension » d'un hébergé impayé ; le PRD fixe le parcours préavis puis lecture seule (décision PO 2026-11-10, addendum A-9). Le PRD est juste, la spine est fautive. | Corriger AD-19 et AD-42 : « parcours de l'impayé (préavis, lecture seule) », jamais « suspension » (voir P-4). |
| `prds/prd-moteur-installation-2026-11-09/addendum.md` | A-1 (correctif 72 h : e-mail parti et ticket d'appel ; application seule ; mécanisme d'ancrage sans puce) | OK | AD-31, AD-4. | aucune |
| idem | A-3 « clé d'exécution de la centrale » | OK | AD-28, D-14, trimestrielle. | aucune |
| idem | A-3 « la clé racine et le rythme des clés » : « les clés de signature changent chaque année » | **ÉCART** (mineur) | Vrai pour les clés de CI seulement ; la clé d'exécution de la centrale est trimestrielle (paragraphe suivant, AD-28). | Écrire « les clés de la chaîne de publication changent chaque année » pour lever la lecture contradictoire. |
| idem | A-4 (contenu du contact : compteur, empreinte précédente, `versionProtocole`, ancrage logiciel, compteurs de Connecteurs ; recul, bifurcation, lacune ; fichier de rétablissement) | OK | AD-9, AD-4, AD-35. | aucune |
| `prds/prd-reprise-donnees-2026-11-10/prd.md` | OQ-1 (`prospera-adaptateurs`, routes C13 consommées par la partie A) | OK | AD-18, AD-26, AD-17. | aucune |
| `prds/prd-connecteurs-2026-11-10/prd.md` | QK-15, QK-16, QK-19 (dépôt neuf, AD-P18 écrite, compteurs par la vérification quotidienne) | OK | AD-18, AD-26, AD-9 ; AD-P18 existe dans l'écosystème. | aucune |
| `CONTRAT-DE-MODULE-2026-11-09.md` | C1 (champs du manifeste dans `ModuleVersion`) | **ÉCART** (mineur) | L'amendement place le point d'entrée `migrer` sous « C13 » ; la spine (AD-33) le lie à C12 (migrations additives) ; le paragraphe C13 le décrit aussi. | Écrire « (C12) » dans l'amendement de C1. |
| idem | C2 (garde sur l'état publié seul, un topic par espace) | OK | AD-24. | aucune |
| idem | C5 (`organisationId` pour le neuf, `@2` pour renommer) | OK | AD-27. | aucune |
| idem | C7 (format de droit à tiret, story `auth-service` avant la semaine 5) | OK | AD-42. | aucune |
| idem | C10 (registre, Redis, MinIO par espace ; agent dans `<instance>-agent`) | OK | AD-10, AD-27. | aucune |
| idem | C11 point 5 (compte de service IA, garde du registre, lectures d'exploitation, tunnel sur site) | OK | AD-13, AD-14, AD-20. | aucune |
| idem | C13 (routes nommées au manifeste, `migrer` idempotent sous verrou) | OK | AD-17, AD-33. | aucune |
| `architecture-prospera-ecosystem-2026-07-04.md` | P9 (Karapace 6.2 par espace, BACKWARD en CI) ; client Kafka, Node 24, MongoDB 8.0 | OK | AD-27, AD-42, Q-8, Q-9, Q-11. | aucune |
| idem | P10 corrigé (19 dépôts, deux dépôts neufs) | **ÉCART** (mineur) | Le corps est corrigé, mais le titre reste « P10 — Mono-repo maintenant, poly-repo différé » et la ligne 1.2 de l'historique le répète sans renvoi. | Renommer le titre « P10 — Topologie du code : 19 dépôts, pas de mono-dépôt (corrigé le 2026-11-11) ». |
| idem | AD-P16 précisé ; AD-P18 | OK | AD-13, AD-18, AD-20 ; AD-P16 reste la règle d'exploitation. | aucune |
| `amendement-plan-v3-2026-11-10.md` | §4 : ligne `auth-service` (route interne, avant la semaine 5), stories à ouvrir, `kafkajs`, Node 24, Karapace | OK | AD-15 pour la naissance (AD-42 pour la route est tout aussi exact). | aucune |
| idem | §4 : ligne `paiement-service` (« contrat consommé par la centrale » ; « read-model de manifestes ») ; ligne catalogue « consommateur d'impayé » | **ÉCART** (mineur) | D-13 : les faits sont consommés par l'**agent de la plateforme**, relayés à la centrale ; le read-model de manifestes n'a pas de contrat en spine (NC-5) ; « consommateur d'impayé » ne dit pas s'il disparaît (site) ou reste (hébergé, AD-42). | Écrire « faits de paiement relayés par l'agent de la plateforme » ; ajouter le contrat de manifestes à AD-17 ou retirer le read-model ; préciser « retiré sur site, gardé pour un hébergé ». |
| idem | §5 (ajouts de la spine, aucun TPM, clés matérielles hors ligne, second hôte) ; §6 (tranche de départ, démo 15/01, recette croisée) | OK | Q-2, Q-3, D-12, AD-41. | aucune |
| `architecture/architecture-prospera-app-2026-11-10/ARCHITECTURE-SPINE.md` | AD-5 (état publié et topic par espace, fichiers `contrat/` à la partie A), AD-6 (`droitsEffectifs` par intersection) | OK | AD-24 (le numéro et le sujet). | aucune |
| idem | AD-15 (matrice des neuf états possédée par `platform-catalog-service`) | OK | AD-24. | aucune |
| idem | AD-23 (vraie route avant le 15/01, doublure éteinte au premier gate) | **ÉCART** (mineur) | Renvoi à « AD-41 » (tranche de départ) ; la règle est écrite en AD-24 (« servie avant la démo du 15/01/2027, au plus tard au premier gate ») ; AD-41 ne parle que de la partie A sur l'espace d'essai. | Renvoyer à « AD-24 et AD-41 ». |
