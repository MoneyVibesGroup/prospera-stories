# STORY-1011 : un formulaire d'instruction par type de sinistre

Status: done

**Complexité :** moyenne (un paramètre figé, un contrôle pur, une version figée sur le dossier, deux routes, un acte de partie)

**Épic :** EPIC-207 (instruire le dossier)
**Dépôt :** `prospera-sinistres-service` (module `sinistres`) ; une route de lecture de plus au manifeste ; aucun fait neuf
**Plage :** groupe C, n° 7 du lot 3 (`coordination/PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §5) ; dépend de STORY-1002 (le titulaire instruit).
Ancrage : FR-55 (un formulaire par famille de sinistre, versionné), FR-70 (le corporel et la santé ont leur canal), FR-75 (une évaluation arrêtée n'est pas altérée : STORY-1013), FR-29 (partie au dossier).

---

## Pourquoi

Un gestionnaire instruit avec les mêmes questions quel que soit le sinistre : immatriculation et vétusté pour un véhicule,
capital assuré pour un bien, plainte pour un vol, réserves pour un transport. FR-55 veut un formulaire propre à chaque famille,
dont le serveur est seul juge, et dont la version ne change pas sous les pieds d'un dossier en cours. Sans lui, les décomptes
de STORY-1010 et 1012 n'ont aucune entrée sûre.

## Ce qui doit être vrai à la fin

| # | Critère d'acceptation | Preuve attendue |
|:--:|---|---|
| AC-1 | **Un formulaire par type, en paramètre versionné** : `formulaires-2026.1.json` donne à chacun des 12 types de `TYPES_DE_SINISTRE` un formulaire (6 familles) ou un renvoi (`ACCIDENT_TRAVAIL`, `DECES` → `BAREME_CORPOREL`) ; aucun trou, aucun doublon ; empreinte sha256 testée | test pur |
| AC-2 | ⛔ **Contrôlé par le serveur** : un champ obligatoire absent donne `CHAMP_OBLIGATOIRE_ABSENT` (400) qui les liste tous (aussi un champ obligatoire SI : date de la plainte quand une plainte est déposée) ; hors formulaire `CHAMP_INCONNU` ; type ou bornes `VALEUR_INVALIDE` ; un refus est tracé et ne change rien | tests purs, deux bancs |
| AC-3 | ⛔ **Version figée** : la version en vigueur à l'entrée en instruction (transition 5…) est écrite sur le dossier ; une version publiée plus tard ne le change pas, même après une demande de pièces et la reprise ; un dossier déjà en instruction sans version se fige au premier enregistrement | tests, deux bancs |
| AC-4 | **Chaque mise à jour est une ligne de plus** : enregistrement numéroté (valeurs entières, champs modifiés), ligne d'audit chaînée qui ne nomme que les CODES des champs ; rejeu par la même clé sans rien ajouter ; version périmée refusée | tests ; Mongo réel |
| AC-5 | **Interactions** : portée et rôles de 1004 (hors portée : introuvable ; ACC et experts ne lisent ni n'écrivent) ; enregistrer le formulaire rend partie « instruire » (1003, 1009 inchangées) | tests |
| AC-6 | ⛔ **Santé** : aucun champ de santé dans les formulaires, rien du formulaire dans un fait ni dans la piste | tests |
| AC-7 | **Lecture** : `GET /api/v1/sinistres/dossiers/{id}/instruction` déclarée en lecture seule au manifeste (copie à l'octet) ; le POST n'y figure pas | invariant |

## Décisions retenues par défaut (contestables)

- **D-1011-1 — Six familles, un formulaire par famille, un type pointe sa famille.** Véhicule (`AUTO_MATERIEL`,
  `AUTO_COLLISION`, `AUTO_CORPOREL`), biens (`INCENDIE`, `DEGAT_DES_EAUX`, `MRH`), `VOL`, `TRANSPORT`, `RC_GENERALE`, `DIVERS`,
  d'après la démo (`lib/instruction-schemas.ts`) ; le PRD parle de familles. `ACCIDENT_TRAVAIL` et `DECES` n'ont pas de
  formulaire de calcul : un renvoi vers le barème corporel, et `FORMULAIRE_SANS_CALCUL` (409) si on tente d'écrire.
- **D-1011-2 — Seuls les champs sont posés ; ni calcul, ni alerte.** Le décompte (FR-69, FR-72, FR-73) est STORY-1010 et
  1012 ; les alertes (`BLOQUANT`, `ALERTE`, `INFO`) et leur seuil paramétrable viendront avec elles. Les champs que ces
  calculs liront (vétusté, franchise, capital, valeur vénale, devis, épave) sont déjà là.
- **D-1011-3 — La version se fige à l'entrée en instruction**, par la transition qui amène en `EN_INSTRUCTION` si le dossier
  n'a pas déjà son formulaire ; à défaut (dossier déjà en instruction avant cette story), au premier enregistrement. La version
  en vigueur est la plus récente dont `valableDepuis` est atteint (la plus ancienne si le jour précède toutes les versions).
- **D-1011-4 — Enregistrer est tout ou rien.** Pas de brouillon : le serveur refuse un formulaire incomplet. Un champ
  facultatif absent prend son défaut s'il en a un (franchise 25 000, abattement 10 % de la démo).
- **D-1011-5 — Le formulaire s'écrit en `EN_INSTRUCTION` seulement, par `GEST`, `GREC`, `RESP`** (les rôles de la
  transition 5) : `INSTRUCTION_IMPOSSIBLE` (409) sinon. Après l'évaluation, il se rouvre par la transition 9 ; l'évaluation
  arrêtée n'est jamais recalculée (STORY-1013).
- **D-1011-6 — Enregistrer le formulaire, c'est instruire** (acte de partie `INSTRUIRE`, FR-29) : sinon celui qui remplit le
  formulaire pourrait ensuite valider ou contrôler. Aucun fichier figé de 1003 ne change : le code ajoute l'acte.
- **D-1011-7 — Aucune valeur dans la piste d'audit ni dans un fait.** La ligne d'audit dit les codes des champs modifiés ;
  les valeurs vivent sur le dossier, qui ne part dans aucun fait (`faitDuDossier` n'en lit aucune).
- **D-1011-8 — Lecture réservée à `GEST`, `GREC`, `RESP`, `COMITE`, `DT`, `DG`, `AUD`.** La démo limite l'instruction pour
  l'accueil, la GED et les experts. Liste à confirmer avec l'annexe B.
- **D-1011-9 — Pas de champ de santé.** Le formulaire véhicule d'un `AUTO_CORPOREL` ne décrit que le véhicule ; les données
  médicales du corporel (FR-70, masquées aux rôles non autorisés) auront leur propre canal, jamais ce formulaire ni un fait.
  Un test refuse tout champ dont le code ou le libellé parle de santé.

## Ce qui a été livré

**2026-11-17** — `prospera-stories` **#635** (manifeste, `main` 36da9fd) et `prospera-sinistres-service` **#21** (`dev` 520e7d4,
deux commits rejoués : le code 4a5da42 et l'empreinte du manifeste dans `sources-des-manifestes.ts`) :

- `instruction/formulaires.ts` (pur : types de champ, `formulaireDuType`, `versionEnVigueur`, `controlerLesValeurs`,
  `champsModifies`) et `formulaires-2026.1.json` (empreinte `fac1f8c2…`). `Dossier.instruction` (type, famille, version
  figée, date, enregistrements en ajout seul), stocké en Mixed.
- `DossiersService` : `figerLeFormulaire` à l'entrée en instruction (transition), `enregistrerLInstruction` (commande
  `ENREGISTRER_INSTRUCTION` : idempotence, version lue, refus tracé, audit chaîné) et `instruction` (lecture). Routes
  `POST` et `GET …/dossiers/{id}/instruction`. Refus nouveaux : `CHAMP_OBLIGATOIRE_ABSENT`, `CHAMP_INCONNU`,
  `VALEUR_INVALIDE` (400), `INSTRUCTION_IMPOSSIBLE`, `FORMULAIRE_SANS_CALCUL`, `FORMULAIRE_INCONNU`,
  `TYPE_DE_SINISTRE_ABSENT` (409). `partie.ts` : l'enregistrement du formulaire est un acte `INSTRUIRE`.
- **Tests** : 12 purs (`formulaires.spec.ts`), 8 du service sur les deux bancs (figement et renvoi, refus nommés et tracés,
  lignes et audit sans valeurs, nouvelle version publiée en cours d'instruction avec demande de pièces et reprise, figement
  tardif, rejeu, portée et rôles, partie et faits), 2 invariants (manifeste). Deux mutations (figement retiré, contrôle des
  obligatoires retiré) : chacune rougit sur l'assertion.
- **Node 24** (étage `verification`, image depuis `git archive`, MongoDB réel en jeu de répliques) : lint 0, 1110 unitaires
  (56 suites + 1 sautée), 25 e2e, build 0.
- **Pas de pile** (plan : « Docker : non ») : aucun module Nest, fournisseur ni import ne change.

**Reste**
- Les calculs et les alertes de chaque famille : STORY-1010 (décompte dans l'ordre fixe) et 1012 (matériel automobile).
- Le seuil paramétrable des alertes (H-046) avec elles.
- Le pré-remplissage par l'IA (FR-56) : il écrira les valeurs avec leur pièce source, après lecture du gestionnaire.
- Les champs de santé du corporel (FR-70) et leur accès par dossier.
- L'écran : il lit `GET …/instruction` (champs, libellés, bornes, valeurs) et envoie `POST` ; il ne devine rien.
