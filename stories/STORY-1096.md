# STORY-1096 : Importer le plan comptable de Sage 100 — au cabinet ou à un client, aperçu puis enregistrement

Status: done — **livrée le 2026-11-21**, AC-4 à rejouer sur un export réel (comptabilite-service #15, `2f358dc` sur `dev` ; contrat annoncé stories #749). Créée le 2026-11-18 à la demande de l'utilisateur. Non slottée.

**Service :** `prospera-comptabilite-service` (tenu par B au lot 4) · **Points :** 8
**Dépend de :** STORY-1094 (modèle du cabinet), STORY-1095 (plan du dossier)

---

## Pourquoi

Un cabinet qui quitte Sage 100 a déjà saisi son plan des centaines de fois. Le ressaisir compte par compte est la
raison même pour laquelle il hésite. Sage 100 exporte sa liste de comptes (copie vers Excel, « Fichier › Exporter »
en format paramétrable ; la forme exacte dépend de la version). L'utilisateur l'a demandé le 2026-11-18 : « ou bien
importer celui de Sage ».

## Ce qui est attendu

1. **Une route d'import en deux temps**, sur le patron déjà connu du produit (import Sage des balances) :
   - un **aperçu** (`dryRun`) qui n'écrit rien ;
   - un **enregistrement**, qui rejoue exactement l'aperçu.
   La cible est le **modèle du cabinet** ou le **plan d'un dossier**.
2. **Formats** :
   - CSV ou XLSX tels qu'exportés de Sage 100 : numéro, intitulé, et le type de compte quand il est présent ;
   - les colonnes se désignent par un **profil d'import** (même mécanisme que les balances), pour les exports non
     standard ;
   - les journaux s'importent par le même fichier s'il les porte, ou par un second fichier.
3. **Rattachement** : chaque compte lu est rattaché à la **racine du référentiel** de la cible par le préfixe le plus
   long :
   - un compte **égal** à une racine est **déjà connu** et n'est pas recréé ;
   - un compte **sans racine** est une **anomalie nommée**, jamais importée en silence ;
   - un compte **déjà présent** (même numéro) est signalé, et jamais écrasé.
4. **L'aperçu** dit, en nombres et en liste :
   - ce qui sera créé ;
   - ce qui est déjà connu ;
   - ce qui est en anomalie, avec la raison et la racine la plus proche.
   L'enregistrement ne crée que ce que l'aperçu annonçait. Si le plan a changé entre-temps, il le refuse (`409`).
5. **Idempotence** : réimporter le même fichier ne crée rien de plus.
6. **Audit** : l'import est un seul acte (fichier, empreinte, nombre de créations, auteur), au journal du cabinet ou
   du dossier selon la cible.

## Critères d'acceptation

- **AC-1** : l'aperçu n'écrit rien, et l'enregistrement crée exactement ce qu'il annonçait.
- **AC-2** : aucun compte sans racine n'est importé ; chacun figure dans les anomalies, avec sa raison.
- **AC-3** : réimporter le même fichier ne crée rien.
- **AC-4** : un vrai export de Sage 100, fourni par un cabinet, sert de cas de test, avec ses données anonymisées
  (geste de l'utilisateur : fournir le fichier).

---

## Décisions de FE-148 et de cadrage (2026-11-21, groupe A)

La maquette FE-148 est validée par l'utilisateur (prospera-stories #747). Elle fixe, pour cette story :

- **D-1096-1 (FE-148 n° 4)** : **les comptes collectifs ne sont pas recréés, seule la racine compte.** Une ligne d'export Sage de type « Tiers » (colonne *Type*), ou qui renseigne un *Collectif* (`411ACCR`, collectif `411`), est un compte AUXILIAIRE de tiers : elle n'est ni créée ni en anomalie, elle est comptée à part (« tiers ignorés ») ; la racine de son collectif (`411`) est déjà au plan, le tiers se crée au registre des tiers du dossier.
- **D-1096-2 (FE-148 n° 5)** : un vrai export Sage 100 est attendu de l'utilisateur pour l'**AC-4**. En attendant, le cas de test est le **format décrit ici** et le fichier d'exemple `prototypes/exemples/export-sage-plan-comptable-cabinet-diallo.csv` (BOM UTF-8, séparateur `;`, colonnes `Numéro de compte;Intitulé du compte;Type;Collectif`). **AC-4 : « à rejouer sur un export réel »**, sans bloquer la livraison.
- **D-1096-3** : CSV (UTF-8 ou Windows-1252, séparateur `;`, `,` ou tabulation détecté) et XLSX (première feuille, bibliothèque `exceljs`, comme `balance-service`). Les colonnes se désignent par leur **nom d'en-tête** (`profil`), sinon par les noms usuels de Sage ; un second fichier facultatif porte les journaux.
- **D-1096-4** : l'aperçu rend `versionDuPlan` et `empreinteApercu` ; l'enregistrement les exige, rejoue le calcul dans sa transaction et refuse si le plan a changé (409 `PLAN_CHANGE_DEPUIS_L_APERCU`) ou si le fichier n'est plus celui de l'aperçu (409 `APERCU_DIFFERENT`). Un import qui ne crée rien n'écrit rien (ni version ni acte) : c'est ce qui rend la réimportation idempotente.
- **D-1096-5** : un seul acte d'audit par import (`PLAN_IMPORTE` au journal du cabinet ou du dossier) : fichier, empreinte SHA-256, nombre de comptes et de journaux créés, auteur. Droits de la cible : l'administrateur pour le cabinet ; l'administrateur ou le responsable du dossier pour un dossier (dossier archivé : 409).

## Livraison (2026-11-21, groupe A)

**Routes** (contrat dans le journal du groupe A, « ⚠ Contrats ») : `POST /api/v1/cabinet/plan-comptable/import` et `POST /api/v1/dossiers/{d}/plan-comptable/import` (multipart `fichier`, `journaux`, `profil`, `profilJournaux` ; `dryRun`, `versionDuPlan`, `empreinteApercu`).

**Preuves** : unitaires 938 passés (Node 24, 63 suites, dont 28 d'import), `test:socle` 308/308 (14 suites, dont 19 neufs), mutation 10/10 rouges en unitaire et 5/5 au socle, lint, tsc ; gate de câblage `docker compose up` du service (grp-a) : healthy, `exceljs` présent dans l'image d'exécution, routes neuves 401 sans jeton.

**AC** : AC-1 (l'aperçu n'écrit ni compte, ni version, ni acte ; l'enregistrement crée exactement les 13 comptes annoncés), AC-2 (un compte sans racine est une anomalie `SANS_RACINE` avec la racine la plus proche, jamais créé), AC-3 (réimporter le même fichier ne crée rien et n'écrit ni version ni acte ; un compte présent n'est jamais écrasé). **AC-4 : le cas de test est le fichier d'exemple du cabinet Diallo** (`prototypes/exemples/export-sage-plan-comptable-cabinet-diallo.csv`, copié en `test/fixtures/sage/` du service). **À rejouer sur un export réel** de Sage 100 anonymisé, fourni par un cabinet : geste de l'utilisateur, sans bloquer.

**Décisions** (D-1096-1 à 5 plus haut, et) :
- **D-1096-6** : un compte qui EST un compte du plan publié d'un référentiel (`401`, `411`, `521`) est « déjà connu » et n'est pas recréé, même s'il subdivise une racine d'un autre référentiel ; sur l'export d'exemple : 13 à créer, 3 déjà connus, 1 anomalie (`521600` sans intitulé), 4 comptes de tiers ignorés.
- **D-1096-7** : un numéro qu'un dossier du cabinet porte déjà n'est pas créé au modèle par l'import (`PORTE_PAR_UN_DOSSIER`), pour la même raison qu'en 1095 ; vers un dossier, un numéro du modèle est « déjà présent » (origine `CABINET`).
- **D-1096-8** : encodage lu en UTF-8 strict, sinon Windows-1252 ; au plus 5 000 lignes et 5 Mo ; le classeur XLSX se lit par `exceljs` (première feuille), importé à la demande.
- **Ouvert** : les journaux de Sage se reconnaissent par leurs mots usuels (Achat, Vente, Trésorerie, Banque, Caisse, Opérations diverses) ; un type inconnu est une anomalie `TYPE_INCONNU`. À confirmer sur un export réel avec l'AC-4.
