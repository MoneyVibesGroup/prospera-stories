# STORY-954 : les contrats de Connecteurs et le point d'écriture unique

Status: done

**Complexité :** moyenne (contrats générés depuis une source, une garde de balayage, une copie épinglée au catalogue)

**Épic :** EPIC-169 (les contrats de Connecteurs et la règle du point d'écriture unique, avant février)
**Dépôts :** `MoneyVibesGroup/prospera-plateforme`, `MoneyVibesGroup/prospera-platform-catalog-service`
**Plage :** groupe B, n° 14 du lot 2 (`coordination/PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §3).
**Sources :** `epics-reprise-connecteurs-2026-11-12.md` (EPIC-169) ; spine de Connecteurs
(`architecture/architecture-connecteurs-2026-11-12/ARCHITECTURE-SPINE.md`) AD-2, AD-3, AD-10, AD-11, AD-16, AD-29, AD-32,
AD-34.

---

## Pourquoi

Pour février, `connecteurs-service` n'existe pas (AD-32). Mais la coque, le catalogue et chaque module cible construit
d'ici là doivent déjà respecter ses contrats. La coque rend la fraîcheur d'un domaine depuis `seuils-fraicheur@1`. Le
catalogue refuse un domaine d'argent non comparé. Chaque module écrit un domaine en un seul endroit : le jour où le
logiciel du client devient propriétaire, le passage aux mouvements en attente (AD-11) se fait là, et nulle part
ailleurs.

## Ce qui doit être vrai à la fin (plan du lot 2, §3, n° 14 ; fin d'EPIC-169)

| Exigence | Fait |
|---|---|
| `seuils-fraicheur@1` publié et étiqueté | oui : `contrats/seuils-fraicheur.json` et son schéma, étiquette `seuils-fraicheur-v1` |
| `contrats/echange/` publié et étiqueté | oui : enveloppe, réponse, `connecteurs.domaine.changed`, `domaines-echange` et ses cas, étiquette `contrats-echange-v1` |
| un manifeste `argent: true`, `controle: false` est refusé par le catalogue | oui. Le refus existait depuis STORY-934 (`MANIFESTE_ARGENT_SANS_CONTROLE`). Il est désormais **prouvé contre les cas publiés** par la plateforme |
| règle de construction : une fonction de service par domaine, des faits avec identifiant stable et `rang` | oui : `@prospera/point-ecriture-unique` (marqueur, garde de balayage, forme du fait), étiquette `point-ecriture-unique-v1` |

## Ce qui a été livré

### `prospera-plateforme` (#9, `b4c5c46` sur `dev`)

1. **Une source**, `scripts/contrats-connecteurs.ts`, régénérée par `npm run contrats:connecteurs`.
   `test/contrats-connecteurs.test.ts` refuse un fichier retouché à la main. Draft-07, aucun `$ref`, objets fermés,
   `@1`, Ajv strict.
2. **`seuils-fraicheur@1`** (QK-3, FR-11) :

   | Niveau | Orange | Rouge | `messageDes` |
   |---|---|---|---|
   | `IMMEDIAT` | 300 s | 900 s | `ORANGE` |
   | `HEURE` | 3 600 s | 10 800 s | `ORANGE` |
   | `NUIT` | — | `rougeAHeureLocale: "06:00"` | `ROUGE` |

   - `IMMEDIAT` et `HEURE` se jugent sur `ageSecondes`, calculé par Connecteurs : la coque ne compare pas deux
     horloges.
   - `NUIT` n'a pas d'orange : elle passe rouge à 06 h, heure locale de l'organisation, sur l'heure de référence.
3. **`contrats/echange/`** :
   - **`echange-enveloppe@1`** (AD-10) :
     - au plus 200 opérations ;
     - chacune porte `operationId` et `rang` ;
     - les champs requis dépendent de l'opération :

       | Opération | Champs requis |
       |---|---|
       | `APPLIQUER_OBJET` | `dateEffet`, `champs`, et `cleOrigine` ou `identifiant` |
       | `ENREGISTRER_MOUVEMENT` | `cleOrigine` (AD-5), `dateEffet`, `champs` |
       | `CONFIRMER` | `mouvementId` |
       | `REFUSER` | `mouvementId`, `raison` (AD-9) |
       | `CORRIGER` | `ecartId`, `champs`, et `cleOrigine` ou `identifiant` |

     - la clé d'origine est **celle de la Reprise, à l'identique** (aucune seconde forme) ;
     - aucun `organisationId` dans le corps.
   - **`echange-reponse@1`** : un résultat par opération :
     - `APPLIQUE` (sans code) ;
     - `INCHANGE` (`DEJA_APPLIQUE`, `EFFET_ANTERIEUR`) ;
     - `REJETE` et son code (`REFERENCE_INCONNUE`, `SCHEMA_NON_CONFORME`, `OBJET_HISTORIQUE`, `DOMAINE_PROSPERA`,
       `CORRECTION_REFUSEE`, `MOUVEMENT_INCONNU`).
   - **`connecteurs.domaine.changed@1`** (AD-3, AD-34) : l'état absolu d'un domaine, soit `proprietaire`, `etat`,
     `niveau`, `epoque` et `numero`. `OMBRE` est refusé dans le réel. Un propriétaire inconnu n'est jamais publié.
   - **`domaines-echange@1`** : le champ `domainesEchange` de C1, au corps **identique** à celui du catalogue.
   - **`domaines-echange.cas.json`** : les trois règles, dans l'ordre des refus (`MANIFESTE_INVALIDE`,
     `MANIFESTE_OBJET_HORS_MODULE`, `MANIFESTE_ARGENT_SANS_CONTROLE`), et 13 cas, dont 4 acceptés. Un juge de
     référence les rejoue dans la plateforme.
4. **`@prospera/point-ecriture-unique` 1.0.0**, un fichier unique sans import :
   - `@PointDEcriture('<module>.<domaine>')` : un marqueur neutre à l'exécution, en décorateur legacy de Nest comme
     standard ;
   - `verifierPointsDEcriture({ domaines, sources })` : la **garde de balayage** que le gabarit de chaque dépôt cible
     rejoue (exemple jest dans l'en-tête). Anomalies :
     - `DOMAINE_SANS_POINT_D_ECRITURE` ;
     - `POINT_D_ECRITURE_MULTIPLE` ;
     - `POINT_D_ECRITURE_HORS_DOMAINE` ;
     - `POINT_D_ECRITURE_NON_LITTERAL`.

     Les commentaires ne comptent pas, et les numéros de ligne restent justes ;
   - `FaitDeDomaine` (`objetId` stable, `rang`) et `verifierFait` (`FAIT_SANS_OBJET_ID`, `FAIT_SANS_RANG`).
5. **README** : les contrats de Connecteurs, le paquet, la commande ; une ligne au tableau « Qui écrit ».
6. **Étiquettes** annotées sur `b4c5c46` : `seuils-fraicheur-v1`, `contrats-echange-v1`, `point-ecriture-unique-v1`.

### `platform-catalog-service` (#51, `60473e1` sur `dev`)

- `contrat/copies/echange/` :
  - `domaines-echange.schema.json` et `domaines-echange.cas.json`, recopiés **à l'octet** depuis l'étiquette par
    `git -c core.autocrlf=false show` ;
  - `ORIGINE.json` : dépôt, étiquette, commit, sha256 de chaque fichier.
- `contrats-echange.spec.ts` vérifie trois choses :
  - les empreintes de la copie ;
  - `properties.domainesEchange` de C1 est le schéma publié, à l'identique ;
  - les 13 cas sont rejoués contre `verifierPublication`, avec le code et les détails.
- `.gitattributes` : `contrat/copies/** -text`. Sans cette règle, `core.autocrlf=true` extrait la copie en CRLF et
  l'empreinte ne correspond plus.
- **Aucun changement de comportement** du catalogue : aucun module Nest touché, donc pas de `docker compose up`.

## Preuves

- **Plateforme**, Node 24 (`node:24-slim`, export `git archive`) :
  - `npm ci` ✔ ;
  - typecheck ✔ ;
  - `npm test` : **345 passés, 0 échec, 1 sauté**. Le test sauté est la comparaison de la garde à la matrice du
    catalogue, absente du conteneur. Avant : 318.
- **Mutations dans la plateforme** : chacune rougit sur une assertion.
  - le seuil immédiat passe de 5 à 10 min ;
  - `REFUSER` sans `raison` ;
  - `OMBRE` dans le réel ;
  - deux points d'écriture tolérés ;
  - un marqueur compté dans un commentaire (2 tests).
- **Catalogue** :
  - `jest src/modules/catalog/manifeste/` : 55/55, dont les 16 tests de la copie ;
  - lint des fichiers touchés ✔ et `tsc` ✔.
- **Mutations au catalogue** :
  - le refus d'argent n'exempte plus `LECTURE` : 1 cas rouge ;
  - un niveau `SEMAINE` est ajouté à C1 : égalité et cas rouges.
- **Catalogue sous Node 24** (étage `verification`, export `git archive`) : **86/86 suites, 1225/1225 tests** (1209
  avant), `tsc` ✔, build ✔.

## Décisions

- **D-954-1 — Pas de second refus `MANIFESTE_ARGENT_SANS_CONTROLE`.** Le catalogue l'avait depuis STORY-934. Ce
  qu'EPIC-169 ajoute, c'est que la règle soit **un contrat** de la plateforme, avec des cas joués des deux côtés
  (AD-29). Le catalogue les rejoue aujourd'hui, Connecteurs le fera demain.
- **D-954-2 — La plateforme est la source de `domainesEchange` ; son corps est celui du catalogue au 16/11.** Le
  schéma publié reprend mot pour mot le champ de C1. Le catalogue en garde une copie et prouve l'égalité. Changer le
  champ suppose donc une version étiquetée de la plateforme, puis la copie au catalogue, jamais l'un sans l'autre.
- **D-954-3 — Le préfixe du CODE de domaine n'est pas imposé.** `liaison-assureur` (C) déclare `assurance.contrats`,
  `sinistres.dossiers` et `ged.documents-sinistres`. Ce sont des domaines d'autres modules, dont il est le pont avec
  la compagnie. Seuls les **objets** doivent être du module. Le refuser aurait cassé un manifeste publié. La question
  est posée à C dans le journal de B.
- **D-954-4 — Deux contrats de plus que la liste d'EPIC-169 : `echange-reponse@1`, et les cas des règles.** Une
  enveloppe sans sa réponse est un demi-contrat, et AD-10 fixe déjà la réponse entière. Les cas sont ce qui fait jouer
  la règle « des deux côtés ». Les mouvements en attente (`GET …/en-attente`), l'état des domaines et les accusés
  attendent EPIC-170 : AD-29 n'en fixe pas encore le corps.
- **D-954-5 — Le marqueur est un décorateur neutre, et la garde lit le texte.** Une garde qui exécuterait le module
  aurait besoin de Nest et de sa base. Le balayage du texte (commentaires retirés, argument littéral exigé) tient dans
  un fichier sans import, copiable comme la garde de 937. Un marqueur dynamique est une anomalie, pas une supposition.
- **D-954-6 — `NUIT` n'a pas de seuil orange.** QK-3 ne donne que « nuit rouge à 06 h ». Un champ `orangeApresSecondes`
  sur `NUIT` est refusé par le schéma. Un ajout facultatif le permettrait plus tard, s'il faut un orange de nuit.

## Suite

- EPIC-170 (au déclencheur) : la part échange du kit des cibles lit `echange-enveloppe@1`, `echange-reponse@1` et
  `connecteurs.domaine.changed@1`, et publie les contrats qui manquent (mouvements en attente, état des domaines,
  accusés).
- Chaque module cible construit avant février copie `point-ecriture-unique-v1` et joue la garde dans son gabarit.
- La coque (Dev A, 11/12) génère sa table de fraîcheur depuis `seuils-fraicheur-v1`.
