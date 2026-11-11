# Vérification finale : contrat-code, versions, adversaire (spine finale, 42 AD)

Date : 2026-11-11. Spine vérifiée : `ARCHITECTURE-SPINE.md` (status final). Décisions du PO qui priment : `.memlog.md` D-12 (pas de TPM, gel unique à 30 jours), Q-9, Q-10, D-13, D-14. Documents voisins relus pour les renvois : `amendement-plan-v3-2026-11-10.md`, `CONTRAT-DE-MODULE-2026-11-09.md` (amendements du 2026-11-11), `architecture-prospera-ecosystem-2026-07-04.md` (P9, P10, AD-P16, AD-P18), spine de la coque, PRD et addendum du moteur.

Verdicts : OK (traité par une règle de la spine), PARTIEL, KO, CADUC (décision du PO), RENVOYÉ-OK / RENVOYÉ-KO (traité dans un autre document, vérifié).

**Bilan**
- **Contrat-code (35)** : 27 OK, 5 RENVOYÉ-OK, 1 CADUC, 2 PARTIEL, 0 KO.
- **Versions (12)** : 9 OK, 1 RENVOYÉ-OK, 2 CADUC, 0 PARTIEL, 0 KO.
- **Adversaire (20)** : 19 OK, 1 PARTIEL, 0 KO.
- **Total (67)** : 55 OK, 6 RENVOYÉ-OK, 3 CADUC, 3 PARTIEL (E-07, T-6 qui lui est fusionné, adversaire 10), 0 KO. Les 14 constats « fusionnés » de la disposition ont chacun été vérifiés dans la spine : un seul défaut (T-6, hérité d'E-07).

## 1. review-reconcile-contrat-code (E-01 → E-18, T-1 → T-10, P3-1 → P3-7)

| id | verdict | AD | preuve courte | correction |
|---|---|---|---|---|
| E-01 | OK | AD-24, AD-17 | « Source unique : la garde applique l'état publié seul… `echeanceLe` n'est plus lu pour décider », test de conformité en double lecture par consommateur existant ; plan par service dans l'amendement §4 | |
| E-02 | OK | AD-23 | « Bascule » : quatre chemins retirés nommés, migration `rattrapage-packs`, réamorçage unique, recettes 631/632/649/650-651/728 rejouées | |
| E-03 | OK | AD-26, AD-36, AD-42 | deux dépôts neufs, CI de publication et signature dans `prospera-plateforme` ; P10 corrigée dans l'écosystème (ligne « Corrigé le 2026-11-11 ») | |
| E-04 | CADUC | AD-27 | Q-10 : registre Karapace dans le socle de chaque espace, schémas dans le manifeste, enregistrés par l'agent à l'étape migrer ; P9 amendée dans l'écosystème. Reste utile : nommer qui joue la compatibilité faute de CI dans les dépôts de services (AD-26 : « copient les schémas à une version épinglée au build ») | |
| E-05 | OK | AD-6, AD-42 | état publié « calculé à la lecture », tâches BullMQ « seulement pour émettre » ; « Aucun autre service ne calcule une transition de l'état publié » ; Redis et BullMQ au catalogue, outbox sous verrou ; story semaine 5 dans l'amendement §4 | |
| E-06 | OK | AD-15, AD-42 | route interne réservée à l'identité de service du moteur, `organisationId` imposé, idempotente, sans utilisateur ; « un compte par espace, mêmes identifiants » ; story avant la semaine 5 (amendement §4 aussi) | |
| E-07 | PARTIEL | AD-42, binds | `binds` porte C1, C2, C7, C9, C11 ; `droitsEffectifs` défini (AD-24). Mais la ligne « Format de droit… élargi dans `auth-service` avant `pi-spi`… » n'a pas de date, alors que la ligne voisine (route) dit « story livrée avant la semaine 5 » | Ajouter à la ligne AD-42 du format de droit : « story livrée avant la semaine 5, avec la route de naissance (amendement du plan §4) ». |
| E-08 | OK | AD-24, AD-17 | forme complète (dont `heureDeReference`, `sante`, `interrupteurs[].dateLimite`, `droitsEffectifs` par intersection), propriétaire des deux fichiers de contrat, route navigateur et route service, vraie route « avant la démo du 15/01/2027, au plus tard au premier gate de la coque » ; coque AD-5/AD-23 alignée | |
| E-09 | OK | AD-17, AD-19, AD-42, AD-8 | topics `paiement.abonnement.*` au tableau ; `suspension-par-impaye` : disparaît sur site, consommé pour un hébergé ; sanction portée par la licence. Renommage `RAPPEL` et liste par service : amendement §4 (STORY-280, 281, ajustements par service) vérifiés | |
| E-10 | OK | AD-25, AD-17 | faits de paiement relayés par l'agent de la plateforme (D-13), licence dérivée et signée par la centrale, e-mail par `notification-service` avec lien à durée limitée | |
| E-11 | OK | AD-13, AD-14 | « compte de service dédié (contrat C11 amendé, pas AD-P16) » ; routes AD-P16 « inaccessibles sur site hors tunnel ouvert », jamais pour l'apprentissage ; AD-P16 précisée dans l'écosystème | |
| E-12 | OK | AD-10, AD-34 | projet `<instance>-agent` hors profils ; réseau dédié, un client Kafka par espace, identifiants distincts | |
| E-13 | OK | AD-27, Conventions | « les contrats existants gardent leur graphie » (`orgId`, `organizationId`), renommage par topic `@2` ; `.changed` toléré par précédent ; C5 amendée | |
| E-14 | OK | AD-42, Stack | ligne `node:20-slim` → Node 24 « pour tous les services dans la version 1.0, avant février » (Q-8) : l'écart est écrit et planifié | |
| E-15 | OK | AD-41 | repli ordonné : niveau 2 fermé, apprentissage réduit aux niveaux 0 et 1, supervision réduite, vagues manuelles | |
| E-16 | OK | AD-10, Conventions | aucun port publié, `TRUSTED_PROXIES` = CIDR de Traefik, réplica initialisé par le gabarit, un Mongo par espace ; table de ports de dev (3401-3405, 5001, 8081 ; coque 8080 et 3200) | |
| E-17 | OK | AD-23, binds | AD « Partie A » (manifeste, point de décision, neuf états, bascule, module `instance` chemin 0) ; AD-38 pour l'essai prospect ; C1 amendée (champs de `ModuleVersion`) | |
| E-18 | OK | Deferred | ligne reformulée : `paiement-service` embarque déjà `@nestjs/bullmq` 12 sur NestJS 11 | |
| T-1 | OK | AD-42, AD-6 | fusionné avec E-05, vérifié : ligne outbox / BullMQ | |
| T-2 | OK | AD-10 | fusionné avec E-16 : « jeu de réplicas à un nœud… initialisé par le gabarit » | |
| T-3 | OK | AD-24 | fusionné avec E-01 : double lecture dans cinq services avant retrait | |
| T-4 | OK | AD-17, AD-24 | `entitlement.changed` v2 additif ; sémantique de `echeanceLe` changée (plus lu pour décider) | |
| T-5 | OK | AD-42, AD-15 | fusionné avec E-06 : route interne, story avant la semaine 5 | |
| T-6 | PARTIEL | AD-42 | fusionné avec E-07 : même défaut (pas de date sur la ligne du format de droit) | Même correction qu'E-07. |
| T-7 | RENVOYÉ-OK | AD-25 ; amendement §4 | paiement n'appelle pas la centrale (relais par l'agent) ; « read-model de manifestes pour la vente » présent à l'amendement §4 (ligne `paiement-service`, semaines 5 et 6) et dans la liste des stories avant la semaine 5 | |
| T-8 | OK | AD-26, AD-36 | fusionné avec E-03/E-04 : dépôt, CI, cosign, SBOM et analyse bloquante | |
| T-9 | OK | AD-42 | fusionné avec E-14 | |
| T-10 | OK | AD-10, AD-40 | Traefik unique par instance ; NFR-5 mesuré par les étapes horodatées | |
| P3-1 | RENVOYÉ-OK | AD-42 ; amendement §4 | story `auth-service` « avant la semaine 5 (décision du PO, démo du 15/01) », ligne « Stories à ouvrir avant la semaine 5 » | |
| P3-2 | OK | AD-24 | contrats « publiés dans la semaine 5 (avant le 11/12/2026) », vraie route avant le 15/01 ; coque : doublure éteinte au premier gate | |
| P3-3 | OK | AD-23 ; contrat C1 | « `reseau` est enregistré au nouveau format », garde de comparaison source/copie ; schéma de `ModuleVersion` amendé en C1 (champs, migrations, schémas d'événements) | |
| P3-4 | RENVOYÉ-OK | amendement §5 | « Ajouts de la spine… ≈ 39 points de socle », infrastructure, migrations, stories d'alignement, écart « s'aggrave » | |
| P3-5 | OK | AD-28, AD-29, AD-26, AD-36, Structural Seed | cérémonie et coffre (deux détenteurs), CA par la centrale, registre d'images, hôte distinct de la centrale, second support dans la config minimale ; TPM CADUC (D-12) ; approvisionnement : amendement §5 | |
| P3-6 | RENVOYÉ-OK | Deferred ; amendement §9 | validation juridique au Deferred (et question 8) ; Q3 du contrat, FR-42/43 et NFR-11, C12/C13, couverture de la charge : questions 1, 4, 5, 6 de l'amendement §9 | |
| P3-7 | RENVOYÉ-OK | AD-41 ; amendement §6 | « Recette croisée des deux modes d'hébergement » ajoutée au calendrier (instance de test complète, réseau puis fichier) | |

## 2. review-versions (V-1 → V-7 corrections, V-8 → V-12 points détaillés)

| id | verdict | AD | preuve courte | correction |
|---|---|---|---|---|
| V-1 | OK | Stack, AD-42 | Redis 7, Kafka 3.9, MinIO listés ; lignes AD-42 : Node 20 → 24, BullMQ 5.79/6.3 → 6 partout | |
| V-2 | OK | Stack, AD-42 | MongoDB 8.0 (Q-11), ligne `mongo:7` « changé » | |
| V-3 | OK | AD-27, AD-42 | `kafkajs` « non maintenu depuis 2023 », remplacé par `@confluentinc/kafka-javascript` 1.11 (Q-9) | |
| V-4 | OK | AD-10, Stack | « binaire `docker compose` (sous-processus, version figée, `--format json`). `dockerode` ne sert qu'à inspecter » | |
| V-5 | OK | AD-7 | « Ni `--offline` (déprécié en v3) ni Sigstore sans clé » ; `--tlog-upload=false`, bundle, `--insecure-ignore-tlog` ; « cosign par clé ne porte pas de chaîne » : vérification de la chaîne = code de l'agent | |
| V-6 | CADUC | Deferred | D-12 : aucun TPM en v1 ; `TPM2_Clear` rangé au Deferred avec le niveau `TPM` | |
| V-7 | CADUC | Deferred | D-12 : plus d'exigence ni de recommandation de TPM ; la config minimale ne cite aucun TPM | |
| V-8 | OK | Stack, Deferred, AD-42 | « Node 24.x LTS (Node 26 est LTS depuis le 28/10/2026 : après février) » ; Node 26 au Deferred | |
| V-9 | OK | AD-42, Stack | montée BullMQ 5 → 6 écrite, `@nestjs/bullmq` 11 pour les nouveaux services | |
| V-10 | OK | AD-26 | « Les vecteurs prouvent aussi la signature Ed25519 de `jose` » | |
| V-11 | OK | AD-16, Deferred | « oplog (fenêtre de 1 h plus marge) dimensionné » ; outil de sauvegarde au Deferred | |
| V-12 | RENVOYÉ-OK | `.memlog.md` | l'entrée « (event) Correction (V-12…) » est au memlog : vTPM « confirmé partiellement (vSphere, Proxmox), pas pour Hyper-V » | |

## 3. review-adversaire (16 paires, X-1 → X-4)

| id | verdict | AD | preuve courte | correction |
|---|---|---|---|---|
| 1 | OK | AD-6, AD-21 | `GET /heure` rend `instantUtc`, `horlogeId`, `numeroHeureReference` ; « Les deux espaces lisent la même horloge » ; tâches annulées puis recalculées après correction signée ou époque ; un seul fait de contrat par instance, essai prospect distinct | |
| 2 | OK | AD-17, AD-24 | `etat-publie.changed.essai` / `.reel`, `eventId` avec `espace`, `instanceId`, `epoque` ; chaque service ne consomme que son espace | |
| 3 | OK | AD-8 | état absolu, accusé `instance.licence.projetee`, republication à chaque démarrage et contact, file ordonnée par numéro, licence acceptée = contact qui lève le gel, point de décision sur la licence acceptée la plus récente | |
| 4 | OK | AD-22 | document unique, `revision` croissante, `ETAT_VOULU_TROP_RECENT` → mise à jour de l'agent seul, `versionCible` antérieure = proposition au DSI | |
| 5 | OK | AD-19, AD-25 | « la seule source d'échéance et d'impayé d'un client hébergé est le contrat de `paiement-service` » ; la centrale n'émet aucune licence pour un hébergé ; `origineContrat` jamais recalculée | |
| 6 | OK | AD-33, AD-23 | migrations déclarées au manifeste, jouées par l'agent à l'étape migrer, jamais au démarrage, partie A comprise ; verrou de composition, `PROMOTION_EN_COURS` | |
| 7 | OK | AD-3 | mise à jour de l'agent hors plan seulement ; bail exclusif ; lecture de tous les formats antérieurs | |
| 8 | OK | AD-12 | enveloppe unique, identités seulement dans `acteurRef`, JCS, `JOURNAL_FORME_INVALIDE` | |
| 9 | OK | AD-13 | `teteRegistre` et copie complète à chaque échantillon ; file vidée avant d'écrire le retrait ; quarantaine ou suppression ; copie la plus récente par `rangRegistre` fait foi | |
| 10 | PARTIEL | AD-15, AD-34 | AD-15 couvre `ESSAI_CLIENT` seul, suspension/reprise des échéances, import par C13, « l'agent n'écrit jamais lui-même dans la base d'un service ». Mais le rafraîchissement est « exécuté par l'agent » via les routes d'export et d'import C13 des modules des deux espaces, alors qu'AD-34 limite le réseau dédié à « seulement le Kafka de l'espace et le point `GET /heure` » : le chemin réseau de ces appels n'existe pas dans la spine | Ajouter à AD-34 que le réseau dédié expose aussi à l'agent, et à lui seul, les routes d'export et d'import C13 des modules de chaque espace, par Traefik et sous l'identité de service de cet espace. |
| 11 | OK | AD-9, AD-4 | `gelApresJours` dans l'état voulu (30 pour toutes les instances, D-12), fait `instance.etat.modifie` publié sans calcul, « ne raccourcit jamais un silence déjà écoulé » ; alerte J+7 ≠ gel à 30 j (la partie « niveau TPM/LOGICIEL » est caduque) | |
| 12 | OK | AD-16, AD-11 | sauvegarde antérieure à l'étape migrer, fait `restauration`, `epoque` dans tout `eventId` et clef de tâche | |
| 13 | OK | AD-6 | injoignable, périmé (5 min) ou en anomalie : aucune échéance ne tombe ni ne se reporte, `HORLOGE_INDISPONIBLE`, jamais l'horloge système sur site | |
| 14 | OK | AD-4, AD-29 | compteur et empreinte précédente, recul vs bifurcation vs lacune, renouvellement de certificat refusé | |
| 15 | OK | AD-27, Conventions | partition `organisationId` (`instanceId` seulement pour un fait sans organisation) ; « aucun ordre n'est présumé entre deux topics » ; ordre de la chaîne = écriture par l'agent (AD-12). Écart léger avec la proposition (jamais `instanceId`) mais le cas sans organisation est justifié | |
| 16 | OK | AD-25, AD-8 | sanction ou levée « émet dans la minute une nouvelle licence » ; l'agent l'applique avant tout autre élément | |
| X-1 | OK | AD-10 | liste des modules tenue par la partie A, routage déduit par l'agent, un Traefik unique dans le projet de l'agent | |
| X-2 | OK | AD-2 | « un exemplaire par espace… une base par espace » | |
| X-3 | OK | AD-24 | « la garde applique l'état publié seul » ; `entitlement.changed` : « fait d'octroi et invalidation de cache seulement » (AD-17) | |
| X-4 | OK | AD-22, Conventions | `ETAT_VOULU_REFUSE` / `SIGNATURE_REFUSEE` à l'extérieur, détail au journal | |

## Remarques hors constat

- Aucune régression de la dernière passe (D-12 à D-14) n'a retiré un traitement. Les fusions de la disposition (E-12, T-1 → T-10, P3-1/P3-2, adversaire X-1) tiennent, sauf T-6 par héritage d'E-07.
- La disposition classe E-04 « rejeté » ; le verdict ici est CADUC (Q-10), sans écart.
