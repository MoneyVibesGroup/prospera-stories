# Quatre sessions en parallèle : qui fait quoi, et comment se parler

> **Date :** 2026-11-14 · **Statut :** décidé par l'utilisateur (Dev B), en vigueur dès la fusion de ce document ·
> **Amendé le 2026-11-15** : FE-069 et le dépôt du cabinet passent à A (§2, §6)
> **Lot 2 (2026-11-16)** : les lots des §3 → §6 sont remplacés par `PLAN-4-SESSIONS-LOT-2-2026-11-16.md` (15 stories
> backend par groupe ; D passe au backend). Le rituel, les journaux et les règles communes restent ceux d'ici.
> **Lu par :** les quatre sessions. Le groupe A tourne sur le poste principal ; deux groupes tournent sur d'autres
> machines. **Ce dossier `coordination/` est le seul canal entre elles** : aucune session ne voit les branches locales,
> la mémoire ni les fichiers non suivis d'une autre.
> **Cadre :** `amendement-plan-fevrier-2026-11-14.md` (PR #449) : le cabinet d'abord, puis le distributeur et
> l'assurance, l'IMF en dernier ; chaque semaine, chaque projet avance.

---

## 0. Le rituel, avant chaque story (toutes les sessions)

1. `git fetch` de `prospera-stories`, puis lire sur `origin/main` :
   - **ce plan** (il peut avoir été amendé) ;
   - **les trois autres journaux** (`coordination/journal-groupe-*.md`), section « Demandes aux autres groupes » : ce qui
     vous est adressé passe avant votre story suivante ;
   - le tableau des dépôts (§2) : **ne touchez jamais un dépôt que vous ne tenez pas**.
2. Lire **l'entrée de la story dans `sprint-status.yaml`** puis sa fiche : l'entrée du tracker porte des arbitrages du PO
   que la fiche n'a pas toujours reçus. Si elles divergent, demander à l'utilisateur **avant** de coder.
3. Pas de fiche ? L'écrire (skill `bmad-create-story`) **juste avant de coder**, avec l'identifiant prévu ici ou le suivant
   libre **dans votre plage** (§1).
4. Coder, prouver (§8), pousser, ouvrir la PR, la fusionner, mettre votre journal à jour, puis seulement ouvrir la story
   suivante.

---

## 1. Les quatre groupes

| Groupe | Lot | Machine | Identifiants que lui seul peut créer |
|:--:|---|---|---|
| **A** | Relecture de quatre stories, transformation des restes du 14/11 en stories, puis **6 stories** (fiscalité et plateforme), relecture du contrat d'état publié de B avant qu'il soit figé, et pour finir **la relecture de tout ce qu'ont fait les quatre groupes** (§3.4) | poste principal | **STORY-902 → STORY-929** |
| **B** | **Le moteur d'installation** : 10 stories (socle, contrat d'état publié, manifestes, garde partagée) | au choix | **STORY-930 → STORY-979** |
| **C** | **L'assurance** : 10 stories (socle, échange avec la compagnie, compagnie fictive, machine à états) | au choix | **STORY-980 → STORY-1029** |
| **D** | **Le frontend** : 12 stories (app expert-comptable et console), pour éprouver les intégrations | au choix | **FE-112 → FE-139**, **AP-38 → AP-49** |

STORY-1030 → STORY-1199 restent en réserve (plage de Dev B) : personne n'y puise sans amender ce plan. Les plages sont
inscrites dans `reserved_ranges` du tracker.

---

## 2. Qui tient quel dépôt

**Règle : un dépôt n'a qu'un groupe à la fois.** Un dépôt change de groupe par une **passation** écrite dans le journal
du groupe qui le cède (« `prospera-auth-service` cédé à B, dernier commit `<sha>` sur `dev` »). Le groupe qui le reçoit
ne commence qu'après avoir lu cette ligne.

| Dépôt (GitHub `MoneyVibesGroup/…`) | Tenu par | Passation prévue |
|---|---|---|
| `prospera-fiscal-service`, `prospera-balance-service`, `prospera-bilan-service`, `prospera-dossier-service` | A | — |
| `prospera-kyc-service`, `prospera-admin-panel-service` (BFF de la console) | A | — |
| `prospera-recette` (piles et recettes croisées) | A | les autres groupes **lancent** la pile, mais ne la modifient pas : une demande à A |
| `prospera-auth-service` | A | **→ B** après la fusion de STORY-902 |
| `prospera-notification-service` | **B** | **cédé par A le 14/11** (STORY-569 livrée ; dernier commit sur `dev` : `8916ee4`) |
| `prospera-platform-catalog-service`, `prospera-paiement-service` | B | — |
| `prospera-plateforme` (**neuf**, créé par B, STORY-931) | B, **par dossiers** | C écrit dans `contrats/assurance/`, `champs-sensibles/`, `classification-sante/` ; B dans tout le reste. Aucun fichier commun. |
| `prospera-assurance-service`, `prospera-ocr-service` (= `document-service`) | C | — |
| `prospera-sinistres-service`, `prospera-liaison-assureur-service`, `prospera-assureur-fictif` (**neufs**, créés par C) | C | — |
| `prospera-frontend-expert-comptable` | **A jusqu'à la fusion de FE-069**, puis D | **amendement du 2026-11-15** (décision de l'utilisateur) : FE-069 revient à A, qui l'avait entamée ; A rend le dépôt à D par une ligne de son journal |
| `frontend-admin-panel` (console) | D | — |
| `prospera-stories` | **tous** | chacun n'écrit que **ses** fiches, **son** journal et **les entrées de ses stories** au tracker |
| `prospera-microfinance-service`, `prospera-expert-comptable` | personne | — |

---

## 3. Groupe A : relecture, restes, puis six stories

### 3.1 D'abord, la relecture (sans identifiant)

Quatre stories fusionnées le 14/11 sans relecture humaine. Pour chacune : lire la PR, le code et les tests, puis écrire
le verdict dans `coordination/relecture-groupe-A-2026-11-14.md` (constat, gravité, correctif). Un défaut se corrige par
une story de la plage de A, ou dans la story déjà prévue s'il la touche.

| Story | PR | Ce qu'il faut vérifier en priorité |
|---|---|---|
| **STORY-299** journal d'audit chaîné | fiscal #22 | l'empreinte porte une sérialisation **stable** (ordre des clés) ; l'index unique `(perimetre, seq)` empêche toute fourche ; l'audit et l'outbox sont **dans la même transaction** que l'écriture tracée (un échec ne laisse rien) ; la transaction exige un jeu de répliques MongoDB : que se passe-t-il sans ? |
| **STORY-300** droits fiscaux | fiscal #24 | le **mode de compatibilité par rôle** (TENANT_ADMIN = tout, TENANT_USER = préparer) : peut-il rester actif sans que personne ne le voie ? le refus est-il journalisé dans tous les cas ? les cinq natures d'accès restent-elles indépendantes ? |
| **STORY-365** borne du jeton | auth #36 | la borne (44 droits, 3 584 octets, codes de 40 caractères) **tient-elle face aux verticales** : 14 rôles de l'assurance, droits à tiret du moteur, modules du distributeur ? que voit un utilisateur dont le rôle la dépasse, à la connexion **et** au rafraîchissement ? |
| **STORY-563** deux redevables | fiscal #29 et #34 | la migration `migrate:cle-obligation-redevable` n'est **jouée nulle part** : la jouer sur la pile de recette et l'inscrire au guide de mise en service ; l'idempotence de la dérivation (305) avec la nouvelle clé ; `redevableId` nul = entreprise, sans reprise de données |

### 3.2 Ensuite, les restes du 14/11 deviennent des stories ou des décisions

| Reste | Ce qu'il devient |
|---|---|
| Mode de compatibilité des droits fiscaux (300) | **question au PO** (journal de A) et **STORY-902** |
| Migration de 563 non jouée | correctif de la relecture (§3.1) |
| Motif par pièce perdu sans bruit dans la console (176) | **ticket pour D** (`tickets/TICKET-FRONTEND-motif-par-piece-revue-kyc.md`) ⇒ D en fait **AP-38** |
| 503 intermittent de la vérification KYC quand le catalogue est injoignable (175) | **STORY-903** |
| Paquet fiscal Togo modifié quatre fois le 14/11, à republier au catalogue | **procédure** écrite dans le journal de A (geste d'administration à la mise en service), pas une story |
| STORY-901 en partie bloquée (loi de la zone franche scannée sans texte) | elle reste dans le lot ; la partie bloquée attend le texte et le dit dans la fiche |

### 3.3 Puis six stories, dans cet ordre

| # | Story | Dépôts | Note |
|:--:|---|---|---|
| 1 | **STORY-901** paquet Togo conforme au CGI (arrondis, minimum du MFP, zone franche) | balance, dossier, fiscal | **déjà commencée** : branches `MNV-901` avec des modifications non commitées dans `prospera-fiscal-service` et `prospera-balance-service` du poste principal |
| 2 | **STORY-345** base de rémunération par bénéficiaire et par période (salarié, dirigeant, associé) | fiscal | remplace STORY-569, **livrée le 14/11** (fiscal #39, notification #86) ; débloque le critère AC-7 de STORY-568 et STORY-348 |
| 3 | **STORY-902** droits `fiscalite:*` attribuables et rôles du cabinet ; fin du mode de compatibilité | auth, fiscal | après la réponse du PO (§10, action 3) ; libère `prospera-auth-service` pour B |
| 4 | **STORY-903** la vérification KYC du BFF tient quand le catalogue est injoignable | BFF, kyc | |
| 5 | **STORY-313** aiguillage, y compris sur l'état d'un tiers | fiscal | fiche à écrire |
| 6 | **STORY-314** familles hors périmètre : déclarables, non calculables | fiscal | fiche à écrire |

**Passation de la notification :** STORY-569 étant livrée, `prospera-notification-service` est **cédé à B dès
l'ouverture du lot** (dernier commit sur `dev` : `8916ee4`), écrit dans le journal de A.

**Pendant le lot, à la demande de B :** relire le contrat d'état publié (STORY-932, puis la matrice et la route de
STORY-936) **avant qu'il soit figé** ; tous les groupes le lisent ensuite. Verdict dans le journal de A, sous 24 heures.

### 3.4 Pour finir : la relecture de tout le lot, des quatre groupes

Quand le journal de A dit son lot terminé, A relit **tout ce qui a été fusionné depuis le 14/11 au soir par A, B, C et
D**, pour s'assurer qu'il n'y a pas de trou. Il ne corrige rien dans un dépôt qu'il ne tient pas : chaque trou devient un
**ticket** adressé au groupe qui tient le dépôt (§2), ou une story de la plage de A s'il est dans un de ses dépôts.

| Ce que A vérifie | Comment |
|---|---|
| Chaque story fusionnée remplit **tous** ses critères d'acceptation | fiche ↔ PR de code ↔ tests ; un critère sans test qui le prouve est un trou |
| Le tracker dit vrai | statut au tracker ↔ PR fusionnée sur GitHub ; points de sprint refaits |
| Chaque PR de code a sa PR de docs, et inversement | `gh pr list --state merged` des dépôts ↔ `prospera-stories` |
| Les contrats annoncés sont ceux qui ont été livrés | journal de B, section « ⚠ Contrats » ↔ code ; la matrice des neuf états rejouée |
| Rien n'est resté en route | demandes ouvertes des journaux, tickets sans réponse, questions au PO sans réponse, migrations non jouées, passations non écrites |
| Les piles démarrent | `docker compose up` de chaque service touché, sur des images reconstruites depuis `dev` ; la recette croisée de l'Atelier (STORY-100) toujours verte |
| Les intégrations découvertes par D sont traitées | chaque ticket de D a une story ou une réponse |

**Livrable :** `coordination/relecture-finale-groupe-A.md`, un tableau par groupe (vu, trou, ticket ou story ouvert),
annoncé dans le journal de A.

**Fin du lot A :** Docker éteint ; les deux passations (auth, notification) écrites ; relecture finale livrée.

---

## 4. Groupe B : le moteur, dix stories

Source : `epics-moteur-installation-2026-11-11.md` et sa spine. **Jalon : le contrat d'état publié est figé et étiqueté
au plus tard le 11/12** ; tout le reste du programme le lit.

| # | Story | Épic | Dépôts | Ce qui doit être vrai à la fin |
|:--:|---|---|---|---|
| 1 | **STORY-930** le catalogue sur le socle | 155 | catalogue | `kafkajs` remplacé par `@confluentinc/kafka-javascript` 1.11 (interface de `KafkaProducerService` inchangée) ; Node 24 ; Karapace 6.2 et le client `@confluentinc/schemaregistry` dans la pile de développement ; le schéma de `entitlement.changed` enregistré, compatibilité BACKWARD vérifiée en CI ; `docker compose up` vert |
| 2 | **STORY-931** le dépôt `prospera-plateforme` | 142 | `prospera-plateforme` (neuf) | dépôt créé (privé) ; un README qui dit **qui écrit dans quel dossier** (§2) ; contrats agent, centrale et partie A en JSON Schema, vecteurs signés par une racine de test ; paquet `point-de-decision` amorcé |
| 3 | **STORY-932** le contrat d'état publié | 142 | catalogue | `contrat/etat-publie.openapi.json` et `contrat/matrice-etats.json`, versionnés ; **ajouts seulement** une fois figés ; annoncé dans le journal de B ; **relu par A avant d'être figé** (demande dans le journal de B) |
| 4 | **STORY-933** Redis, BullMQ et le verrou d'outbox du catalogue | 142 | catalogue | BullMQ **émet** à l'heure dite, il ne calcule jamais un état |
| 5 | **STORY-934** le manifeste dans `ModuleVersion` | 143 | catalogue | champs du manifeste (dont `depends`, `objetsDeReprise`, `domainesEchange`) ; refus nommés `MODULE_DEPENDANCE_MANQUANTE`, `MODULE_REQUIS_PAR`, `MANIFESTE_CYCLE`, `MANIFESTE_DEPENDANCE_MINEURE` ; garde source/copie |
| 6 | **STORY-935** enregistrer les manifestes du cabinet et des démos | 143 | catalogue | depuis `prospera-stories/manifestes/` ; publication de `catalogue.manifeste.publie` |
| 7 | **STORY-936** la matrice des neuf états et la vraie route | 145 | catalogue | cas exécutables ; l'état se calcule à la lecture depuis `HorlogeDeReference` (aucun `Date.now()` pour décider) ; `GET /api/instance/v1/etat-publie/{organisationId}` servie |
| 8 | **STORY-937** la garde partagée, et paiement en double lecture | 145, 155 | `prospera-plateforme`, paiement | garde publiée ; `paiement` la joue **en double lecture** avec l'ancienne, sur le nouveau socle (Confluent, Node 24) ; test de mutation : falsifier `echeanceLe` ne change aucune décision |
| 9 | **STORY-938** `auth-service` pour le moteur | 142, 264 | auth | **après la passation par A** ; droits à tiret ; route interne de naissance d'organisation, idempotente, réservée à l'identité de service du moteur ; droit de consentir réservé au DG |
| 10 | **STORY-939** le read-model de manifestes de `paiement` | 143 | paiement | résout les dépendances comme la console ; les écrans de la console font l'objet d'un **ticket pour D** |

**Hors de ce lot (lot suivant) :** l'installation et le retrait des quatre chemins d'octroi (EPIC-144), car ils touchent
la console (D), la recette (A) et le cabinet ; `notification` sur le nouveau socle, après la passation.

**Engagement de B envers tous :** aucun contrat existant ne change sans annonce (`entitlement.changed`, revendications du
jeton, routes du catalogue). Un renommage passe par un topic `@2` (AD-27). Une annonce s'écrit dans le journal de B,
section « ⚠ Contrats », **avant** la fusion.

---

## 5. Groupe C : l'assurance, dix stories

Source : `epics-assurance-2026-11-13.md` et sa spine. **Backend seulement dans ce lot** : la coque `prospera-app`
n'existe pas encore ; les écrans de l'assurance viennent avec elle. Chaque story se prouve par ses tests et par
`docker compose up`.

| # | Story | Épic | Dépôts | Ce qui doit être vrai à la fin |
|:--:|---|---|---|---|
| 1 | **STORY-980** le squelette de `prospera-sinistres-service` | 201 | sinistres (neuf) | modules `sinistres` et `expertises` ; pile du moteur dès le premier commit (Node 24, Confluent, MongoDB 8) ; gate `assurance` ; profil de démarrage ; garde de câblage |
| 2 | **STORY-981** `prospera-assurance-service` sur le socle | 201 | assurance | Node 20 → 24, `kafkajs` → Confluent ; interrupteur `compta-cima` : éteint, les routes comptables sont refusées ; suites existantes vertes |
| 3 | **STORY-982** `document-service` sur le socle | 201 | ocr | Node 22 → 24, Confluent, BullMQ 6 ; **le cabinet s'en sert** : rejouer ses tests OCR et l'e2e du cabinet avant de fusionner |
| 4 | **STORY-983** champs sensibles et classification de santé | 201 | `prospera-plateforme` (dossiers de C) | chiffrement par champ, index aveugle ; registre `classification-sante` ; un champ de santé ajouté à un schéma d'événement fait échouer la CI. **Attend STORY-931** ; sinon, passe après la 987 |
| 5 | **STORY-984** l'échange avec la compagnie, par fichier | 203 | liaison-assureur (neuf), `prospera-plateforme/contrats/assurance` | schémas de l'annexe C ; transport Excel et JSON ; un fait rejoué ne crée aucun doublon |
| 6 | **STORY-985** l'échange par API, le journal et la file des écarts | 203 | liaison-assureur | file d'envoi acquittée ; rejet motivé dans la file des écarts ; numéro `DEC-` d'abord, numéro de la compagnie ensuite |
| 7 | **STORY-986** la compagnie fictive | 204 | assureur-fictif (neuf) | parle l'annexe C par les deux transports ; sait tomber en panne, refuser, doubler, changer une police |
| 8 | **STORY-987** le jeu de la compagnie de démonstration | 204 | `prospera-plateforme` (générateur), assureur-fictif | graine fixe ; 14 gestionnaires, environ 3 500 dossiers, les quatre scénarios `SIN-2026-9001` → `9004` |
| 9 | **STORY-988** la machine à états du dossier | 205 | sinistres | les 42 transitions comme **donnée versionnée** à un seul écrivain ; conditions nommées évaluées au serveur ; trace de chaque transition ; aucun état non terminal sans issue |
| 10 | **STORY-989** versions et échéances du dossier | 205 | sinistres | deux agents sur un dossier : le second est refusé (« modifié par X à hh:mm ») ; une restauration ne rejoue aucune échéance |

**À savoir :** EPIC-205 dépend des rôles d'EPIC-202, qui attendent les droits à tiret d'`auth-service` (STORY-938, B).
C déclare les droits de ses modules dans leurs manifestes et les vérifie par la garde ; EPIC-202 vient au lot suivant.

---

## 6. Groupe D : le frontend, douze stories

But : faire avancer les écrans **et** éprouver les intégrations. **D ne corrige jamais un backend** : une incohérence
découverte devient un **ticket** (`tickets/TICKET-<BACKEND|OPS>-<sujet>.md`) adressé au groupe qui tient le dépôt (§2),
plus une ligne « → A/B/C » dans le journal de D.

**Étape 0, avant la première story :** remettre `frontend-sprint-status.yaml` à jour. Il date du 25/08 : 61 stories y sont
« en revue » ; celles qui sont dans `dev` passent à `done` (vérifier par `git log origin/dev`).

| # | Story | App | Note |
|:--:|---|---|---|
| 1 | **FE-069** Integration Gate du parcours cabinet (créer un dossier, le tenir, l'archiver) | expert-comptable | sur la pile de `prospera-recette` (lancée, pas modifiée) ; la recette backend STORY-100 est verte depuis le 14/11. ⚠️ Une session du 14/11 l'avait prévue après STORY-569 : si une branche `FE-069` ou une PR existe déjà, D la reprend où elle en est au lieu de repartir de zéro |
| 2 | **FE-085** l'accueil cesse de promettre ce qu'aucun code n'ouvre | expert-comptable | |
| 3 | **FE-073** l'Atelier nomme ce qui n'y est pas encore | expert-comptable | |
| 4 | **FE-074** export CSV et impression de la balance et du cahier du mois | expert-comptable | |
| 5 | **FE-088** les cinq étapes du Bilan portent leur état | expert-comptable | |
| 6 | **FE-090** un dossier IMF ou Assurance ne promet que ce qui est servi | expert-comptable | |
| 7 | **FE-078** articulation comptable ↔ fiscal | expert-comptable | |
| 8 | **FE-095** une déclaration rejetée | expert-comptable | |
| 9 | **FE-102** un barème non validé le dit | expert-comptable | bloquée en août ; STORY-298 (statut de validation par élément) l'a peut-être débloquée : **vérifier avant** |
| 10 | **FE-094** le calendrier de dépôt | expert-comptable | bloquée en août ; STORY-305 et le module d'échéances l'ont peut-être débloquée : **vérifier avant** |
| 11 | **FE-112** (neuve) les obligations fiscales du dossier : liste dérivée, activer ou écarter, taxes sectorielles | expert-comptable | backend : STORY-305, 306, 307 (fusionnées le 14/11) ; **maquette d'abord** |
| 12 | **AP-38** (neuve) la console garde le motif par pièce de la revue KYC | console | suite de STORY-176 ; ticket écrit par A |

**Remplaçantes** si une story est bloquée : FE-036, FE-037, FE-038 (prévisionnel, `ready-for-dev`).

**⚡ Amendement du 2026-11-15 (décision de l'utilisateur).**

- **FE-069 (n° 1) passe au groupe A**, qui la reprend cette semaine : D n'avait pas démarré. Son périmètre a été
  revérifié et étendu (A1 → A13, B1 → B25, 13 points).
- **Le bloc C de FE-069 et les écrans fiscaux sont triés** dans `tri-frontend-fevrier-2026-11-15.md` : 14 fiches
  neuves écrites par A (**FE-112 → FE-125** ; FE-112 reste « les obligations fiscales »), 23 fiches d'août réancrées.
  La plage libre de D devient **FE-126 → FE-139**.
- **D commence donc par AP-38** (console), puis par les **maquettes** des stories de février dans l'ordre du §4.1 du
  tri, et reprend le dépôt du cabinet à la fusion de FE-069. Son étape 0 (remettre le tracker frontend à jour) est
  allégée : les statuts des stories triées ont été remis à jour le 15/11 ; restent les 61 stories « en revue ».
- **FE-074** : son option « sans objet backend » est périmée, la balance s'exporte côté serveur (STORY-555).
- **FE-094, FE-102** : débloquées (STORY-539, 298 et 493 livrées).

**Règle des maquettes (inchangée) :** aucun écran neuf n'est codé avant que sa maquette, ajoutée à
`prototypes/prospera-prototype.html`, soit validée par l'utilisateur. Les chiffres d'une maquette viennent du référentiel.

---

## 7. Ce que les groupes attendent les uns des autres

| De | Vers | Quoi | Quand |
|---|---|---|---|
| A | B | passation de `prospera-auth-service` | à la fusion de STORY-902 ; avant STORY-938 |
| A | B | passation de `prospera-notification-service` | **dès l'ouverture du lot A** (STORY-569 livrée le 14/11) |
| B | A | relecture du contrat d'état publié avant figeage | STORY-932, puis STORY-936 ; réponse de A sous 24 heures |
| A, B, C, D | A | relecture finale de tout le lot | quand le journal de A dit son lot terminé (§3.4) |
| A | D | ticket du motif par pièce (⇒ AP-38) | pendant les restes (§3.2) |
| B | C | `prospera-plateforme` créé, README des dossiers | STORY-931 ; avant STORY-983 et 987 |
| B | tous | contrat d'état publié figé, toute modification de contrat annoncée | STORY-932, puis au fil de l'eau |
| B | D | ticket des écrans de la console pour les manifestes | STORY-939 |
| C | A, D | `document-service` migré sans casser l'OCR du cabinet | STORY-982 |
| D | A, B, C | tickets d'incohérences d'intégration | au fil de l'eau ; chaque groupe les traite avant sa story suivante |
| tous | A | modification de la pile de `prospera-recette` | par une demande dans le journal |

---

## 8. Les règles communes, identiques sur toutes les machines

**Git et PR**
- Une story = une branche `MNV-<numéro>` (ou `FE-<numéro>`, `AP-<numéro>`) partie d'`origin/dev`. Dans `prospera-stories` :
  branche `docs-<numéro>` partie d'`origin/main`, **dans un worktree** (`git worktree add`), jamais dans un checkout
  partagé.
- Pousser, `gh pr create --base dev` (`--base main` pour `prospera-stories`), vérifier que le `head` de la PR est le SHA
  poussé, puis **fusionner soi-même en « Rebase and merge »** (`gh pr merge --rebase`), vérifier la fusion, et repartir
  d'`origin/dev` à jour pour la story suivante. Jamais de commit de fusion ni de squash.
- Jamais `git add -A` : on ajoute ses fichiers un par un. Un générateur de « barrels » de l'éditeur peut créer des
  `index.ts` non suivis : les retirer avant d'ajouter.
- `gh` doit être authentifié avec un jeton qui a le droit `repo`. Sur le poste principal, un lanceur Git Bash
  (`~/bin/gh`) le fait.

**Le tracker (`sprint-status.yaml`)**
- On n'y modifie **que les entrées de ses propres stories** (et `story_id_high_water_mark` au commit qui crée une fiche).
- Juste avant de fusionner la PR de docs : rebase sur `origin/main`. Après **tout** rebase qui touche le tracker, même
  sans conflit : `python -c "import yaml,io; yaml.safe_load(io.open('sprint-status.yaml',encoding='utf-8'))"` et, si
  des points de sprint ont bougé, **refaire la somme** sur le fichier résolu (ne reprendre aucune des deux valeurs).

**Fins de ligne (Windows)**
- Avec `core.autocrlf=true`, les fichiers hachés (paquets de référentiels JSON, assets) sortent en CRLF et leur empreinte
  ne correspond plus : extraire ces fichiers avec `git -c core.autocrlf=false checkout -- <chemin>`.
- Avant chaque commit, comparer `git diff --stat` et `git diff --stat --ignore-cr-at-eol` : s'ils diffèrent, les fins de
  ligne ont bougé et le diff est faux.

**Preuves**
- Tests, lint et build verts **et**, dès qu'un module Nest ou une dépendance change, **`docker compose up` du service** :
  un câblage faux (`UnknownDependenciesException`) ne se voit qu'au démarrage.
- Une recette se joue sur des images **reconstruites** depuis `dev` (`--build`) : une image périmée redémarre en silence.

**Docker**
- À la demande seulement, et éteint à la fin du lot. Chaque groupe préfixe ses piles : `COMPOSE_PROJECT_NAME=grp-a`,
  `grp-b`, `grp-c`, `grp-d` (volumes et réseaux séparés si deux groupes partagent une machine). Vérifier les ports libres
  avant de lancer.

**Contrats**
- On ne renomme jamais un champ ou un topic existant : on ajoute, ou on publie un `@2` (AD-27).
- Le neuf écrit `organisationId` ; l'existant garde sa graphie.

**Paquet fiscal Togo**
- Toute modification part de `balance-service/scripts/referentiels/sources/`, puis
  `node scripts/referentiels/build.mjs`, puis réépinglage et **copie à l'octet** dans `prospera-dossier-service` et dans
  `prospera-fiscal-service/test/fixtures/paquet-fiscal/`. Seul A le fait dans ce lot.

---

## 9. Les journaux

Chaque groupe tient **un seul fichier** : `coordination/journal-groupe-<X>.md`, et n'écrit dans aucun autre. Il le met à
jour **dans la PR de docs de chaque story** (donc fusionné avec elle), et au minimum :
- **État** : story en cours, dernières fusions (numéros de PR) ;
- **Dépôts tenus** et **passations** faites ou reçues ;
- **Demandes aux autres groupes** : `→ B (2026-11-15) : … — ouverte` ; le destinataire répond **dans son propre journal**
  (`← A (2026-11-15) : servie par PR #…`) et le demandeur passe sa ligne à « servie » ;
- **⚠ Contrats** : tout changement de contrat visible des autres, annoncé avant la fusion ;
- **Questions à l'utilisateur ou au PO**, en attente ;
- **Pièges rencontrés**, utiles aux autres.

---

## 10. Trois actions à mener avant ou pendant le lancement

| # | Action | Qui | Quand | Si elle n'est pas faite |
|:--:|---|---|---|---|
| 1 | **Créer quatre dépôts GitHub privés** dans `MoneyVibesGroup` : `prospera-plateforme` (B), `prospera-sinistres-service`, `prospera-liaison-assureur-service`, `prospera-assureur-fictif` (C). Commande : `gh repo create MoneyVibesGroup/<nom> --private`, puis une branche `main` (premier commit : README) et une branche `dev` partie de `main` ; réglages « Rebase and merge » seul. **La session demande la confirmation de l'utilisateur juste avant de créer.** | B pour `prospera-plateforme` ; C pour ses trois | B : en ouvrant STORY-931 ; C : en ouvrant STORY-980, 984 et 986 | la story qui en a besoin ne démarre pas ; la session passe à la suivante et le note dans son journal |
| 2 | **Répartir les machines.** A et C sont les plus lourds en Docker (recettes ; trois services et MongoDB) : jamais sur la même machine. Chaque session écrit, à l'ouverture de son lot, **sur quelle machine elle tourne** dans la section « État » de son journal. | l'utilisateur ; chaque session l'inscrit | avant de lancer B et C | deux piles lourdes sur une machine : ports et mémoire saturés, recettes lentes ou fausses |
| 3 | **Le mode de compatibilité des droits fiscaux** (STORY-300 : TENANT_ADMIN = tout, TENANT_USER = préparer) : reste-t-il, et jusqu'à quand ? | A pose la question au PO, dans son journal et à l'utilisateur | à l'ouverture du lot A | STORY-902 passe après STORY-313 et 314, en attendant la réponse |

Personne ne modifie ce plan pour y inscrire sa machine : elle s'écrit dans le journal du groupe. Le plan ne change que
par une PR demandée par l'utilisateur.
