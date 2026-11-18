# Lot 4 : B tient le backend du cabinet, D le distributeur, C l'assurance, A les écrans

> **Date :** 2026-11-18 · **Statut :** proposé par la session du groupe A, sur consigne de l'utilisateur ; en vigueur
> dès la fusion de ce document.
> **Consignes de l'utilisateur (2026-11-18) :**
> - les stories backend du groupe A sont faites sur **l'autre poste, par B** ; B en a **dix**, et **commence par des
>   stories sans Docker** pour que cela progresse ;
> - **D**, sur l'autre poste, fait **cinq stories backend**, comme C ;
> - **C** garde ses quatre stories backend ;
> - **A** (poste principal, avec l'utilisateur) **commence par FE-069**, puis fait un écran du cabinet et un écran de la
>   console.
> **Suite de** `PLAN-4-SESSIONS-LOT-3-2026-11-17.md` : A, B, C et D ont fini leur lot 3 (17-18/11). Tout ce qui n'est
> pas changé ici reste en vigueur : le rituel, les journaux, `REGLES-DES-GROUPES.md`, le verrou Docker par poste.
> **Sources :** journaux des quatre groupes (18/11), `epics-services-cabinet-2026-11-18.md` (lot F1), réponses de
> l'utilisateur aux questions au PO du 18/11 (journal de A, « Demandes aux autres groupes »).

---

## 0. Ce qui ne change pas

- Le **rituel** avant chaque story : relire ce plan et les demandes des journaux, écrire la fiche juste avant de coder,
  prouver (Node 24, tests, lint, build, `docker compose up` quand la story le demande), pousser, PR, **« Rebase and
  merge » par le groupe lui-même**, vérifier le SHA de tête, PR de docs (fiche, tracker, journal), story suivante.
- **Un dépôt = un groupe** (§1). Une demande à un autre groupe s'écrit dans le journal du demandeur ; le destinataire
  la lit au rituel et répond dans le sien.
- **Docker** : une pile lourde à la fois **par poste**, sous le verrou `MoneyVibes_Apps\.verrou-docker` ; piles
  préfixées `grp-a` → `grp-d`, descendues avec leurs volumes. **A et C** partagent le poste principal ; **B et D**
  partagent l'autre poste.
- **MinIO** : `cgr.dev/chainguard/minio:latest`, `user: '0'`.
- **Écrans** : maquette d'abord, ajoutée au prototype (`prototypes/prospera-prototype.html` pour le cabinet,
  prototype séparé pour la console), republiée et **validée par l'utilisateur** avant le code ; types générés depuis
  l'OpenAPI vivant ; e2e sur vrai backend.

## 1. Qui tient quel dépôt (lot 4)

| Dépôt | Groupe | Changement par rapport au lot 3 |
|---|---|---|
| balance, bilan, dossier, `admin-panel-service` (BFF), `prospera-recette` | **B** (pour ce lot) | **viennent de A** |
| catalogue, paiement, auth, `prospera-plateforme` (hors dossiers de C et D), `agent-instance`, `centrale-service`, `prospera-comptabilite-service` | **B** | — |
| fiscal, kyc | A (aucune story ce lot) | — |
| `prospera-frontend-expert-comptable`, `frontend-admin-panel` (console) | **A** | **+ console** (vient de D pour ce lot) |
| sinistres, assurance, `document-service`, liaison-assureur ; dans la plateforme : `contrats/assurance/`, `champs-sensibles/`, `classification-sante/` | **C** | — |
| `reseau-service`, ventes, terrain, recouvrement, pilotage, croissance, `prospera-assureur-fictif`, `prospera-notification-service` ; dans la plateforme : `series/`, `vocabulaires/`, `contrats/distributeur/`, `encours/` | **D** | — |

**Décisions de partage (retenues par défaut, contestables) :**

- **D-L4-1 — B reprend le backend du cabinet pour ce lot.** A écrit la passation dans son journal (dernier commit
  sur `dev` de chaque dépôt) à la fusion de ce plan. B la constate au rituel de sa première story sur ces dépôts.
  **À lire avant** : la section « Pièges rencontrés » du journal de A (CRLF et empreintes, `git -c core.autocrlf=false
  archive`, barrels de l'éditeur, recette lancée sans `--build`, Node 25 du poste principal). À la fin du lot, B écrit
  la passation inverse ; Dev A (arrivée le 07/12) les reprend ensuite, selon le plan suivant.
- **D-L4-2 — A tient les deux fronts.** FE-069 reste à l'utilisateur ; A y ajoute FE-034 et AP-38. La console vient
  de D pour ce lot (D est au backend).
- **D-L4-3 — B commence sans Docker.** Ses cinq premières stories se prouvent par les tests du service (relancés par
  chemin de fichier). Les cinq suivantes lèvent une pile, et **la recette croisée complète n'est jouée qu'une fois**,
  en dernier (1080).

## 2. Groupe A : les écrans (poste principal)

| # | Story | App | Dépend de | Fini quand |
|:--:|---|---|---|---|
| 1 | **FE-069** le gate d'intégration du parcours cabinet (en cours, tenue par l'utilisateur) | cabinet | — | selon sa fiche |
| 2 | **FE-034** le cycle brouillon → validé de la liasse : version figée, versions, piste d'audit (FR-014/015/017) | cabinet | au rituel : STORY-441, 445, 449 livrées | maquette déjà livrée, revalidée ; e2e sur vrai backend |
| 3 | **AP-38** la revue KYC ne perd plus le motif saisi pièce par pièce | console | — | les motifs par pièce sont reportés dans le motif du dossier (`reason`, au plus 1 000 caractères), l'opérateur voit le texte composé avant l'envoi, un dépassement est refusé sans troncature (ticket `motif-par-piece-revue-kyc`) ; aucune modification du backend |

## 3. Groupe B : le backend du cabinet, puis le sien (autre poste)

Plage : **STORY-973 → 976** (B), plus les stories reçues de A (**1080 → 1084, 1093**). **Ordre : sans Docker
d'abord.**

| # | Story | Dépôts | Docker | Dépend de | Fini quand |
|:--:|---|---|:--:|---|---|
| 1 | **974** l'invitation des utilisateurs à la mise en service | auth, catalogue | non | — | une route d'invitation est ouverte à l'identité de service du moteur, et seulement à elle ; la mise en service invite les utilisateurs de l'essai dans l'espace réel (AD-15) ; idempotente |
| 2 | **973** le plan SMT propre | comptabilité | non | — | le plan SMT déclare le **journal de trésorerie** (recettes et dépenses) prévu par l'AUDCIF, au lieu des six journaux du système normal (D-961-1 renversée par l'utilisateur) |
| 3 | **1083** le dossier de financement existe | bilan | non | — | `epics-services-cabinet-2026-11-18.md`, STORY-1083 (module `financement`, états, droits, versions) |
| 4 | **1084** l'échéancier de chaque emprunt, et les ratios de dette | bilan | non | 1083 | idem, STORY-1084 (valeur de référence : 25 000 000, 12 %, 48 mois ⇒ 658 346 / 658 339 / 6 600 601) |
| 5 | **1081** le relais BFF `PATCH /dossiers/{id}` ouvert au collaborateur | BFF, dossier | non | — | le collaborateur modifie l'identité d'un dossier de son portefeuille ; le 409 de version reste muet (D12) ; D-923-1 renversée par l'utilisateur |
| 6 | **976** `paiement` reçoit `facturation.facture.emise@1` et ouvre la créance | paiement | 1 pile | — | même `OuvrirLaCreance` que la route de D-1059 ; idempotent par `(source, sourceId)` ; même résultat par le fait et par la route (D-965-9) |
| 7 | **975** la comptabilité installable par le moteur | comptabilité | 1 pile | — | la vérification `referentiel-resolu` répond au contrat `verification-installation@1` ; routes C13 de la comptabilité (import et effacement du jeu du cabinet, ou sans objet nommé) ; `POST /installations` de `comptabilite` aboutit (D-972-2) |
| 8 | **1082** le dossier de démonstration créé par le moteur | dossier, balance | 1 pile | — | `dossier-service` crée le dossier de démonstration sous l'identité `MOTEUR`, en espace d'essai seulement ; l'import C13 de balance le résout au lieu de le dériver (fin de D-928-3) ; la balance validée de la démo arrive à bilan ; ticket fermé |
| 9 | **1093** la comptabilité branchée au hub et à la recette | balance, recette | recette | 975 | `comptabilite-service` dans le défaut d'`INGESTION_SOURCE_SYSTEMS` ; le service dans `docker-compose.recette.yml` (port 3420, MongoDB en jeu de répliques, Kafka, `AUTH_*`, `DOSSIER_SERVICE_URL`, `DOCUMENT_SERVICE_URL`) et dans l'`AUTH_AUDIENCE` de l'IdP ; une balance d'origine `comptabilite` est ingérée |
| 10 | **1080** le cabinet installé par le moteur (clôture) | balance, bilan, recette | **recette complète** | 975, 1093 | balance et bilan servent leurs six routes `…/verifications/…` ; `cabinet-moteur` installe par `POST /installations` (le test D-929-1 s'inverse), plus par le `PUT` de la console ; `INSTALLATION_SERVICES` au catalogue de la recette ; recette croisée complète verte sur pile neuve, **jouée une fois** |

**Remplaçantes** : la pose des comptes du jeu par le catalogue à l'ouverture d'un essai (`comptes` facultatif dans
`jeu-demonstration@1`, D-972-9) ; le correctif du client admin Kafka dans `/health` de balance et bilan (demande de B
du 17/11, maintenant chez lui).

## 4. Groupe D : le distributeur, au backend (autre poste)

Plage : **STORY-1060 → 1064**.

| # | Story | Dépôts | Docker | Dépend de | Fini quand |
|:--:|---|---|:--:|---|---|
| 1 | **1060** un calendrier propre à chaque organisation | terrain, plateforme | non | — | jours travaillés et jours fériés en paramètre C6 de l'organisation, lus par le plan de journée et par la résolution à l'import (Q-D-9 renversée par l'utilisateur) |
| 2 | **1061** la facture juste (2) | ventes | non | 1059 | la suite de la facture nommée par D au lot 3 (EPIC-230), précisée dans la fiche |
| 3 | **1062** la commande (2) | ventes | non | 1056 | la suite de la commande (EPIC-228), précisée dans la fiche |
| 4 | **1063** les référentiels du distributeur côté réseau | reseau | non | — | zones à plat, points de vente rattachés (EPIC-227) |
| 5 | **1064** les comptes du bureau dans le jeu « Grossiste du Golfe » | plateforme (jeu), ventes | non | 1058 | le fichier des comptes (`AKOSSIWA`, `MENSAH`, `YAWA`, `AYITE` ; agents `COM-nn`, rôles de D-972-9) est dans le jeu, vérifié par `jeu:verifier` ; la pose par le catalogue reste à B (remplaçante de B) |

**Remplaçantes** : les référentiels du distributeur restants d'EPIC-227 ; la recette de la démo assurance dans
`prospera-recette` (demande de D à A, quand C aura le parcours `SIN-2026-9002` ; la recette est chez B ce lot).

## 5. Groupe C : l'assurance, au backend (poste principal)

Plage : **STORY-1015 → 1018** (réservées le 18/11).

| # | Story | Dépôts | Docker | Fini quand |
|:--:|---|---|:--:|---|
| 1 | **1018** correctif de FR-73 | sinistres | non | `stories/STORY-1018.md` (prête) : arrêter à l'indemnité proposée ou au décompte ne demande pas de motif ; le refus nomme les deux montants |
| 2 | **1015** la déclaration part seule à l'assureur | sinistres, liaison-assureur, plateforme | 1 pile | `sinistres.declaration.enregistree@1` et `sinistres.garantie.decidee@1` au registre ; publiés par `sinistres`, consommés par `liaison-assureur` (ligne C-13) ; **avant la démo** |
| 3 | **1017** la déclaration rapide depuis un message WhatsApp | sinistres | non | FR-34, FR-35 : le **texte** pré-remplit la fiche, chaque champ avec sa confiance et son extrait ; rien n'est créé sans l'agent ; règles explicables tant qu'aucun modèle n'est installé ; un vocal est rangé comme pièce, non lu |
| 4 | **1016** l'arrêt de l'évaluation propose la provision | sinistres, assurance | non | motif `EVALUATION` (FR-76) ; ajout facultatif du motif au fait ; `assurance` reste le seul écrivain des mouvements |

**Remplaçante** : la mission d'expertise et sa machine d'états (FR-61).

## 6. Ce que l'utilisateur doit faire (gestes réservés)

| Geste | Pour | Avant |
|---|---|---|
| Valider la maquette de FE-034 (revalidation) et celle d'AP-38 | A | leur code |
| Lancer B et D sur ce plan (autre poste) ; C et A sur le poste principal | tous | dès la fusion |

Aucun dépôt à créer dans ce lot.

## 7. Ce que les groupes attendent les uns des autres

| Story qui attend | Attend | Risque |
|---|---|---|
| B-1080 | B-975, B-1093 (même groupe) | faible |
| B (dépôts de A) | passation écrite par A (D-L4-1) | faible |
| C-1015 | rien (C tient `contrats/assurance/`) | faible |
| A-FE-034 | STORY-441, 445, 449 livrées (à vérifier au rituel) | moyen : sinon A prend une remplaçante (FE-038, l'export de la liasse) |

## 8. Les plages d'identifiants (lot 4)

| Groupe | Stories du lot 4 | Réservées |
|---|---|---|
| A | FE-069, FE-034, AP-38 | existantes ; AP-38 inscrite au tracker frontend par ce plan |
| B | STORY-973 → 976 ; reçues de A : 1080 → 1084, 1093 | 975, 976, 1093 réservées par ce plan |
| C | STORY-1015 → 1018 | déjà réservées |
| D | STORY-1060 → 1064 | 1061 → 1064 réservées par ce plan |

Chaque groupe insère ses entrées juste après la dernière de sa plage ; le plafond `story_id_high_water_mark` reste le
MAX réellement écrit.
