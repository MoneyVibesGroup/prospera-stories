# Relecture « versions et réalité » — spine Reprise de données

Date : 2026-11-11. Lentille : chaque décision a-t-elle été vérifiée (registre npm, web, projet existant) plutôt qu'affirmée de mémoire ?
Sources : `npm view` du 2026-11-11 ; `git show origin/dev:package.json` des services existants ; recherche web (Aiven/Karapace, doc @tus/s3-store, seuils MinIO).

**Verdict : la pile est dans l'ensemble exacte (tus, bullmq, minio, kafka, csv-parse, stream-json, libphonenumber, ajv vérifiés au registre), mais trois points sont affirmés sans vérification (draft JSON Schema vs ajv/Karapace, exceljs en flux sur 100 000 lignes, Traefik et tus) et deux versions sont en retard (pdfkit, @nestjs/bullmq).**

| Technologie | Version dans la spine | Constaté (source, date) | Verdict | Correction proposée |
|---|---|---|---|---|
| @tus/server | 2.4.x | 2.4.7 publié le 02/11/2026 ; node >=20.19 (npm, 11/11) | OK | Aucune. Node 24 couvert. |
| @tus/s3-store | 2.1.x | 2.1.0 le 02/11/2026 ; dépend de @aws-sdk/client-s3 ^3.1045 (npm) | OK, risque léger | Dire que le magasin tire le SDK AWS v3 (dépendance lourde à côté du client `minio` 8). Ajouter un test de bout en bout contre le MinIO épinglé du gabarit (compatible S3 selon la doc ; non testé ici). |
| Morceaux tus de 10 Mo vs parties S3 | 10 Mo | Doc @tus/s3-store : `partSize` préféré, plancher 5 MiB ; MinIO : parties 5 MiB à 5 GiB (docs.min.io) | OK | Préciser que 10 Mo est la taille de morceau tus côté client, et que `partSize` du magasin se règle explicitement (>= 5 MiB, idéalement égal à `minPartSize` pour les S3 stricts). |
| tus-js-client | 4.3.x | 4.3.1 le 30/09/2026 ; node >=18 (npm) | OK | Aucune. |
| tus derrière Traefik | « limite de corps relevée sur cette seule route » | Non vérifié : rien dans la spine. Les en-têtes `Upload-Offset`, `Tus-Resumable`, `Location` doivent traverser le proxy et le BFF Next | À corriger | Ajouter à AD-15 : (1) limite du middleware `buffering` >= 10 Mo + marge sur la route seule ; (2) en-têtes tus exposés (CORS si autre origine ; sinon vérifier que le proxy Next `/api/reprise/v1` ne les filtre pas ni ne met le corps en mémoire) ; (3) `respectForwardedHeaders`/`relativeLocation` de @tus/server pour que `Location` soit l'URL publique. À valider par une recette réelle. |
| exceljs | 4.4.0 | Dernière publication 20/12/2024 (4.4.1-prerelease.0) ; aucune version stable depuis 10/2023 | Risque | Écrire « maintenance quasi arrêtée » dans la spine. Première story (NFR-4) : `WorkbookReader` en flux avec options de chaînes partagées et styles ignorés ; mesurer le pic mémoire sur 100 000 lignes et sur un fichier à beaucoup de chaînes uniques. Nommer un plan B décidé par la mesure. Le projet l'utilise en 4.4.0 (balance, bilan) mais en buffer : le flux n'est pas éprouvé ici. |
| csv-parse | 7.0.x | 7.0.3 le 25/09/2026 (latest) | OK | Aucune. |
| stream-json | 3.9.x | 3.9.0 le 09/11/2026 | OK | Aucune. |
| ajv | 8.20.x | 8.20.0 le 24/04/2026 | À corriger | La spine ne dit pas quel draft. Ajv 8 par défaut = draft-07 ; 2020-12 exige `ajv/dist/2020`. Trancher et écrire le draft des schémas d'objets (AD-26 du moteur ne le précise pas non plus). |
| ajv-formats | 3.0.x | 3.0.1, 30/03/2024 (stable) | OK | Aucune. |
| Karapace 6.2 et JSON Schema | 6.2.x | Changelog Aiven (non daté) : drafts 2019-09 et 2020-12 acceptés, mais `unevaluatedProperties`, `$dynamicRef`, `$recursiveRef`, `$vocabulary` non pris en charge ; références de schémas non supportées pour JSON Schema selon la doc Aiven ; la version 6.2 elle-même n'a pas été interrogée | Risque | Écrire que les schémas d'objets n'utilisent pas ces mots-clés ni `$ref` inter-fichiers (ou sont aplatis au build) ; enregistrer chaque schéma de `contrats/objets/` dans l'image Karapace 6.2 réelle en recette. Dire si ces schémas vivent dans Karapace ou seulement dans le dépôt. |
| libphonenumber-js | 1.13.x | 1.13.16 le 10/11/2026 | OK | Aucune. |
| pdfkit | 0.19.x | Dernier : **0.20.2** (30/08/2026) ; 0.19.1 en juin 2026 ; balance et bilan épinglent `^0.19.1` | À corriger (mineur) | Écrire « 0.19.x aligné sur balance/bilan ; 0.20 existe, montée décidée avec eux ». En 0.x, `^0.19.1` ne couvre pas 0.20. |
| BullMQ | 6.7.x | 6.7.4 le 11/11/2026 ; mais `document-service` utilise `bullmq ^5.81.2` | Risque | Majeure 6 : aucun service existant ne l'emploie. Relever les ruptures 5 -> 6 avant d'épingler, ou aligner sur 5.x. Redis 7 non revérifié contre les prérequis de la v6. |
| @nestjs/bullmq | 11.x | Dernier 12.0.1 (06/11/2026) ; peers de la 12 : bullmq ^3..^6, @nestjs/core ^10..^12 ; `document-service` : ^11.0.4 | À corriger (mineur) | Écrire « 11.x ou 12.x » et vérifier que le peer de la 11 accepte bullmq 6 (non lu ici). |
| minio (client) | 8.0.x | 8.0.7 le 27/02/2026 ; ^8.0.7 en fiscal, document, catalogue | OK | Si @tus/s3-store apporte le SDK AWS, justifier le second client. |
| @confluentinc/kafka-javascript | 1.11.x | 1.11.0 le 07/10/2026 ; node >=18 | OK | Aucune. |
| @confluentinc/schemaregistry | 1.11.x | 1.11.0 le 07/10/2026 ; embarque ajv ^8.17.1 | OK | Noter la coexistence avec ajv 8.20. |
| NestJS | 11.x | `@nestjs/core ^11.0.1` dans les 5 services lus ; la 12 existe (peers) | OK | Aucune ; 11 cohérent avec l'existant. |
| Node 24, Mongoose 8, MongoDB 8.0, Redis 7, MinIO RELEASE | affirmés | Hérités de la spine moteur ; non revérifiés ici | Non vérifié | Hors périmètre ; renvoyer à la spine moteur. |

## Écarts de méthode

- La mémoire du run ne consigne au registre que tus, exceljs, csv-parse, stream-json et pdfmake ; les autres versions étaient reprises de la spine moteur ou de mémoire.
- Rien n'est écrit sur le draft de JSON Schema ni sur sa prise en charge par Karapace.
- Rien n'est écrit sur les en-têtes tus, le CORS ni la mise en tampon du corps derrière Traefik et le proxy Next.

## Risques principaux

1. exceljs en flux sur 100 000 lignes : bibliothèque sans release stable depuis 2023, flux jamais utilisé dans le projet ; NFR-4 repose dessus.
2. Draft JSON Schema non tranché : ajv 8 par défaut = draft-07 ; 2020-12 demande un autre import ; Karapace ne gère pas `unevaluatedProperties`/`$dynamicRef`.
3. Chaîne tus + Traefik + proxy Next : configuration non vérifiée.
4. BullMQ 6 : aucun service existant n'est sur la v6.
