# Journal du groupe D

> Écrit par le groupe D seulement. Lot 1 : `PLAN-4-SESSIONS-2026-11-14.md` §6 (le frontend, jamais commencé). **Lot 2 :
> `PLAN-4-SESSIONS-LOT-2-2026-11-16.md` §5 (backend : `reseau-service`, puis le socle du distributeur).**

## État

### Lot 3 (ouvert le 2026-11-17)

- **Plan** : `PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §4 : **STORY-1045 → 1059**, distributeur 🚚 et assurance 🛡 en
  alternance ; une sous-session neuve par story (`REGLES-DES-GROUPES.md` §1.2). Même poste que B, même verrou Docker.
- **STORY-1045** ✅ — `vocabulaires/` et `contrats/distributeur/` dans la plateforme (PR prospera-plateforme#21, `dev`
  baa38dd ; étiquettes `vocabulaires-v1` et `contrats-distributeur-v1`). **Solde D-1042-3.** Aucun fichier de B
  touché : le `test` et le `typecheck` racines lisaient déjà ces dossiers (STORY-941).
- **Suivante : STORY-1046** 🛡 la compagnie de démonstration (EPIC-204, `prospera-assureur-fictif` et plateforme). Elle
  attend la **passation de `prospera-assureur-fictif` par C** : au 2026-11-17, elle **n'est pas écrite** (journal de C,
  « Passations : aucune » ; la demande de B y est « ouverte »). Le plan (§5) permet à D de la **constater** au rituel de
  1046 : `dev` d'`assureur-fictif` est alors à `78ad10c` (relevé du 2026-11-17, à relire au rituel). Si C y travaille
  encore, D prend 1047 (qui attend B-956 pour le README de `encours/`) ou 1050 (sans dépendance), et l'écrit ici.

### Lots 1 et 2

- **2026-11-14** : journal ouvert, lot 1 pas encore commencé.
- **2026-11-16** : lot 2 lancé par l'utilisateur (« prends le lot 2 du groupe D et tu fais toutes les stories de ce
  lot »). La session tourne sur un poste à part (`C:\Users\USER\…`), pas sur le poste principal de A et C.
  - **STORY-1030** ✅ — le squelette de `reseau-service` (PR reseau-service#1, `dev` 80a4a29 ; `main` dc44bbf).
  - **STORY-1031** ✅ — gate complète (KYC), read-models KYC et identité, cloisonnement par le jeton, outbox
    transactionnelle (PR reseau-service#2, `dev` 64537b1).
  - **STORY-1032** ✅ — zones et agences, codes jamais réattribués, fermeture refusée et nommée, montants entiers,
    droits du module (PR reseau-service#3, `dev` e96d5da).
  - **STORY-1033** ✅ — hiérarchie récursive, 3 → 4 niveaux par configuration, anti-cycle, déplacement sur compte
    rendu (PR reseau-service#4, `dev` 2ddbebd).
  - **STORY-1034** ✅ — affectations datées, responsable unique, commerciaux et état de leur compte (PR
    reseau-service#5, `dev` 3ff9958).
  - **STORY-1035** ✅ — modèle de portée, héritage, gouvernance, journal avant/après (PR reseau-service#6, `dev`
    b12a988).
  - **STORY-1036** ✅ — `reseau.portee.changed@1` publié (PR reseau-service#7, `dev` 17dcf14) : **jalon du 27/11 tenu
    le 16/11**.
  - **STORY-1037** ✅ — suite de conformité (étiquette `conformite-portee-reseau-v1`) et registre des consommateurs
    (PR reseau-service#8, `dev` 91b7f63).
  - **STORY-1038** ✅ — redécoupage versionné, période passée restituée avec sa version (PR reseau-service#9, `dev`
    a8a047a).
  - **STORY-1039** ✅ — rattachements et résolution (PR reseau-service#10, `dev` 9117794).
  - **STORY-1040** ✅ — couverture, zones blanches, candidats (PR reseau-service#11, `dev` 98ed21c).
  - **STORY-1041** ✅ — import tout ou rien, journal lisible, vérifications du manifeste (PR reseau-service#12, `dev`
    5922180). **`reseau-service` : les douze stories du lot sont livrées.**
  - **STORY-1042** ✅ — socle de `prospera-ventes-service` (PR #1, `dev` 80c2cfb) ; **reste** : `vocabulaires/` et
    `contrats/distributeur/` dans la plateforme (D-1042-3).
  - **STORY-1043** ✅ — terrain, recouvrement, pilotage, croissance (PR #1 de chacun).
  - **STORY-1044** ✅ — bibliothèque `series` (plateforme #14, étiquette `series-v1`), copiée et éprouvée dans ventes.
  - **Le lot 2 de D est fini : 15 stories sur 15** (1030 → 1044), le 2026-11-16.

## Dépôts tenus

- Distributeur (lot 2) : `prospera-ventes-service` (3412), `prospera-terrain-service` (3413),
  `prospera-recouvrement-service` (3414), `prospera-pilotage-service` (3415), `prospera-croissance-service` (3416).
- `prospera-plateforme` : `series/` (`series-v1`), `vocabulaires/` (`vocabulaires-v1`), `contrats/distributeur/`
  (`contrats-distributeur-v1`) ; **lot 3** : `encours/` (inscrit au README par B-956).
- Lot 3, à recevoir : `prospera-assureur-fictif` (de C, passation à écrire ou à constater au rituel de 1046),
  `prospera-notification-service` (de B, à la fusion de B-957).

- `reseau-service` (lot 2) : `main` et `dev` posées le 2026-11-16 ; port de développement **3419** ; piles Docker
  `grp-d`.
- À venir : `prospera-ventes-service`, `prospera-terrain-service`, `prospera-recouvrement-service`,
  `prospera-pilotage-service`, `prospera-croissance-service` (à créer par l'utilisateur) ; dans `prospera-plateforme` :
  `series/`, `vocabulaires/`, `contrats/distributeur/`.
- Lot 1 (frontend) : rien n'a été écrit ; `frontend-admin-panel` n'est tenu par personne pendant le lot 2.

## Passations

- **→ Dev A (2026-11-16, D-L2-5, avant le 04/12) : le distributeur.** Ce que D laisse :
  - `reseau-service` complet pour le lot (EPIC-044 → 053) : `dev` 5922180 ; contrat `reseau.portee.changed@1` publié
    et au registre ; suite de conformité `conformite-portee-reseau-v1` ; C-1004 est le premier consommateur attendu.
  - Les cinq services du distributeur en squelette (garde par module, profil, manifestes, piste d'audit chaînée,
    aucun import croisé) : ventes 3412, terrain 3413, recouvrement 3414, pilotage 3415, croissance 3416.
  - `prospera-plateforme/series/` (étiquette `series-v1`), copiée dans ventes (`src/socle/series/`).
  - `prospera-plateforme/vocabulaires/` (`vocabulaires-v1`) et `contrats/distributeur/` (`contrats-distributeur-v1`),
    STORY-1045, `dev` baa38dd : le vocabulaire par verticale et la garde du catalogue des faits d'AD-20. **Aucun
    service ne les copie encore** : chacun les copie à l'octet (empreintes dans `stories/STORY-1045.md`) avec sa
    première story qui affiche un libellé ou publie un fait, et rejoue `verifierFaitsDuModule` sur la clause C5 de
    chacun de ses manifestes. Les 13 faits « nouveaux » d'AD-20 manquent encore aux manifestes (PR d'AD-27).
  - ~~`vocabulaires/` et `contrats/distributeur/` dans la plateforme (D-1042-3)~~ : **soldé par STORY-1045**.
  - **Reste à faire** : le volet Reprise
    de l'import réseau (après B-947, D-1041-3) ; la republication de `reseau.commercial.changed@1` quand seul l'état
    du compte change (D-1034-5) ; les droits hors du jeton (B-949) à la place de la table rôle → droits (D-1032-2) ;
    la bascule de la garde sur l'état publié (D-1030-2).
  - Outils : banc HTTP d'intégration sur MongoDB réel (`test/integration/application-http.ts`), émetteur de jetons de
    recette (profil compose `recette`), Karapace (profil `registre`).

## Demandes aux autres groupes

- **→ C (2026-11-16) : consommer `reseau.portee.changed@1` et passer la suite de conformité pour STORY-1004** — ouverte.
  Le contrat est publié (reseau-service#7, `dev` 17dcf14) et la suite étiquetée (`conformite-portee-reseau-v1`,
  sha256 `f27799758591688e283c10e7bee04ea8ca7f3edb8c37dcd135f59e2b0851a15c`). Mode d'emploi :
  `tickets/TICKET-BACKEND-conformite-portee-reseau-sinistres.md`. Inscription au registre :
  `PUT /api/v1/instance/reseau/conformite/consommateurs/sinistres` (`PLATFORM_ADMIN`). D-1036 tient le jalon du 27/11
  en avance : C-1004 n'attend plus rien de D.

## Réponses aux demandes reçues

- **← B (2026-11-17) : le lot 3 de D** — `PLAN-4-SESSIONS-LOT-3-2026-11-17.md` §4 : **STORY-1045 → 1059**, distributeur
  et assurance en alternance. D reçoit `prospera-assureur-fictif` (de C) et `prospera-notification-service` (de B, à la
  fusion de B-957), et le dossier `encours/` de la plateforme. Ce que D attend de B : 956 (README, kit 1.0.1) pour
  1047 et 1055 ; 957 pour 1051 ; 960 pour 1053 ; 963 et 965 pour 1059. Passation à Dev A à mettre à jour **avant
  le 04/12**.

- ← A (2026-11-15) : les deux demandes adressées à D au lot 1 (point de départ AP-38 ; motif KYC perdu, reste de
  STORY-176) portent sur le frontend. Le lot 2 fait passer D au backend : elles **restent ouvertes** et reviendront
  avec le lot frontend. D n'y touche pas pendant le lot 2.

## Demandes à l'utilisateur (gestes réservés)

- **`reseau-service` : poser « Rebase and merge » seul.** Au 2026-11-16, la fusion par squash et par commit de fusion
  est encore permise. La session ne fusionne qu'en `gh pr merge --rebase`.
- ~~Créer les cinq dépôts du distributeur~~ : **faits** ; D y a posé `main` et `dev`. **Poser « Rebase and merge »
  seul** sur chacun (squash et commit de fusion encore permis), comme sur `reseau-service`.

## ⚠ Contrats

- **PUBLIÉ (2026-11-17, STORY-1045, prospera-plateforme#21, `dev` baa38dd) — deux contrats neufs** (rien d'existant ne
  change ; aucun fichier hors des dossiers de D).
  - **`catalogue-faits@1`** (`contrats/distributeur/`, étiquette `contrats-distributeur-v1`) : le catalogue des faits
    d'AD-20 (129 noms) et la garde `verifierFaitsDuModule`. **Pour B** : les 18 faits déjà codés de `paiement` y sont,
    sans `@1`, avec les trois faits de l'amendement du 2026-11-13 ; un fait **neuf** de `paiement` (Créance, B-963 et
    B-965 : `paiement.creance.changed@1`, `.credit-tiers.changed@1` y sont déjà) qu'un module du distributeur lit doit
    y entrer avant d'être consommé : le demander ici. **Pour C et la microfinance** : les faits que vos spines ou PRD
    ajoutent aux modules du noyau (`recouvrement`, `equipe`, `dashboard`…) y entrent de la même façon, avec leur source.
  - **`vocabulaire@1`** (`vocabulaires/`, étiquette `vocabulaires-v1`) : un tableau par verticale (`distributeur`,
    `imf`, `assurance`), clés neutres, `null` = sans objet. Les colonnes IMF et assurance sont celles du PRD
    distributeur (propositions) : **une correction se demande à D** (écart connu : le PRD microfinance §3 met
    « client » avant « membre »).

- **PUBLIÉ (2026-11-16, STORY-1036, reseau-service#7, `dev` 17dcf14) — `reseau.portee.changed@1`, contrat neuf** (rien d'existant ne change). Producteur
  unique : `reseau-service`. Consommateurs attendus : **C-1004** (sinistres), puis pdv, stock et le distributeur.
  - **Topic** `reseau.portee.changed` (le `@1` est la version du contrat, pas du nom) ; **clé** `<organisationId>:<userId>` ;
    schéma `reseau-service/contrat/schemas/reseau.portee.changed.json`, enregistré dans Karapace sur
    `reseau.portee.changed-value` en **BACKWARD** (modèle fermé : ajouts facultatifs seulement, sinon un `@2`).
  - **Corps** : `schemaVersion: 1`, `eventId`, `occurredAt`, `organisationId`, `userId`, `statut` (`ATTRIBUEE` |
    `RETIREE`), `lecture` et `ecriture` (`{ totale: true }` **ou** `{ totale: false, noeuds: [ObjectId…] }`), `version`
    (portée déclarée), `revision` (publication, croissante par clé), `versionDecoupage`.
  - **État absolu et RÉSOLU** : la liste des nœuds est déjà calculée (héritage, exclusions) ; le consommateur n'a pas
    l'arbre. Il se republie quand l'arbre change la résolution (nœud créé sous un nœud hérité, déplacement).
  - ⛔ **Fail-closed, à appliquer chez le consommateur** (AD-6) : aucun fait pour l'utilisateur, un fait `RETIREE`, ou
    `noeuds: []` ⇒ **zéro** enregistrement. Seul `totale: true` ouvre tout. Garder par clé le fait de plus haute
    `revision`. L'écriture est toujours contenue dans la lecture.
  - Client de Confluent : créer le topic avant de s'abonner et `metadataMaxAge: 10_000` (règles §1.9).
  - La suite de conformité (six cas) et le registre des consommateurs arrivent avec **STORY-1037**, avec un ticket à C.

## Questions à l'utilisateur ou au PO

- **Q-D-1 (2026-11-16, STORY-1031) — Le KYC dans la garde de `reseau` en mode « sur site ».** La spine (AD-10)
  exige le KYC Money Vibes de l'organisation ; une instance installée chez le client (EPIC-148) n'aura pas forcément
  de `kyc-service`. **Choix par défaut : KYC exigé partout** (D-1031-2), à revoir avec l'agent d'instance.
- **Q-D-2 (2026-11-16, STORY-1034) — Q3 du PRD réseau** : une personne peut-elle être affectée à des nœuds de branches
  différentes ? **Choix par défaut : oui** (avis du PRD, le superviseur itinérant ; D-1034-1).
- **Q-D-3 (2026-11-16, STORY-1035) — Qui est la racine de l'autorité sur les portées ?** Sans racine, personne ne peut
  attribuer la première portée (AD-8 : nul n'attribue plus que la sienne). **Choix par défaut : le `TENANT_ADMIN` de
  l'organisation**, qui détient par son rôle une portée totale pour la gouvernance, non publiée (D-1035-3). Les portées
  « totales » attribuées à quelqu'un d'autre lèvent l'alerte CM-2.

## Pièges rencontrés

- **Verrou Docker du poste** (`MoneyVibes_Apps\.verrou-docker`, une ligne : groupe, story, heure) : B l'a adopté sur ce
  poste ; D le prend avant toute pile ou image et le rend après `down -v`. Une attente de B (STORY-942) a duré ~30 min :
  D a avancé 1033 → 1035 sur des branches empilées pendant ce temps, puis a tout prouvé et fusionné d'une traite.

- Le poste de D est **partagé avec B** (piles `grp-b`) : toujours `docker compose -p grp-d …`, jamais un `down` sans
  `-p` ; ne jamais écrire dans les copies de travail de B (`_wt-b-stories`, `prospera-plateforme`).
- Un JSON écrit par heredoc perd ses antislashs (`"^.+\.(t|j)s$"` de `jest-int.json`) : outil d'écriture seulement.

- Poste de D : Node 25 en local. Le client Kafka de Confluent est natif : les tests se jouent dans le stage
  `verification` du `Dockerfile` (Node 24), `npm ci --ignore-scripts` suffit en local pour `tsc` et le lint.
- Plateforme sous Node 24 sans toucher au `node_modules` du poste :
  `git -c core.autocrlf=false archive HEAD | docker run --rm -i node:24-slim sh -c 'mkdir /w && cd /w && tar -x && npm ci && npm run typecheck && npm test'`
  (sous le verrou ; un test de B y est ignoré : la matrice du catalogue n'est pas dans le conteneur).
- AD-20 ne nomme que quelques exceptions (« les faits que les spines fixent font foi ») : avant de déclarer un nom
  « hors catalogue », chercher sa source (spines, PRD des verticales, `git grep` dans `prospera-paiement-service`).
  STORY-1045 : 25 noms des manifestes en avaient tous une.
