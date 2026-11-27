# STORY-562 : Suivre le parcours d'une déclaration déposée et rapporter l'accusé — le fait séparé que le port attendait déjà

Status: in-progress (2026-11-27 — lot 7 de D, n° 16 ; fiche réalignée et contrat annoncé avant le code)

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` (`:3012`) — adaptateur de canal, travaux récurrents
**Points :** 5 · **Sprint :** S29
**Origine :** **décision PO du 2026-08-28** — *« … déposer et **récupérer ou suivre le parcours**
pour la déclaration »*.
**Prérequis :** **STORY-561** (le connecteur) · **STORY-333** (capture de l'accusé — le chemin
manuel, qui reste)
**Réf. :** **AD-12** (le port est asynchrone : l'accusé arrive comme un fait séparé) · **AD-18**
(tout travail récurrent passe par BullMQ) · **STORY-334** (rejet administratif)

---

## Pourquoi cette story est petite

Parce que **le port l'attendait déjà**. AD-12 :

> Déposer rend un identifiant de dépôt ; l'accusé arrive comme un **fait séparé**, jamais comme
> valeur de retour. […] un connecteur automatisé produira simplement ce fait immédiatement.

⇒ STORY-333 a livré le chemin par lequel un accusé **saisi par un humain** devient ce fait. Cette
story ajoute une seconde source au **même** fait : un accusé **relevé par le connecteur**. Rien du
cycle de vie de la déclaration ne change.

⚡ **Et « immédiatement » est une simplification qu'il faut corriger.** Un portail administratif ne
rend pas toujours l'accusé dans la session de dépôt : il le publie plus tard, parfois le
lendemain, parfois après contrôle. **Le suivi est donc récurrent, pas synchrone** — d'où AD-18.

## Périmètre

**Inclus**

- Un **travail récurrent** (BullMQ, AD-18) qui, pour chaque dépôt engagé par connecteur et sans
  issue, consulte l'écran de suivi déclaré au paquet et en dérive un état.
- **Quatre issues, et pas davantage** : `ACCUSE_DISPONIBLE`, `REJET`, `EN_COURS`, `INDETERMINE`.
  ⛔ `INDETERMINE` est une issue de plein droit : elle dit que le produit n'a pas su lire l'écran,
  ce qui n'est ni un succès ni un rejet, et doit remonter au cabinet plutôt que d'être arrondi.
- L'accusé relevé alimente **le même chemin que STORY-333** — horodatage, rattachement, archivage
  (STORY-335) — et la qualification du retard reste celle de 333.
- Un rejet relevé alimente **STORY-334**, avec son motif tel que le portail le donne, **verbatim**.
  ⚠️ Ne jamais reformuler un motif administratif : c'est la pièce qu'on opposera.
- **Arrêt du suivi** : un dépôt qui n'aboutit pas au bout d'un délai déclaré au paquet cesse d'être
  interrogé, et le cabinet est averti. Un travail récurrent sans condition d'arrêt est une fuite.
- **Le suivi manuel reste ouvert en permanence.** À tout moment, le cabinet peut saisir l'accusé
  lui-même — y compris pendant qu'un suivi automatique tourne. La saisie humaine **gagne** et
  arrête le suivi.

**Hors périmètre**

- Le dépôt : **STORY-561**.
- Relancer un dépôt en échec. Une reprise est une décision, pas une conséquence.
- Notifier le client final. La chaîne de notification a son propre service ; ici on produit le
  fait, on ne choisit pas qui l'apprend.

## Critères d'acceptation

1. Un dépôt engagé par connecteur est suivi jusqu'à l'une des quatre issues, ou jusqu'à
   l'échéance d'arrêt déclarée.
2. Un accusé relevé produit **exactement le même fait** qu'un accusé saisi (STORY-333) — témoin :
   les deux chemins rendent le dossier dans le même état, indistinguable en aval.
3. La **source** de l'accusé est tracée — relevé ou saisi — sans changer sa valeur probante.
4. Un rejet relevé porte son motif **verbatim** et alimente STORY-334.
5. `INDETERMINE` remonte au cabinet ; le dépôt **ne bascule pas** en « accusé reçu » par défaut.
6. Une saisie manuelle pendant un suivi automatique **arrête le suivi** et fait foi.
7. Le suivi respecte le rythme déclaré au paquet ; aucune interrogation en boucle serrée.
8. **Non-régression** : sans connecteur, STORY-333 fonctionne à l'identique — aucun travail
   récurrent n'est créé pour un dépôt assisté.

## ✅ Ce que les cabinets veulent qu'on leur valide — salle du 2026-11-19 (V2, V5)

Ajouté depuis `salle-cabinets-validations-2026-11-19.md`. Ce sont les critères qu'un cabinet vérifie lui-même avant d'adopter la solution.

- Un accusé ou un rejet rapporté apparaît sur le dossier dès qu'il est enregistré ; un rejet porte sa cause en clair (la feuille, la cellule et la règle quand on les connaît).
- Le parcours se recette d'abord sur le dépôt réel de STORY-1102.

## Notes

- ⚡ **La valeur n'est pas le gain de clics, c'est la fin de l'oubli.** Aujourd'hui, un accusé
  arrive sur un portail et personne ne le sait tant qu'on n'y retourne pas. Un suivi qui rapporte
  l'issue transforme une vérification à faire en un fait qui arrive — et c'est ce qui fait qu'une
  échéance ne se découvre pas dépassée.
- ⚠️ **`INDETERMINE` sera l'issue la plus fréquente au démarrage**, et c'est normal : les écrans
  de suivi sont hétérogènes. En faire une issue nommée plutôt qu'un échec évite de conclure que le
  connecteur ne marche pas alors qu'il n'a simplement pas su lire.
- ⛔ **Ne jamais dériver un accusé d'une absence de rejet.** « Rien d'anormal à l'écran » n'est pas
  une preuve de dépôt, et c'est une preuve que le cabinet produira deux ans plus tard.

---

## Réalignement du 2026-11-27, avant le code (lu sur `origin/dev` du fiscal `997e29a`)

La fiche date du 2026-08-28. Depuis, 333 → 337 puis 560 et 561 ont été livrées. Relue contre le code :

### Ce qui existe déjà, et que 562 emploie tel quel

| Livré | Ce que 562 en prend |
|---|---|
| **561** — le parcours rangé (`parcours_connecteur`) : issue `DEPOSE`, `referencePortail` relevée à l'envoi, connecteur (code, version), `engagePar`, `termineLe` ; la clé `suivi` **réservée** dans le connecteur du bloc `automatisation` (un objet, inutilisé) ; le moteur de parcours (`jouerParcours` : marqueurs, dérive, retentatives bornées, autorisation relue) ; le pilote HTTP (`PiloteDePortail`) ; l'attente bornée de 318 | le suivi **lit le même bloc** et rejoue **le même moteur** sur l'écran de suivi ; il ne s'ouvre que derrière un `DEPOSE` |
| **560** — le coffre, l'acte `SUIVRE` du mandat (`ACTES_MANDAT`), vérifié à chaque usage ; `emettre` puis `utiliser` | l'acte `SUIVRE`, enfin employé ; une émission sans jeton d'utilisateur (D-562-6) |
| **333** — l'accusé (`AccusesDepotService.consigner`, `accuses_depot`, un par version, l'acte `DEPOT_DECLARATION_ACCUSE`, le retard qualifié, la pièce archivée dans le bucket privé) ; `PreuvesDAccuse`, que la garde `ACCUSE_REQUIS` de C lit | **le même noyau** écrit l'accusé relevé (D-562-1) |
| **334** — le rejet (`RejetsDepotService.consigner`, motif à l'octet, `rejets_depot`) ; `PreuvesDeRejet`, que le retour `REJET_REQUIS` de C (#86) lit | **le même noyau** écrit le rejet relevé |
| **335** — le fait `fiscal.depot.piece-archivee` (`ACCUSE_DEPOT`), écrit par le registre de l'accusé sous sa session, pour un accusé **avec pièce** | inchangé, à l'octet : un accusé relevé avec sa pièce porte ce fait, un accusé par référence seule n'en porte pas |
| **318** (C) — BullMQ sur Redis, la garde AST qui interdit `setInterval` et tient la liste fermée des `setTimeout` | le suivi est **un planificateur BullMQ** (AD-18) ; aucune minuterie neuve |
| **324 / 339** (C) — la porte du cycle : `DEPOSEE` (accord du client, scellement), `ACCUSE_RECU` (exige l'accusé) | **inchangée** : le suivi ne fait passer aucune déclaration d'un état à un autre |

### Ce que la fiche demande et qui se précise

- *« Le même chemin que STORY-333 »* : ce chemin exige une déclaration **« Déposée »** (D-333-2), et le passage à
  « Déposée » est la porte de C (accord du client, scellement), tenue sous le jeton d'un membre. 561 ne le fait pas,
  562 non plus : un accusé publié sur le portail **avant** que le cabinet ait passé la déclaration à « Déposée » se lit,
  se dit (`ACCUSE_DISPONIBLE`, en attente `DECLARATION_NON_DEPOSEE`), et se consigne à la première lecture qui suit le
  passage (D-562-4). C'est la règle de 333, pas une exception.
- *« L'écran de suivi déclaré au paquet »* : la clé `suivi` réservée par 561 reçoit son contrat (D-562-3). Le paquet
  est à C : **aucune instance au paquet Togo** (rien n'est relevé sur un portail réel) ; les preuves emploient un double
  du paquet et le portail simulé de 561, étendu.
- *« Le cabinet est averti »* : la chaîne de notification est hors périmètre. Le cabinet est averti **par le produit** :
  la lecture du suivi d'un dépôt et la liste des suivis à traiter (D-562-7). Aucun fait Kafka neuf (Q-D-37).
- *« Recette d'abord sur le dépôt réel de 1102 »* : c'est un geste de 1102 ; 562 se prouve contre le portail simulé.

### Décisions

- **D-562-1 — le même fait, par le même noyau.** `AccusesDepotService.consigner` se scinde : la portée (la route, le
  jeton du membre) puis un noyau `consignerPour(depot, obligation, demande, origine)` — la règle du guidage, « Déposée »,
  la référence, la nature, la date, le type de la pièce, accusé et rejet exclusifs, un seul par version, le retard,
  l'archive, **une** écriture et le fait de 335. `RejetsDepotService` de même. Le suivi appelle ce noyau, et rien
  d'autre n'écrit `accuses_depot` ni `rejets_depot`. Témoin (AC-2) : un accusé saisi et un accusé relevé, même dépôt,
  même date, même pièce, rendent le même enregistrement (hors `accuseId`, `consigneLe`, `source`), le même acte et le
  même fait.
- **D-562-2 — la source tracée, la valeur probante intacte (AC-3).** L'accusé et le rejet gagnent `source`
  (`SAISIE` | `RELEVE`, `SAISIE` pour les existants) et `releve { connecteur, version } | null`. Un relevé est consigné
  au nom de qui a engagé le dépôt automatisé (`consignePar` = `engagePar` : le connecteur agit sous son mandat). Le fait
  `fiscal.depot.piece-archivee` ne change pas (schéma de B, `additionalProperties: false`) ; l'acte
  `DEPOT_DECLARATION_ACCUSE` non plus. La date du dépôt d'un accusé relevé est le jour où le portail a accepté l'envoi
  (le `termineLe` du parcours `DEPOSE`) ; celle d'un rejet relevé, le jour de la lecture qui le voit.
- **D-562-3 — le contrat du bloc `suivi`** (clé réservée de 561, validée strictement, refus
  `AUTOMATISATION_INCOMPLETE` qui nomme le connecteur, l'étape et le champ) :

  ```jsonc
  "suivi": {
    "rythme": { "premiereLectureApresMin": 30, "intervalleMin": 240, "arretApresJours": 30 },
    "parcours": [                          // la grammaire du dépôt : S_AUTHENTIFIER, OUVRIR ; aucun SOUMETTRE
      { "code": "connexion", "geste": "S_AUTHENTIFIER", … },
      { "code": "etat", "geste": "OUVRIR", "methode": "GET", "chemin": "/suivi/{DEPOT|referencePortail}",
        "champs": [], "attend": { "contient": "État du dépôt" } }   // la dernière étape est l'écran lu
    ],
    "issues": {                            // lus sur l'écran de la dernière étape, dans cet ordre
      "rejet": { "contient": "…" }, "accuse": { "contient": "…" }, "enCours": { "contient": "…" }
    },
    "accuse": {                            // au moins l'un des deux
      "reference": { "entre": "…", "et": "…" },
      "piece": { "chemin": "/accuses/{DEPOT|referencePortail}.pdf" }
    },
    "rejet": { "motif": { "entre": "…", "et": "…" } }
  }
  ```

  Valeur neuve `DEPOT|referencePortail` (la référence relevée par 561 à l'envoi), dans un chemin ou un champ du suivi
  seulement. Bornes (AC-7) : première lecture 1 à 1 440 min après le dépôt, intervalle **15** à 1 440 min, arrêt 1 à
  90 jours ; le rythme, les tentatives et le délai par requête du connecteur valent aussi pour le suivi. Pièce : 15 Mo
  au plus (la borne de 333), son type lu dans ses octets (333).
- **D-562-4 — quatre issues par lecture, et ce qu'elles font.** Une lecture rend `ACCUSE_DISPONIBLE`, `REJET`,
  `EN_COURS` ou `INDETERMINE`, et rien d'autre :
  - `REJET` (le marqueur `rejet`, puis le motif extrait **à l'octet**, jamais retouché : un motif que la règle de 334
    refuse donne `INDETERMINE`, `MOTIF_ILLISIBLE`) → le rejet consigné par le noyau de 334 ;
  - `ACCUSE_DISPONIBLE` (le marqueur `accuse`, puis la référence et/ou la pièce) → l'accusé consigné par le noyau de
    333 ;
  - `EN_COURS` (le marqueur `enCours`) → la lecture suivante, à l'intervalle déclaré ;
  - `INDETERMINE` → tout le reste : aucun marqueur lu, plusieurs à la fois, une extraction impossible, une dérive, une
    session expirée, un portail indisponible, une pièce illisible. ⛔ Jamais un accusé par défaut (AC-5) : sans le
    marqueur `accuse` **et** sa preuve, il n'y a pas d'accusé. La lecture le dit (sa raison), le suivi le montre au
    cabinet, et il continue à son rythme jusqu'à l'arrêt.
  - Second facteur, contrôle anti-robot, ou le coffre qui refuse l'acte `SUIVRE` : le suivi **s'arrête** (`ARRETE`, la
    raison) — un suivi ne retente pas ce qui exige un humain.
  - `ACCUSE_DISPONIBLE` ou `REJET` sur une déclaration pas encore « Déposée » : la lecture le dit (attente
    `DECLARATION_NON_DEPOSEE`), le suivi continue ; le dépôt relayé ou la version qui a changé (la règle du guidage)
    l'arrête (`DEPOT_NON_SUIVABLE`).
- **D-562-5 — BullMQ, et l'état dans MongoDB (AD-18).** Une file `fiscal-suivi-depot`, un planificateur à identifiant
  fixe (`upsertJobScheduler`, toutes les 5 min, concurrence globale 1, patron de 318) ; chaque tour prend **au plus
  20** suivis `EN_COURS` dus (`prochaineLe` ≤ maintenant), chacun réservé atomiquement (un jeton de lecture de 5 min :
  deux répliques ne lisent pas le même). L'état vit dans `suivis_connecteur` (un par dépôt, index unique), donc ni un
  redémarrage ni une perte de Redis ne perd un suivi. Aucune minuterie : la garde de 318 reste à son compte.
- **D-562-6 — l'acte `SUIVRE`, sans jeton d'utilisateur.** Le travail récurrent n'a pas de requête. Le coffre gagne
  `emettrePourSuivre(orgId, { dossierId, canal, depotId })` : les mêmes vérifications que `emettre` (coffre configuré,
  mandat qui couvre `SUIVRE`, secret valable, dossier actif), sans la lecture du dossier par le jeton de l'appelant (le
  dépôt a été engagé sous cette portée), émetteur `suivi-depot`, jeton d'usage lié au dépôt et consommé une fois,
  journalisé comme les autres. ⛔ D-560-2 tient : seul `connecteur-depot` importe le coffre.
- **D-562-7 — l'arrêt, et le cabinet averti.** Au-delà de `arretApresJours` après le dépôt, le suivi s'arrête
  (`ARRETE`, `ECHEANCE_DU_SUIVI`) sans plus interroger. Le cabinet voit `GET /connecteurs-depot/depots/{depotId}/suivi`
  (l'état, la prochaine lecture, les 20 dernières lectures, la fin) et `GET /connecteurs-depot/suivis/a-traiter` (les
  suivis arrêtés, ceux dont la dernière lecture est `INDETERMINE`, ceux qui attendent « Déposée »). Chaque ouverture,
  lecture et fin est un acte au journal chaîné du dépôt (`CONNECTEUR_SUIVI_OUVERT`, `CONNECTEUR_SUIVI_LECTURE`,
  `CONNECTEUR_SUIVI_TERMINE`), sans valeur, sans corps, sans secret.
- **D-562-8 — la saisie humaine gagne (AC-6).** Avant toute lecture, un accusé ou un rejet déjà consigné pour la version
  termine le suivi (`SAISIE_MANUELLE`) **sans appel au portail**. Une saisie qui passe pendant une lecture gagne aussi :
  le noyau refuse le second (`ACCUSE_DEJA_CONSIGNE`, `REJET_DEJA_CONSIGNE`, index unique), et le suivi se termine
  `SAISIE_MANUELLE`. Le chemin manuel n'attend rien du suivi : il reste ouvert en permanence.
- **D-562-9 — sans connecteur, rien ne change (AC-8).** Un suivi ne s'ouvre qu'à la fin `DEPOSE` d'un parcours dont le
  connecteur déclare `suivi`. Aucun suivi pour un dépôt assisté, ni pour un repli, ni pour une reprise humaine. Un suivi
  qui ne s'ouvre pas (une panne) ne change pas l'issue du dépôt : l'accusé reste à saisir, comme aujourd'hui.
- **D-562-10 — le portail simulé, étendu** (preuves, porte §1.5) : un accusé publié plus tard (lectures `EN_COURS`,
  puis `ACCUSE_DISPONIBLE` avec sa pièce PDF), un rejet (motif rendu à l'octet), un portail qui a dérivé (`INDETERMINE`,
  `DERIVE`), un second facteur (`ARRETE`). Identifiants tirés au hasard, aucun portail réel, aucun secret réel.
- **D-562-11 — le bloc est à C.** **→ C** : la rubrique `suivi` du connecteur, de la forme ci-dessus, s'ajoute à la
  demande `automatisation` de 561 (placée par C au plus tard en 344, non fusionnée à l'ouverture de 562). D ne touche ni
  le paquet ni ses copies.
- **D-562-12 — deux petits commits à part** (demandes de B) : `@SkipThrottle()` sur `PiecesDepotServiceController` (la
  route de service tirée par la GED rend 429 au-delà de 100 appels par minute et par adresse pendant un rejeu ; la route
  est gardée par un jeton de service d'au moins 32 caractères comparé à temps constant), avec un test qui prouve
  l'absence de 429 au-delà de 100 appels et que les routes des membres restent limitées ; et « → B (h) » passée à
  « servie » au journal de D.

### Contrat de service (« ⚠ Contrats »)

- Ajouts seuls. `GET /api/v1/connecteurs-depot/depots/{depotId}/suivi` : `{ depotId, obligationId, numero,
  connecteur { code, version }, etat EN_COURS | TERMINE, fin ACCUSE_CONSIGNE | REJET_CONSIGNE | SAISIE_MANUELLE | ARRETE
  | null, raison, accuseId, rejetId, ouvertLe, prochaineLe, arretLe, lectures [{ le, issue, raison, attente }],
  termineLe }` ; 404 `SUIVI_INTROUVABLE`.
- `GET /api/v1/connecteurs-depot/suivis/a-traiter` : les suivis de l'organisation que le cabinet doit regarder (100 au
  plus, les plus récents d'abord), même forme.
- L'accusé (`GET /depots-declaration/{depotId}/accuse`, `GET /depots-declaration/accuses`) et le rejet
  (`GET /depots-declaration/{depotId}/rejet`, `GET /depots-declaration/rejets`) gagnent
  `source` (`SAISIE` | `RELEVE`) et `releve { connecteur, version } | null`. Rien d'autre ne change.
- Aucun fait Kafka neuf ; `fiscal.depot.piece-archivee` inchangé.

### Fichiers communs (« ⚠ Communs »)

Le contrat OpenAPI. Aucune migration (une collection neuve de D, `suivis_connecteur`, index posés par Mongoose au
démarrage ; deux champs à défaut sur `accuses_depot` et `rejets_depot`). Ni `app.module.ts` (la file se déclare dans
`ConnecteurDepotModule`, importé par `DepotsModule`), ni `package.json` (BullMQ est déjà là), ni `redis/files.ts` de C
(le nom de la file vit dans le module de D), ni `config/`, ni `read-models/`, ni copie du paquet, ni fichier de C. La
garde des minuteries de 318 n'a pas de ligne neuve.

### Question au PO

- **Q-D-37 — faut-il un fait pour qu'on apprenne qu'un suivi s'arrête ou ne sait pas lire ?** La notification est hors
  périmètre ; le cabinet le voit dans le produit (D-562-7). **Choix par défaut** : aucun fait neuf ; un fait
  `fiscal.depot.suivi-arrete` se publiera si la chaîne de notification le demande.
