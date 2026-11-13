# Revue des versions et technologies — spine assurance (2026-11-13)

Méthode : registre npm, API GitHub, nodejs.org/dist/index.json, WebSearch/WebFetch, `package.json` et `Dockerfile` réels des deux services. Lecture faite le 2026-11-13.

## Verdict

**À CORRIGER avant gel.** Les versions chiffrées de la section Stack sont exactes, mais le choix de MinIO n'est plus tenable sans réserve (dépôt archivé, source seule), et la pile réelle dérive de ce que dit la spine (Node 20 dans prospera-assurance-service).

## Tableau

| Outil | Version dans la spine | Version vérifiée | Source | Statut |
| --- | --- | --- | --- | --- |
| Node.js | 24.x LTS | 24.22.3 (LTS Krypton, 2026-11-10) ; Node 26.13.x « Lithium » est aussi LTS | nodejs.org/dist/index.json | OK (24 maintenu jusqu'à avril 2028) |
| NestJS | 11.x | 11.2.10 (2026-11-12) toujours publiée ; dernière majeure 12.5.0 (12.0.0 le 2026-08-27) | registre npm | OK, mais majeure suivante existe : le dire |
| Mongoose | 8.x | 8.24.9 (2026-11-12) ; dernière 9.12.1 | registre npm | OK, idem |
| MongoDB | 8.0 | 8.0 fin de vie 2029-10-31 ; 9.0 publiée fin sept. 2026 (fin de vie 2031) | mongodb.com/legal/support-policy/lifecycles | OK |
| BullMQ | 6.7.x | 6.7.6 ; en place dans document-service ^5.81.2 | registre npm, package.json | OK (écart avec l'existant, constat 4) |
| Redis | 7.2+ | dernière série 8.10.3 (2026-10-26) ; fin de vie de 7.2 et licence 8.x non retrouvées | API GitHub redis/redis | NON VÉRIFIÉ |
| @confluentinc/kafka-javascript | 1.11.x | 1.11.0, MIT, Node >=18 | registre npm | OK |
| kafkajs (existant) | 2.2.4 | 2.2.4, publiée le 2023-02-27, rien depuis | registre npm, package.json | OK pour la mesure ; bibliothèque figée |
| Karapace | 6.2.x | 6.2.4 (2026-10-02) | API GitHub Aiven-Open/karapace | OK |
| Tesseract | 5.5.4 | 5.5.4 (2026-10-28) | API GitHub tesseract-ocr | OK |
| tesseract.js | 7.0.0 dernière, 5.1.1 en place | 7.0.0 (2025-12-15), Apache-2.0 ; 5.1.1 de 2024-08 ; tesseract.js-core 6.1.2 (en place ^5.1.1) | registre npm, package.json | OK |
| pdfjs-dist | 6.5.438 ; 4.10.38 en place ; Node 22.13+ ou 24+ | 6.5.438, Apache-2.0, engines `>=22.13.0 \|\| >=24` | registre npm | OK |
| @napi-rs/canvas | 1.1.1 ; ^1.0.7 en place | 1.1.1, MIT | registre npm | OK |
| MinIO (serveur) | « MinIO » sans version | Dépôt minio/minio **archivé le 2026-04-25**, lecture seule, AGPL-3.0, **source seule, plus de binaires ni d'images officiels**, aucune release ; successeur « AIStor » (Free sous licence propre) ; fork communautaire pgsty/minio signalé par la presse, non confirmé | API GitHub, README minio/minio, WebSearch | **À CORRIGER** |
| minio (client npm) | « MinIO 8 » | 8.0.7, Apache-2.0 | registre npm | OK (client S3 générique) |
| Node dans les images réelles | « Node 22 » pour document-service | document-service : `node:22-slim` ; **prospera-assurance-service : `node:20-slim`** | Dockerfile des deux services | **À CORRIGER** |
| Antivirus, rendu PDF des courriers | `[ASSUMPTION]` | non choisis | spine | NON VÉRIFIÉ (assumé, correct) |

## Constats et corrections

1. **MinIO (AD-9, Stack, Q-3) : À CORRIGER, bloquant.** Le dépôt communautaire est archivé (2026-04-25), en source seule (AGPL-3.0), sans binaire ni image officiels, sans correctif de sécurité garanti. La spine pose MinIO comme évidence sans version ni licence. Corrections : (a) écrire l'état ci-dessus ; (b) AGPL : pas de souci d'usage interne chez la compagnie, mais obligations si on modifie et expose le service en réseau, à faire valider ; (c) trancher entre compiler une version épinglée depuis les sources (maintenance et sécurité à la charge de la compagnie), fork communautaire (maintenance non confirmée), AIStor Free (licence à lire, pas open source), ou autre stockage compatible S3 (Garage, SeaweedFS, Ceph RGW citées par des sources secondaires, non vérifiées par moi) ; (d) le port S3 d'AD-9 rend le choix réversible, et le stockage fichier direct sur le NAS (Q-3) devient l'option de repli sans dépendance. Rouvrir Q-3 ; la spine du moteur hérite du même risque.
2. **Node dans les services existants : À CORRIGER.** La phrase « Mesuré » ne cite que Node 22 de document-service ; `prospera-assurance-service` est en **Node 20** (fin de vie avril 2026, plus de correctifs). Corriger la phrase et Q-5 pour les deux services. Node 22 sort de maintenance en avril 2027 : la montée à 24 n'est pas facultative pour un déploiement chez le client en 2027.
3. **Redis 7.2+ : NON VÉRIFIÉ.** Dernière série 8.10.x ; fin de vie de 7.2 et licence actuelle de Redis 8 non confirmées. À confirmer avant de promettre « 7.2+ », et choisir un plancher supporté.
4. **BullMQ.** La spine dit 6.7.x ; document-service est en ^5.81.2. Inscrire la montée 5 vers 6 dans la tâche « document-service passe à Node 24 » (notes de rupture non lues). `@nestjs/bullmq` est en 12.x : vérifier la compatibilité avec NestJS 11 tant qu'on y reste.
5. **NestJS 11 et Mongoose 8 : OK, mais pas la dernière majeure.** Ajouter « majeure suivante connue (Nest 12, Mongoose 9), montée hors périmètre ». `@nestjs/mongoose` 12.0.1 accepte Mongoose 8 et 9.
6. **tesseract.js et pdfjs-dist : OK, deux points.** (a) pdfjs-dist 6.x exige Node >=22.13 ou 24 : l'image `node:22-slim` doit être au moins en 22.13 ; (b) le fonctionnement hors ligne de tesseract.js exige worker, cœur WASM et données de langue fournis localement (`workerPath`, `corePath`, `langPath`) : la spine dit « WASM hors ligne » sans l'exiger. Ajouter : aucun téléchargement au runtime, données `fra` dans l'image.
7. **Karapace et client Confluent : OK.** Karapace 6.2.4 actif ; `@confluentinc/kafka-javascript` 1.11.0 MIT, compatible Node 24. kafkajs figé depuis 2023 : la migration est justifiée.
8. **MongoDB 8.0 : OK** (support jusqu'au 2029-10-31, 9.0 disponible). Licence MongoDB Community (SSPL) pour un déploiement chez le client : non analysée.

## Limites

État de MinIO et de ses forks : archivage et AGPL confirmés sur le dépôt lui-même, le reste par sources secondaires. Compatibilité Node 24 vérifiée par les champs `engines`, sans exécution. Notes de rupture BullMQ 5 vers 6 et Nest 11 vers 12 non lues.
