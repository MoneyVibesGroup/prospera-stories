# STORY-561 : Le connecteur de dépôt automatisé — un adaptateur de plus derrière le port AD-12, déclaré par pays, et qui retombe sur l'assisté quand il n'est pas déclaré

Status: done (2026-11-27 — prospera-fiscal-service#92, `dev` `997e29a` ; lot 7 de D, n° 15) — fiche réalignée et
contrat annoncé avant le code (prospera-stories#1033, `main` b8a30d5).

**Épic :** EPIC-032 — Dépôt assisté, accusé et dossier de contrôle
**Service :** `fiscal-service` (`:3012`) — adaptateur de canal
**Points :** 13 · **Sprint :** S29
**Origine :** **décision PO du 2026-08-28** — *« on va le faire avec un système d'automatisation…
le but est, pour chaque pays, si on remplit les liens sur lesquels on va déposer et récupérer ou
suivre le parcours pour la déclaration, on doit pouvoir le faire avec une automatisation ; mais si
elle n'est pas enregistrée, alors on garde la structure actuelle. »*
**Prérequis :** **STORY-560** (coffre-fort + mandat) · **STORY-330** (port de canal) ·
**STORY-331** (canal décrit comme donnée) · **STORY-537** (gabarit du livrable)
**Réf. :** **AD-12** · PRD fiscalité §3.2 *(la réserve qui est ici levée)*

---

## La décision, et ce qu'elle change exactement

Le PRD fiscalité §3.2 posait la réserve :

> Aucun des portails de la zone n'expose d'API publique documentée. Un dépôt « automatisé »
> signifierait piloter un navigateur sur un système tiers avec les identifiants d'un client —
> fragile et exposé du point de vue des conditions d'utilisation.

⇒ **Le PO lève la réserve et retient le connecteur.** Les deux risques ne disparaissent pas pour
autant : ils deviennent des **exigences de conception**, portées par les critères d'acceptation
ci-dessous — la fragilité par le repli, l'exposition par le mandat de **STORY-560**.

⚡⚡ **Et l'architecture n'a pas à changer.** **AD-12** l'avait écrit avant qu'on le demande :

> Le dépôt assisté et un futur connecteur automatisé sont **deux implémentations du même port**.
> […] Le port est **asynchrone par nature**. Déposer rend un identifiant de dépôt ; l'accusé arrive
> comme un **fait séparé**. […] **un connecteur automatisé produira simplement ce fait
> immédiatement.**

⇒ **Cette story n'ouvre pas un chemin parallèle : elle branche un second adaptateur là où un seul
était branché.** C'est ce qui rend le repli gratuit.

## Le repli, qui est le cœur de la demande

> *« si elle n'est pas enregistrée, alors on garde la structure actuelle »*

**Le connecteur est une propriété déclarée du canal, pas un mode du produit.**

| État du canal pour un pays | Chemin emprunté |
|---|---|
| Aucun connecteur déclaré | **Dépôt assisté** — STORY-332 (guidage) + STORY-333 (accusé saisi) |
| Connecteur déclaré, secrets absents ou mandat manquant | **Dépôt assisté**, avec la raison affichée |
| Connecteur déclaré et utilisable | **Dépôt automatisé**, accusé récupéré (STORY-562) |
| Connecteur déclaré mais **en échec** | **Dépôt assisté**, avec le point d'arrêt atteint |

⛔ **Il n'existe aucun état où déclarer devient impossible.** C'est la propriété qui décide de tout
le reste : le connecteur est un **accélérateur**, jamais un point de passage obligé.

## Ce que « remplir les liens » veut dire, en donnée

Le connecteur prolonge **STORY-331** — *« décrire un nouveau canal sans livrer de code »* — avec un
bloc `automatisation`, dans le paquet **pays**, versionné et checksummé :

- l'**adresse** du portail et de ses écrans (dépôt, suivi, accusé) ;
- le **parcours** — la suite ordonnée d'étapes, chacune nommant ce qu'elle attend et ce qu'elle
  produit ;
- la **correspondance champ ↔ donnée**, adressée par code de poste, jamais par coordonnée en dur ;
- les **marqueurs de fin** : à quoi se reconnaît un dépôt accepté, un rejet, une session expirée ;
- le **point de reprise humaine** : l'étape où le connecteur s'arrête et rend la main.

⇒ **Un second pays ne coûte que ce bloc.** Aucun nom de portail, aucune adresse, aucun sélecteur
n'entre dans le code — c'est déjà la règle d'AD-12 pour le domaine, étendue ici à l'adaptateur.

⚠️ **Au Togo, il y a DEUX canaux OTR, et les confondre enverrait la liasse sur le mauvais portail :**

| Canal | Ce qu'il reçoit | Base |
|---|---|---|
| **GUDEF** | les **états financiers** (la liasse) | **LPF Art. 17** — *« Il est institué un guichet unique de dépôt des états financiers (GUDEF) placé sous la tutelle de l'Office »* |
| **dimana** | les **déclarations d'impôts** | confirmé par le PO le 2026-08-28 |

⇒ Deux blocs `automatisation` distincts, deux parcours, deux jeux de marqueurs. ⛔ Leur
caractérisation exacte — adresse, écrans, point de reprise humaine — **se relève sur le portail**,
elle ne se suppose pas.

## Périmètre

**Inclus**

- L'adaptateur de canal automatisé, derrière le port de **STORY-330**, sélectionné par la présence
  du bloc `automatisation` au paquet.
- **Le MFA n'est jamais contourné.** Quand le portail demande un second facteur, le connecteur
  **s'arrête et rend la main** à l'humain, sur l'étape exacte, sans perdre l'avancement. ⛔ Aucun
  facteur n'est stocké, deviné ou rejoué (STORY-560, hors périmètre du coffre par décision).
- **Idempotence.** Un dépôt engagé porte un identifiant ; un rejeu ne dépose jamais deux fois. ⚠️
  Un double dépôt à l'administration n'est pas une gêne technique — c'est une déclaration en
  double, avec ses conséquences.
- **Détection de dérive.** Le parcours déclaré ne correspond plus au portail → le connecteur
  **s'arrête, le dit, et bascule sur l'assisté**. ⛔ Il ne devine jamais l'écran suivant : un
  connecteur qui improvise sur un système d'État est le scénario à interdire.
- **Journalisation intégrale** au journal d'audit (AD-10/AD-19) : chaque étape, son horodatage,
  son issue. Le cabinet doit pouvoir reconstituer ce que le produit a fait **en son nom**.
- **Rythme respectueux** : un délai déclaré entre actions, un plafond de tentatives, pas de
  reprise en boucle sur un échec.
- Le **conditions d'utilisation du portail** portées comme **donnée du paquet** — texte et date de
  relevé — et affichées au cabinet **avant** l'activation du connecteur pour ce pays. ⚡ C'est le
  seul traitement honnête du risque juridique : le produit ne tranche pas à la place du cabinet,
  il l'informe et enregistre son choix.

**Hors périmètre**

- Le suivi du parcours après dépôt et la récupération de l'accusé : **STORY-562**.
- Déclarer un connecteur pour un pays autre que le Togo. Le mécanisme le permet ; l'instancier
  demande le parcours réel, relevé sur le portail.
- Toute forme de contournement d'un contrôle anti-robot. ⛔ **Si le portail en pose un, le
  connecteur s'arrête et rend la main** — c'est un point de reprise humaine de plus, pas un
  problème à résoudre.

## Critères d'acceptation

1. **Aucun connecteur déclaré → le dépôt assisté fonctionne à l'identique.** Témoin de
   non-régression sur STORY-332/333, exécuté sans le bloc `automatisation`.
2. Connecteur déclaré mais secrets absents, mandat manquant ou expiré → **repli assisté**, avec la
   raison nommée à l'écran.
3. Échec en cours de parcours → **repli assisté à l'étape atteinte**, l'avancement conservé.
   ⛔ Jamais un échec muet, jamais une reprise depuis le début sans le dire.
4. Demande de MFA → arrêt et **passation à l'humain**, sur l'étape exacte.
5. Rejeu d'un dépôt déjà engagé → **aucun second dépôt**, l'identifiant existant est rendu.
6. Le domaine reste **agnostique** : aucun nom de pays, de portail, d'adresse ni de sélecteur dans
   le code ; une recherche le prouve (garde AD-12 déjà en place, étendue à l'adaptateur).
7. Un parcours déclaré incomplet → refus **nommant l'étape et le champ manquants** (patron 331).
8. Le journal d'audit permet de reconstituer un dépôt automatisé **de bout en bout**, sans jamais
   contenir de secret.
9. Les conditions d'utilisation du pays sont **affichées et acceptées** avant la première
   activation ; l'acceptation est datée et attribuée.

## Notes

- ⚡ **Ce que le repli achète vraiment.** Un connecteur casse le jour où le portail change une
  page — c'est certain, pas probable. Un produit qui n'a que le chemin automatisé tombe ce jour-là
  avec toutes ses échéances. Un produit qui retombe sur l'assisté **perd de la vitesse, jamais la
  capacité de déclarer**. La demande du PO — *« si elle n'est pas enregistrée, on garde la
  structure actuelle »* — décrit exactement cette propriété.
- ⚠️ **La fragilité se mesure.** Le taux de dépôts qui retombent sur l'assisté est l'indicateur de
  santé du connecteur, et il doit être visible du cabinet — pas seulement de l'équipe.
- ⛔ **Le produit ne détient toujours pas le dernier maillon.** Même automatisé, le dépôt dépend
  d'un système tiers dont il ne maîtrise ni la disponibilité ni les évolutions. Le PRD en tirait
  une conséquence sur la façon de mesurer le succès (§10) : elle **reste vraie**.

---

## Réalignement du 2026-11-27, avant le code (lu sur `origin/dev` du fiscal `680164e`)

La fiche date du 2026-08-28. Depuis, 560, puis 330 → 337 ont été livrées. Relue contre le code :

### Ce qui existe déjà, et que 561 emploie tel quel

| Livré | Ce que 561 en prend |
|---|---|
| **330** — le port `CanalDeDepot` (`src/ports/canal-depot.ts`) : `engager(demande) → { depotId, mode, statut: ENGAGE, engageLe, rejoue }`, idempotent, jamais d'accusé ; `CanalAssiste` ; le registre `engagements_depot` (un seul `ENGAGE` par version, relais `REMPLACE`, actes au périmètre `depot-declaration:<id>`) | le second adaptateur se branche **derrière ce port**, au même registre ; le repli rend le `CanalAssiste` tel quel |
| **331** — le format de canal décrit en donnée : les paquets de **dépôt** de D (`paquets-depot` : formats et guidages), et `valeursDuFormulaire` (les valeurs d'un formulaire, dans l'ordre, par code de champ) | la **correspondance champ ↔ donnée** du parcours désigne un **code de champ** du formulaire de 331 (`CHAMP|<code>`) ; aucune valeur n'est recalculée |
| **332** — le guidage d'un dépôt engagé, étape par étape (il ne regarde pas le mode) | le repli assisté **est** ce guidage : un dépôt qui retombe se guide comme un autre |
| **333 / 334 / 335** — l'accusé saisi, le rejet, l'archive (garde `ACCUSE_REQUIS` de C, retour `REJET_REQUIS`) | **inchangés** ; 561 ne fait passer aucune déclaration à « Déposée » (porte de C) ; l'accusé relevé est à 562 |
| **336 / 337** — le dossier de contrôle lit les engagements, `mode` compris (une chaîne) | lit le mode `AUTOMATISE` sans changement |
| **560** — le coffre (`coffre-secrets`) : mandat `DEPOSER` / `SUIVRE` vérifié **à chaque usage** ; `raisonDuRepli` (raisons déjà nommées : `COFFRE_NON_CONFIGURE`, `MANDAT_ABSENT/EXPIRE/REVOQUE/NON_COUVRANT`, `SECRET_ABSENT/EXPIRE/REVOQUE`) ; port `UsageSecretDeCanal` : `emettre` (jeton d'usage 5 min, lié à un `depotId`) puis `utiliser(jeton, depotId, travail)` (le clair n'existe que dans `travail` ; `controle.toujoursAutorise()` entre deux étapes) ; garde D-560-2 : les dossiers du dépôt assisté n'importent rien du coffre | le connecteur **consomme** ce port sans rien y changer ; le canal au coffre est le **code du connecteur** déclaré au paquet |
| **Paquet fiscal** (C) — lu par `paquetDeLObligation` (la version exacte sur laquelle l'obligation a été dérivée, vérifiée par son empreinte) ; son schéma (`balance-service`, `scripts/referentiels/paquet-fiscal.schema.json`) n'interdit pas une rubrique racine inconnue | le bloc `automatisation` se lit **dans le paquet de l'obligation**, versionné et checksummé |
| **318** (C) — la garde AD-18 : aucun `setInterval`, une liste fermée des `setTimeout` | le délai déclaré entre deux actions est **une attente bornée de plus**, inscrite à la liste (« ⚠ Communs ») |

### Ce que la fiche demande et qui est dépassé

- *« Piloter un navigateur »* (PRD §3.2, cité) : **pas d'automate de navigateur au lot 7** (D-561-1). Le connecteur
  parle **HTTP** au portail, derrière un port `PiloteDePortail` ; un pilote de navigateur pourra se brancher derrière
  le même port, avec le même parcours en donnée, si le relevé réel (1102) le rend nécessaire (Q-D-36).
- *« Le parcours de GUDEF et de dimana »* : **il ne se suppose pas** (la fiche le dit). Au lot 7, **aucun bloc réel**
  n'entre au paquet Togo : rien n'a été relevé sur un portail. Le mécanisme est livré et prouvé contre un **portail
  simulé** ; le paquet Togo reste sans bloc, donc **assisté partout** (AC-1). Le relevé est un geste de 1102.
- *« Garde AD-12 déjà en place, étendue à l'adaptateur »* : elle existe (`garde-ad12.spec.ts`, liste fermée) ; 561 y
  ajoute ses fichiers.
- *« STORY-537 (gabarit du livrable) »* en prérequis : le **téléversement** d'un classeur n'est pas automatisé en 561
  (D-561-13) ; un parcours de fichier s'arrête sur un point de reprise humaine déclaré avant l'envoi du classeur.

### Ce que 561 complète

1. **Le bloc `automatisation`** au paquet fiscal du pays (D-561-2), son contrat et sa validation par D
   (`AUTOMATISATION_INCOMPLETE`, qui nomme le connecteur, l'étape et le champ, patron 331).
2. **L'aiguillage** derrière le port : le connecteur ou l'assisté, décidé **avant** l'engagement par une suite de
   vérifications dont chaque échec a sa raison (D-561-4) ; toute erreur imprévue de l'aiguillage mène à l'assisté.
3. **Le connecteur** : le parcours déclaré, exécuté pas à pas contre le portail, avec ses marqueurs (accepté, rejeté,
   session expirée, second facteur, contrôle anti-robot) et la détection de dérive ; le rythme déclaré ; le jeton
   d'usage du coffre ; le parcours rangé (`parcours_connecteur`) et journalisé étape par étape.
4. **Les conditions d'utilisation** du portail : affichées, puis acceptées (datées, attribuées) avant la première
   activation.
5. **La lecture du parcours** d'un dépôt et **la santé du connecteur** (le taux de repli, visible du cabinet).

### Décisions

- **D-561-1 — un connecteur HTTP, pas un navigateur.** Playwright et Chromium dans `node:24-slim`, c'est plus de 400 Mo
  et des bibliothèques système dans l'image, une dépendance neuve (`package.json`, commun) et une construction longue sur
  un poste partagé ; et aucun portail réel n'a été relevé pour dire qu'il en faut un. Le pilote HTTP emploie le `fetch`
  de Node (aucune dépendance). Le parcours est une suite d'**échanges** déclarés (méthode, chemin relatif, champs,
  marqueurs) : un pilote de navigateur lira le même bloc, derrière le même port.
- **D-561-2 — le bloc vit au paquet fiscal du pays, qui est à C.** C'est une rubrique racine facultative,
  `automatisation`. D la lit dans le paquet de l'obligation (`paquetDeLObligation`) et la valide lui-même
  (`domain/connecteur-depot/contrat-automatisation.ts`). **→ C** : déclarer la rubrique au schéma du paquet
  (facultative, de la forme ci-dessous) ; **aucune instance au paquet Togo** tant que rien n'est relevé. D ne touche ni
  le paquet ni ses copies : ses tests emploient **un double du paquet** (la copie Togo, plus un bloc d'essai qui pointe
  le portail simulé).
- **D-561-3 — le connecteur se choisit par `(canal, code de l'obligation)`.** Chaque connecteur nomme le `canal` du
  catalogue et les `obligations` (codes du catalogue) qu'il sert. Les deux canaux OTR sont donc deux connecteurs, chacun
  avec sa liste : la liasse ne part jamais sur le portail des impôts. Un code servi par deux connecteurs du même canal
  est refusé à la validation (`AUTOMATISATION_INCOMPLETE`, champ `obligations`).
- **D-561-4 — l'ordre du repli, avant tout geste sur le portail** : `AUCUN_CONNECTEUR` → `AUTOMATISATION_INCOMPLETE`
  (connecteur, étape, champ) → `CONDITIONS_NON_ACCEPTEES` → les raisons du coffre (560, inchangées) →
  `VERSION_DEJA_ENGAGEE`. Chacune engage **en assisté**, exactement comme aujourd'hui (mode `ASSISTE`), et la réponse
  nomme la raison. Une erreur imprévue de l'aiguillage donne `CONNECTEUR_INDISPONIBLE`, en assisté. ⛔ L'aiguillage ne
  refuse jamais un engagement que l'assisté accepterait.
- **D-561-5 — le mode `AUTOMATISE`** s'ajoute à `MODES_CANAL` : il dit quel adaptateur a engagé le dépôt. Un dépôt
  `AUTOMATISE` qui retombe garde son mode (le registre ne récrit pas un engagement) ; son **parcours** dit l'issue.
  Le guidage (332), l'accusé (333), le rejet (334) et l'archive (335) le servent comme un autre.
- **D-561-6 — une tentative automatisée par version, et jamais deux envois.** Le rejeu rend le parcours rangé, avec le
  même `depotId` (AC-5). Un relais de la même version part en assisté (`VERSION_DEJA_ENGAGEE`). Le parcours est
  **réservé** sous un index unique `(organisation, depotId)` avant tout appel au portail. L'étape d'envoi (`SOUMETTRE`)
  **n'est jamais retentée** : un envoi sans réponse lisible mène à la reprise humaine `ISSUE_INCERTAINE` (« vérifier sur
  le portail »). Relancer un dépôt en échec reste une décision, hors périmètre (comme en 562).
- **D-561-7 — le parcours s'exécute dans l'appel d'engagement, borné** : 20 étapes au plus, 5 s au plus entre deux
  actions, 3 tentatives au plus (hors envoi, sur 5xx ou erreur réseau), 30 s par requête, 240 s en tout (sous les 5 min
  du jeton d'usage) ; au-delà, `DUREE_DEPASSEE`. Le délai est une attente bornée (garde 318). Un parcours resté
  `EN_COURS` (processus tombé) se lit `INTERROMPU` passé 10 min, sans écriture. Le suivi récurrent est à 562 (BullMQ).
- **D-561-8 — le journal reconstitue le dépôt, sans secret** : actes `CONNECTEUR_PARCOURS_COMMENCE`, `CONNECTEUR_ETAPE`
  (code, geste, début, fin, issue, statut HTTP, tentatives) et `CONNECTEUR_PARCOURS_TERMINE` (issue, raison, étape), au
  périmètre du dépôt (`depot-declaration:<id>`, la chaîne de l'engagement). ⛔ Jamais la valeur d'un champ, le corps
  d'une réponse, un identifiant ni un mot de passe.
- **D-561-9 — les conditions d'utilisation** se lisent au paquet (`texte`, `releveLe`, `source`). Leur **empreinte**
  (sha256 du texte et de la date) est ce que le cabinet accepte. L'acceptation vaut par organisation × connecteur ×
  empreinte ; elle est datée, attribuée, exige le droit `deposer` et se journalise (`CONNECTEUR_CONDITIONS_ACCEPTEES`).
  Un texte relevé à nouveau demande une nouvelle acceptation.
- **D-561-10 — l'adresse du portail** : `https` seulement, ou `http` pour un hôte de bouclage hors production (le portail
  simulé des preuves). Les chemins sont relatifs à l'adresse ; aucune redirection n'est suivie (un 3xx est un écran comme
  un autre : sans le marqueur attendu, c'est une dérive) ; les cookies vivent le temps d'un parcours.
- **D-561-11 — D-560-2 tient.** L'aiguillage (`adapters/canal-depot/canal-aiguille.ts`) dépend du port
  `ConnecteurDeDepot` (`ports/connecteur-depot.ts`) ; seul le module `connecteur-depot` importe le coffre. Témoin : un
  connecteur qui lève, ou un coffre absent, et le dépôt est engagé en assisté.
- **D-561-12 — la place de 562** : le parcours rangé porte l'issue `DEPOSE`, la `referencePortail` relevée à l'envoi et
  le connecteur (code, version). La clé `suivi` du connecteur est **réservée** (un objet, validé comme tel, inutilisé en
  561). L'acte `SUIVRE` du mandat existe déjà.
- **D-561-13 — pas de téléversement en 561** : les gestes sont `S_AUTHENTIFIER`, `OUVRIR`, `SAISIR` et `SOUMETTRE`. Un
  parcours de fichier (la liasse) déclare son `repriseHumaine` avant l'envoi du classeur.

### Le contrat du bloc (annoncé avant le code)

```jsonc
"automatisation": {
  "connecteurs": [{
    "code": "essai-impots",            // code opaque ; c'est aussi le canal du coffre (560 : minuscules, chiffres, tirets)
    "version": "1.0",
    "canal": "TELESERVICE_OTR",        // le canal du catalogue, comparé tel quel
    "obligations": ["TVA"],            // les codes du catalogue servis
    "portail": { "adresse": "https://…" },
    "conditionsUtilisation": { "texte": "…", "releveLe": "AAAA-MM-JJ", "source": "…" },
    "rythme": { "delaiEntreActionsMs": 500, "tentativesMax": 2, "delaiRequeteMs": 10000 },
    "marqueurs": {                      // chacun : { "contient": "…" } (texte de la réponse) et/ou { "statut": 302 }
      "accepte": {…}, "rejete": {…}, "sessionExpiree": {…}, "secondFacteur": {…}, "antiRobot": {…}
    },
    "parcours": [{
      "code": "connexion", "geste": "S_AUTHENTIFIER", "methode": "POST", "chemin": "/connexion",
      "champs": [{ "nom": "u", "valeur": "SECRET|identifiant" }, { "nom": "p", "valeur": "SECRET|motDePasse" }],
      "attend": { "contient": "…" },                            // l'écran attendu : sans lui, dérive
      "produit": [{ "nom": "jeton", "entre": "…", "et": "…" }]  // repris par une étape suivante (PRODUIT|jeton)
    }, …, { "code": "envoi", "geste": "SOUMETTRE", …, "reference": { "entre": "…", "et": "…" } }],
    "repriseHumaine": { "etape": "envoi" },  // facultatif : l'étape où le connecteur s'arrête et rend la main
    "suivi": {}                               // réservé à 562
  }]
}
```

Valeurs d'un champ : `SECRET|identifiant` et `SECRET|motDePasse` (dans `S_AUTHENTIFIER` seulement), `CHAMP|<code du
formulaire de 331>`, `PRODUIT|<nom produit par une étape antérieure>`, `CONSTANTE|<texte>`. Un marqueur est une
sous-chaîne du corps ou un statut, jamais une expression (AD-2).

### Le repli, table complète (chaque ligne est un test)

| Situation | Chemin | Raison ou issue | Mode engagé |
|---|---|---|---|
| Aucun bloc, ou aucun connecteur pour `(canal, code)` | assisté | `AUCUN_CONNECTEUR` | `ASSISTE` |
| Bloc déclaré incomplet | assisté | `AUTOMATISATION_INCOMPLETE` (connecteur, étape, champ) | `ASSISTE` |
| Conditions d'utilisation non acceptées (ou texte changé) | assisté | `CONDITIONS_NON_ACCEPTEES` | `ASSISTE` |
| Coffre non configuré ; mandat absent, expiré, révoqué ou non couvrant ; secret absent, expiré ou révoqué | assisté | la raison du coffre (560) | `ASSISTE` |
| Version déjà engagée (relais) | assisté | `VERSION_DEJA_ENGAGEE` | `ASSISTE` |
| Erreur imprévue de l'aiguillage | assisté | `CONNECTEUR_INDISPONIBLE` | `ASSISTE` |
| Jeton refusé par le coffre au dernier moment | assisté | la raison du coffre, étape `null` | `AUTOMATISE` |
| Écran attendu absent, ou extraction impossible | assisté, à l'étape | `DERIVE` | `AUTOMATISE` |
| Session expirée | assisté, à l'étape | `SESSION_EXPIREE` | `AUTOMATISE` |
| Rejet affiché à l'envoi | assisté, à l'étape | `REFUS_DU_PORTAIL` | `AUTOMATISE` |
| Portail injoignable, ou 5xx après les tentatives | assisté, à l'étape | `PORTAIL_INDISPONIBLE` | `AUTOMATISE` |
| Autorisation retirée entre deux étapes | assisté, à l'étape | `AUTORISATION_RETIREE` | `AUTOMATISE` |
| Durée dépassée | assisté, à l'étape | `DUREE_DEPASSEE` | `AUTOMATISE` |
| Valeur du formulaire absente | assisté, à l'étape | `VALEURS_INCOMPLETES` (champ) | `AUTOMATISE` |
| Second facteur | **reprise humaine**, à l'étape | `SECOND_FACTEUR` | `AUTOMATISE` |
| Contrôle anti-robot | **reprise humaine**, à l'étape | `CONTROLE_ANTI_ROBOT` | `AUTOMATISE` |
| Point de reprise déclaré atteint | **reprise humaine**, à l'étape | `REPRISE_DECLAREE` | `AUTOMATISE` |
| Envoi sans réponse lisible | **reprise humaine**, à l'étape | `ISSUE_INCERTAINE` | `AUTOMATISE` |
| Tout se passe bien | **automatisé** | issue `DEPOSE`, `referencePortail` | `AUTOMATISE` |
| Rejeu | celui du parcours rangé | inchangée | inchangé |

### Contrat de service (« ⚠ Contrats »)

- `POST /api/v1/depots-declaration` : la réponse gagne `chemin { suivi: ASSISTE | AUTOMATISE, raison, issue, etape,
  details }`, et `mode` gagne `AUTOMATISE`. Rien d'autre ne change (AC-1).
- `GET /api/v1/connecteurs-depot/declarations/{obligationId}` : le connecteur que le paquet déclare pour la déclaration
  (ou aucun), son état (`UTILISABLE`, ou `INCOMPLET` avec son défaut), ses conditions et leur empreinte, l'acceptation de
  l'organisation, l'état du canal au coffre.
- `POST /api/v1/connecteurs-depot/declarations/{obligationId}/conditions` `{ empreinte }` (droit `deposer`) :
  l'acceptation datée et attribuée ; 409 `CONDITIONS_PERIMEES`, 422 `AUTOMATISATION_INCOMPLETE`, 404 `AUCUN_CONNECTEUR`.
- `GET /api/v1/connecteurs-depot/depots/{depotId}/parcours` : le parcours (étapes, issue, raison, point d'arrêt).
- `GET /api/v1/connecteurs-depot/sante` : pour chaque connecteur, les parcours par issue et le taux de repli.

### Dette de 337 levée (2026-11-27, 08:47)

`livrable-ac7.spec.ts` a été rejouée **seule** sous Node 24.22.3 (étage `verification`, archive d'`origin/dev`
`680164e`) : 1/1 suite, **83/83**, sans `CLASSEUR_TROP_COUTEUX`. Le rouge de 337 venait de la charge du poste, pas du
code de 537.

## Livraison (2026-11-27)

**Code** : prospera-fiscal-service#92, `dev` `997e29a` (head `9a951af`, rebasée sur `origin/dev` `57c7504`). Annonce avant
le code : prospera-stories#1033, `main` b8a30d5.

### Ce qui est livré

- **L'aiguillage** (`adapters/canal-depot/canal-aiguille.ts`) est l'adaptateur du port `CanalDeDepot` que `DepotsModule`
  fournit. Il engage en assisté (raison nommée dans `chemin`) tout ce qui n'est pas « un connecteur déclaré et complet,
  des conditions acceptées, un coffre qui autorise le dépôt, une version jamais engagée ». Sinon, il engage en `AUTOMATISE`
  et joue le parcours. Toute erreur de la préparation donne l'assisté (`CONNECTEUR_INDISPONIBLE`), toute erreur du
  parcours aussi (`CONNECTEUR_EN_ECHEC`). ⛔ Aucun engagement que l'assisté accepte n'est refusé.
- **Le connecteur** (`connecteur-depot`, dossiers neufs de D) :
  - le contrat du bloc `automatisation` (`domain/connecteur-depot/contrat-automatisation.ts`) est strict : chaque refus
    `AUTOMATISATION_INCOMPLETE` nomme le connecteur, l'étape et le champ (AC-7) ;
  - le parcours (`parcours.ts`) est joué pas à pas, par un environnement injecté : marqueurs (le second facteur et
    l'anti-robot passent en premier), dérive, retentatives bornées hors envoi, envoi jamais rejoué, durée bornée,
    autorisation du coffre relue avant chaque étape ;
  - le pilote HTTP (`pilote-http.ts`, `fetch` de Node, aucune dépendance) : l'adresse déclarée seule, aucune redirection
    suivie, cookies le temps d'un parcours, délai par `AbortSignal`, écran borné à 2 Mo ;
  - l'attente bornée entre deux actions (5 s au plus), inscrite à la garde 318 ;
  - le parcours rangé (`parcours_connecteur`, index unique `(organisation, depotId)` : une réservation avant tout appel)
    et les conditions acceptées (`conditions_connecteur`), chaque écriture avec son acte au journal chaîné ;
  - le coffre de 560 est consommé tel quel (`emettre` puis `utiliser`), plus une lecture `repliPourDeposer` (l'état du
    canal pour `DEPOSER`, sans écriture).
- **Les routes** : `chemin` dans `POST /depots-declaration` ; `GET /connecteurs-depot/declarations/{obligationId}`,
  `POST …/conditions`, `GET /connecteurs-depot/depots/{depotId}/parcours` et `GET /connecteurs-depot/sante`.
- **Le paquet Togo** n'a aucun bloc. Le dépôt reste donc assisté partout, ce que prouve un témoin sur la copie à
  l'octet (AC-1). Le bloc réel suivra le relevé de 1102.

### Les critères

| AC | Preuve |
|---|---|
| 1 — sans connecteur, l'assisté à l'identique | table (`AUCUN_CONNECTEUR`, aucun appel au portail, mode `ASSISTE`) ; e2e (la copie Togo, réponse d'aujourd'hui plus `chemin`) ; suites 330 → 337 vertes (seules les attentes de 330 lisent en plus `chemin`) |
| 2 — secrets absents, mandat manquant ou expiré | table : `COFFRE_NON_CONFIGURE`, `MANDAT_ABSENT`, `MANDAT_EXPIRE`, `MANDAT_REVOQUE`, `MANDAT_NON_COUVRANT`, `SECRET_ABSENT`, `SECRET_EXPIRE`, `SECRET_REVOQUE` ; e2e |
| 3 — échec en cours : l'assisté à l'étape atteinte | table : `DERIVE`, `SESSION_EXPIREE`, `PORTAIL_INDISPONIBLE`, `REFUS_DU_PORTAIL`, `AUTORISATION_RETIREE`, `DUREE_DEPASSEE`, `VALEURS_INCOMPLETES`, `CONNECTEUR_EN_ECHEC` (les étapes franchies gardées) |
| 4 — MFA : passation sur l'étape exacte | table : `SECOND_FACTEUR`, `CONTROLE_ANTI_ROBOT`, `REPRISE_DECLAREE`, `ISSUE_INCERTAINE` |
| 5 — rejeu sans second dépôt | table et e2e : le même `depotId`, un seul envoi ; conformité : dix réservations parallèles, une seule |
| 6 — le domaine reste agnostique | `garde-ad12.spec.ts` étendue aux dossiers du connecteur ; D-560-2 vert |
| 7 — un parcours incomplet nomme l'étape et le champ | contrat (57 cas) ; table (bloc incomplet, champ absent du formulaire) |
| 8 — le journal reconstitue le dépôt, sans secret | table, e2e et conformité : `COMMENCE`, une `ETAPE` par étape, `TERMINE` ; aucune trace de l'identifiant ni du mot de passe d'essai |
| 9 — les conditions affichées et acceptées avant l'activation | service et e2e : empreinte exacte, datée, attribuée, `CONDITIONS_PERIMEES`, une nouvelle acceptation après un nouveau relevé |

### Preuves

Toutes sur l'arbre rebasé localement sur `origin/dev` `57c7504` (`00212d9`). Cet arbre est identique à celui de `dev` `997e29a` : `git diff` vide.

- **Node 24.22.3** (étage `verification`) :
  - unitaires : 279/280 suites (1 ignorée), 4334 tests verts (3 ignorés) ;
  - e2e : 16/16 suites, 421 tests ;
  - `test:conformite` sur `mongo-fiscal` en jeu de répliques : 34/34 suites, 230 tests.
- **La première passe complète a trouvé deux rouges**, corrigés avant la fusion (9a951af) :
  - la garde des droits du contrôleur du connecteur n'était pas fournie, et le câblage du module racine ne la résolvait pas. `ConnecteurDepotModule` importe désormais `HabilitationsModule` ;
  - les attentes de 330 (service et e2e) ne connaissaient pas encore `chemin`.
- **Mutations sous Node 25**, sur le code neuf : 71 intentions, en 83 écritures. Douze ont été réécrites parce que la première ne compilait pas (`noUnusedParameters`, TS6133). Toutes rougissent sur une assertion. Les cinq qui survivaient ont reçu un test :
  - l'identifiant seul dans l'adresse ;
  - l'écran attendu sans le marqueur d'acceptation ;
  - le mandat qui ne couvre que `DEPOSER` ;
  - l'écran qui ne finit pas ;
  - le rejeu d'un dépôt automatisé après un repli, qui rend son parcours et non la raison du repli.
- **Mutations sur MongoDB réel**, toutes rouges : M1 (la fin écrite sans exiger `EN_COURS`), M2b (la réservation perdue non relue), M3b (`trouver` sans l'organisation) et M4b (l'acceptation concurrente non idempotente). M2 à M4 ont été réécrites (`|| erreur`, `$or`) parce que la première écriture ne compilait pas.
- **§1.5, pile `grp-d` avec Redis** (`docker compose -p grp-d`, l'archive de la branche rebasée) : saine (MongoDB en jeu de répliques, audit, Kafka, Redis). Quatre routes sans jeton répondent 401. Chaque module est initialisé une fois, sans erreur d'injection, et aucune valeur d'essai n'apparaît dans les journaux du service.
- **Porte `gate561.js`** : le code compilé de l'image, dans le conteneur, contre un portail simulé sur le bouclage. Les identifiants sont tirés au hasard ; aucun secret réel, aucun portail réel. Résultat 28/28 :
  - un dépôt `DEPOSE` (une référence relevée, un seul envoi), le rejeu sans envoi, le parcours et son journal (`COMMENCE`, trois `ETAPE`, `TERMINE`) ;
  - les 11 raisons du repli avant tout geste, les 8 replis en cours, les 4 reprises humaines ;
  - le bouclage refusé en production.
- lint des fichiers touchés : 0 ; `tsc` : 0.
- **Dette de 337 levée** : `livrable-ac7.spec.ts` rejouée seule sous Node 24 (`680164e`), 83/83.
- Verrou Docker : pris trois fois (14:11, 14:25, 14:40), rendu à chaque fois, la dernière à 14:41. B et C ont été prévenus ; aucun conteneur `grp-d` ne reste.

### Écarts à l'annonce

Aucun écart au contrat annoncé (#1033) : les ajouts de l'OpenAPI et la ligne de `garde-minuteries.spec.ts` sont ceux de l'annonce, sans migration ni fichier de C. Trois précisions de forme :

- le port du registre s'appelle `ports/registre-connecteur-depot.ts` (annoncé `registre-parcours-connecteur.ts`), parce qu'il range les parcours **et** les conditions ;
- `ConnecteurDepotModule` importe, sans les modifier, `HabilitationsModule` (la garde des droits), `ObligationsModule` et `PaquetsModule`, en lecture comme `DepotsModule` ;
- le coffre de 560 gagne une lecture, `repliPourDeposer`, sans écriture.

## Questions au PO

- **Q-D-36 — le connecteur doit-il piloter un navigateur ?** Au lot 7, il parle HTTP au portail (D-561-1). Si le relevé
  du premier dépôt réel (1102) montre que dimana ou le GUDEF n'acceptent qu'un navigateur (écrans construits en
  JavaScript, contrôle du navigateur), un pilote de navigateur se branchera derrière le même port `PiloteDePortail`, avec
  le même bloc en donnée, et une dépendance lourde à l'image. **Choix par défaut** : HTTP, tant que le relevé ne dit pas
  le contraire.
