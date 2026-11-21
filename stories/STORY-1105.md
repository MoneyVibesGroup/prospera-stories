# STORY-1105 : Plusieurs banques par demande, la relation du client avec chacune, le profil de l'entreprise

Status: ready-for-dev — **créée le 2026-11-21** à la demande de l'utilisateur, après validation de la maquette de FE-140
(PR #741). Non slottée : à placer au prochain plan.

**Service :** `prospera-bilan-service`, module `financement` · **Points :** 5
**Dépend de :** STORY-1083 (livrée) ; STORY-1104 pour le repère d'apport selon le profil (lecture seule, sans blocage).
**Débloque :** STORY-1085 (les exigences varient par profil et par relation), STORY-1086 (un dossier par banque), STORY-1107
(le suivi banque par banque), FE-152.
**Écran :** FE-152 (étape 2 « Les banques »).
**Suite :** STORY-1106.

---

## Pourquoi

STORY-1083 a posé **une seule** banque cible (`banque.code`). Dans la vraie vie, un cabinet remet une demande à **deux ou
trois banques** en même temps, compare les offres, et le client choisit. La liste des pièces **n'est pas la même** pour
chacune : une banque qui tient déjà le compte du client voit ses mouvements et connaît son client ; un nouveau client doit
tout fournir. Elle ne l'est pas non plus pour une **société établie** (qui montre son historique) et une **jeune société**
(qui présente un plan d'affaires).

**Décisions de l'utilisateur (20-21/11) :** pas de consentement BIC ; les pièces dépendent du **profil** de l'entreprise
(société établie ou jeune société) et de la **relation** avec chaque banque (déjà client à compte mouvementé, ou nouveau
client).

## Ce qui est attendu

1. **De 1 à 3 banques** par demande, chacune avec son propre suivi plus tard (1107), choisies dans le référentiel
   `exigences-bancaires-uemoa` ; une banque inconnue prend la « banque générique UEMOA » (FR-2), en gardant son nom.
2. **La relation avec chaque banque** : `CLIENT_MOUVEMENTE` (« déjà client, compte mouvementé ») ou `NOUVEAU_CLIENT`
   (« nouveau client ou compte récent »), préremplie quand elle se déduit.
3. **Le profil de l'entreprise** : `ETABLIE` ou `JEUNE`, déduit et modifiable (avec motif).
4. **Le remplacement de la banque cible unique** de 1083, avec la migration des dossiers existants.

## Décisions retenues par défaut (contestables)

- **D-1105-1 — `banques[]` remplace `banque`.** Contenu de la version du dossier (archivé avec elle, D-1083-10) : de 1 à 3
  entrées `{ id, code, libelle, versionReferentiel, relation, relationSource, note }`.
  - `id` : identifiant stable (24 hexadécimaux), clé de tout le suivi.
  - `code` : code du référentiel (`[A-Z0-9_-]`, 2 à 40) ; banque absente du référentiel : `UEMOA_GENERIQUE`.
  - `libelle` : le nom affiché (« Orabank Togo », « Ecobank Togo »), 2 à 100 ; pour une banque générique, c'est le nom saisi.
  - `versionReferentiel` : la version lue **à l'ajout de la banque**, jamais relue après (D-1083-12, FR-17 : « une nouvelle
    version ne change pas un dossier créé »).
  - `relation` ∈ `CLIENT_MOUVEMENTE`, `NOUVEAU_CLIENT` ; `relationSource` ∈ `SAISIE`, `DEDUITE`, `PAR_DEFAUT` ; `note` (200 au
    plus, facultative : « Compte depuis 2019, recettes domiciliées »).
  - Valeurs de la maquette : BOA Togo `NOUVEAU_CLIENT` (« compte ouvert récemment, peu de mouvements »), Orabank Togo
    `CLIENT_MOUVEMENTE` (« compte depuis 2019, recettes domiciliées »), Ecobank Togo `NOUVEAU_CLIENT` et générique (« pas
    encore cliente »).
- **D-1105-2 — La relation se déduit quand la comptabilité la montre.** Une banque `CLIENT_MOUVEMENTE` est proposée
  (`relationSource = DEDUITE`) quand la balance du dossier client porte un compte de classe 52 dont le libellé nomme la banque
  et qui a des mouvements sur au moins **6 des 12 derniers mois** (seuil par défaut, contestable). Sinon, ou sans balance :
  `NOUVEAU_CLIENT` en `PAR_DEFAUT`, **la plus exigeante** : mieux vaut demander une pièce de trop qu'oublier une pièce. Le
  cabinet confirme ou corrige (`SAISIE`) ; une valeur saisie n'est jamais écrasée par la déduction.
- **D-1105-3 — Le profil.** `profil: { valeur, source, dateCreation, exercicesValides, motif }`.
  - Déduction : `JEUNE` si l'entreprise a moins de **24 mois** à la date de création du dossier de financement **ou** moins
    de **2 exercices validés** dans Prospera ; `ETABLIE` sinon. La date de création est celle du profil de la société
    (RCCM) ; à défaut, la date d'ouverture du dossier client.
  - Référence : Ets Kossi Distribution, SARL créée en mars 2019 (7 ans), exercices 2024 et 2025 validés (2023 à importer) :
    `ETABLIE`. Une société créée en 2025 sans exercice complet : `JEUNE`.
  - Modifiable : `PUT /{id}/profil` `{ valeur, motif }` (motif de 10 à 300 caractères), `source = SURCHARGE`. `DELETE
    /{id}/profil/surcharge` revient à la déduction. Tant que le dossier est `BROUILLON`, le profil déduit se recalcule à la
    lecture ; il est **figé** à `PRET`, en même temps que la liste des exigences.
- **D-1105-4 — Les routes** (sous `/api/v1/dossiers/{dossierId}/financements/{financementId}`, mêmes gardes, portée et
  droits que 1083 ; écriture en `BROUILLON` seulement, sinon 409 `DOSSIER_FINANCEMENT_NON_MODIFIABLE`) :

  | Route | Droit | Effet |
  |---|---|---|
  | `GET /banques` | consulter | les banques, avec la relation suggérée et sa raison |
  | `PUT /banques` | préparer | remplace la liste (1 à 3) ; garde l'`id` des banques qui restent |
  | `GET /profil` | consulter | le profil, sa source, ses deux faits (date de création, exercices validés) |
  | `PUT /profil` | préparer | surcharge du profil |
  | `DELETE /profil/surcharge` | préparer | retour à la déduction |

  `POST /` (création, 1083) accepte `banques` ; `GET /{id}` rend `banques` et `profil`.
- **D-1105-5 — Refus** : 422 `BANQUES_TROP_NOMBREUSES` (plus de 3), 422 `AUCUNE_BANQUE` (liste vide, et au passage `PRET`),
  409 `BANQUE_EN_DOUBLE` (même `code` hors générique, ou même `libelle`), 404 `BANQUE_INTROUVABLE`, 409
  `BANQUE_DEJA_SUIVIE` (retirer une banque dont le suivi a commencé, STORY-1107), 422 `RELATION_INVALIDE`, 422
  `MOTIF_REQUIS` (surcharge du profil sans motif de 10 caractères au moins), 409 `CONFLIT_CONCURRENT`.
- **D-1105-6 — Migration et compatibilité** (la banque unique de 1083 disparaît).
  - Aucun dossier `REMIS`, `ACCORDE` ou `REFUSE` n'existe en production : ces états n'étaient pas atteignables par l'API
    (D-1083-9). Seuls des dossiers `BROUILLON`, `PRET` ou `ABANDONNE` portent l'ancien champ `banque`.
  - Migration idempotente au démarrage (script rejouable, écrit dans le dossier des migrations de bilan) : `banque` →
    `banques[0]` avec `relation = NOUVEAU_CLIENT`, `relationSource = PAR_DEFAUT`, `libelle` = le code, `versionReferentiel` =
    celle de l'ancienne banque ; les versions archivées sont traitées de la même façon.
  - Pendant **une version du contrat** : la lecture rend encore `banque` (= `banques[0]`, marquée dépréciée dans l'OpenAPI) ;
    l'écriture de `banque` est refusée 400 `CHAMP_REMPLACE` (`details.parBanques`). FE-140, pas encore codé, ne lit que
    `banques`.
  - L'ancienne banque générique par défaut (D-1083-12) devient la valeur de `UEMOA_GENERIQUE`.
- **D-1105-7 — Piste d'audit** : `FINANCEMENT_MODIFIE` avec `banque` (identifiant) et `geste` (`AJOUT`, `RETRAIT`, `RELATION`)
  ou `profil` et `geste` (`SURCHARGE`, `RETOUR_DEDUCTION`), comme D-1084-14. Effacement C13 : rien de neuf.
- **D-1105-8 — Les lectures sont hors jeton**, comme le reste du module (D-1083-3) ; le manifeste M49 passe en 0.3.0 avec
  les deux lectures neuves dans `routesLectureSeule`.

## Critères d'acceptation

- **AC-1** : trois banques acceptées, la quatrième refusée `BANQUES_TROP_NOMBREUSES` ; une banque sans code du référentiel
  prend `UEMOA_GENERIQUE` et garde son nom ; un doublon est refusé.
- **AC-2** : la relation d'Orabank Togo (compte depuis 2019, mouvements sur 12 mois) est déduite `CLIENT_MOUVEMENTE` ; celle
  d'un compte à 4 mois de mouvements ne l'est pas (`NOUVEAU_CLIENT`, `PAR_DEFAUT`) ; une relation saisie n'est jamais écrasée.
- **AC-3** : le profil d'Ets Kossi est `ETABLIE` ; celui d'une société créée il y a 10 mois est `JEUNE` ; la surcharge exige un
  motif ; le profil est figé à `PRET` (relire après un changement de balance rend la même valeur).
- **AC-4** : la migration convertit `banque` en `banques[0]` sans perte, deux exécutions de suite donnent le même résultat ;
  l'écriture de `banque` est refusée `CHAMP_REMPLACE`.
- **AC-5** : une banque dont le suivi a commencé ne se retire pas (`BANQUE_DEJA_SUIVIE`) ; la version référentielle d'une banque
  déjà ajoutée ne change pas quand le référentiel est republié ; mutation.
- **AC-6** : droits et portée comme 1083 ; contrat publié, typé dans l'OpenAPI, annoncé dans « ⚠ Contrats » avant le code.

## Hors périmètre

- Les exigences de chaque banque et leur calcul (STORY-1085, AP-50).
- Le suivi de chaque banque (STORY-1107).
- Ajouter une banque à un dossier déjà `REMIS` (passe par une nouvelle version, STORY-1083).
- Le consentement du client à la consultation de son historique de crédit (BIC) : **écarté par l'utilisateur** (20/11).
