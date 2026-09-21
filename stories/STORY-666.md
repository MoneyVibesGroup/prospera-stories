# STORY-666 : Le raccordement PI-SPI par organisation — Money Vibes n'appelle jamais pour autrui

Status: review

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 8 · **Sprint :** ⚠️ **NON SLOTTÉE** — `PLAN-PI-SPI-CAS-D-USAGE-2026-09-15`, phase B
**Prérequis :** **STORY-243** (le coffre et son lien), **STORY-652** (la clé d'API du raccordement),
**STORY-662** (l'émission pousse la demande)
**Origine :** l'adaptateur du schéma lit **six variables d'environnement, une fois au démarrage**.
Il n'existe donc qu'**un** raccordement pour tout le service — celui de Money Vibes — et toute demande
poussée part sous son identité, pour n'importe quelle organisation.

---

## Le fait

`AdaptateurApiBusiness` lit `PI_SPI_API_BASE_URL`, `PI_SPI_TOKEN_URL`, `PI_SPI_CLIENT_ID`,
`PI_SPI_CLIENT_SECRET`, `PI_SPI_API_KEY` et `PI_SPI_PARTICIPANT` au démarrage, les gèle, et s'en sert
pour **toutes** les organisations. Tant que Money Vibes était la seule à encaisser par le schéma,
c'était vrai et suffisant. Ça cesse de l'être au premier distributeur.

⛔⛔ **CE N'EST PAS UNE LIMITE DE CONFORT, C'EST NFR-1.** « Prospera n'encaisse jamais pour le compte
d'autrui » : un appel authentifié par le client business de Money Vibes qui crédite le compte d'un
distributeur fait de Money Vibes **le marchand de fait** de son client — exactement la faute que
STORY-246 a refusée pour FedaPay, et pour laquelle le coffre de STORY-243 existe. Aujourd'hui, le
service ne l'a pas commise parce qu'il n'a qu'un seul client ; demain, il la commettra **sans qu'un
seul champ ne bouge**.

⚡ **Et le mur n'est pas celui qu'on croit.** Rien dans le code n'interdit à une organisation
d'encaisser par le schéma : le compte se déclare, le routage se pose, la demande part. Ce qui manque
est la seule chose qui rende l'appel **le sien** — ses identifiants chez son participant. Le
raccordement doit donc devenir une **donnée d'organisation**, scellée comme une clef marchande.

⚠️ **Ce qui n'est PAS propre à l'organisation ne doit pas le devenir.** L'origine de l'API et l'URL
des jetons décrivent l'**environnement** (bac à sable, production), pas le client : les faire saisir
par organisation, c'est laisser une organisation pointer notre service vers un hôte qu'elle choisit —
une falsification de requête côté serveur, refusée en STORY-642. Elles restent en configuration.

## Critères d'acceptation

- [x] AC-1 — Une organisation déclare son raccordement au schéma : identifiant client, secret,
      clé d'API, code du participant. Droit `paiement:compte:administrer` (celui qui gouverne déjà
      « où l'argent d'une organisation arrive », FR-P59), gate d'AD-16, trace au journal chaîné.
- [x] AC-2 — ⛔ **Le secret et la clé d'API sont SCELLÉS** (STORY-243), sous un lien qui nomme
      l'organisation et le genre du secret ; aucune route ne les restitue, aucun `toJSON` ne les
      sérialise, et un dump n'en livre aucun. L'identifiant client et le participant restent **en
      clair** : le critère est *ce que la fuite permettrait*, et ces deux-là ne permettent rien —
      l'un identifie, l'autre est déjà publié sur chaque compte du schéma.
- [x] AC-3 — ⛔⛔ **L'adaptateur n'appelle plus JAMAIS sous les variables d'environnement.** Il exige
      le raccordement **de l'organisation de la demande** ; une organisation qui n'en a pas ne pousse
      rien, avec un refus nommé qui dit quoi faire. **Aucun repli sur le raccordement de la
      plateforme** : un repli, c'est NFR-1 violé par défaut, en silence.
- [x] AC-4 — Money Vibes déclare le sien **par la même route**, comme n'importe quelle organisation
      (leçon STORY-601/289 : elle est une organisation comme une autre). Les variables
      d'environnement du client cessent d'être lues ; celles de l'environnement (origine, URL des
      jetons, préfixe de portée) restent.
- [x] AC-5 — `/health` continue de nommer ce qui manque **sans nommer personne** : le raccordement
      n'étant plus global, l'indicateur ne peut plus dire « incomplet » pour tout le monde. Il dit ce
      qui manque à l'**environnement**, jamais l'état du raccordement d'une organisation — sinon une
      route publique apprendrait qui est raccordé.
- [x] AC-6 — Le participant déclaré par le raccordement et celui du compte d'encaissement doivent
      **concorder** (contrôle existant de STORY-662, qui change de source) : un compte tenu par un
      établissement que ce raccordement ne sert pas ne reçoit aucune demande.
- [x] AC-7 — Recette **réelle** : Money Vibes déclare son raccordement par l'API, une demande part
      chez le schéma sous ce raccordement, et une organisation **sans** raccordement se voit refuser
      l'émission par le refus nommé — pas par une panne.

## Ce que cette story ne fait pas

- Elle **ne déclare pas** le webhook chez le schéma pour l'organisation : la clef de notification se
  dépose déjà par [[STORY-665]], et l'URL de rappel porte l'identifiant du compte.
- Elle **ne touche pas** FedaPay : sa clé marchande est déjà par organisation depuis [[STORY-246]].
- Elle **n'ouvre aucun écran** : la console est STORY-286.

## Livraison (2026-09-21 — branche `MNV-666`, commit `3b4f914`, sur `origin/dev`)

**Suites :** 3 569 unitaires (266 suites), 283 e2e, lint 0, `tsc` 0. **Recette réelle Docker
sur le bac à sable : 16/16.**

### Ce qui a été construit

- `PUT` / `GET /v1/raccordements/:fournisseur` (droit `paiement:compte:administrer`). Aucune route
  de retrait : retirer arrête les demandes poussées d'une organisation, c'est une décision qui
  viendra avec son acte et son écran ([[STORY-286]]). Remplacer se fait par le même `PUT`.
- Collection `raccordements_fournisseur`, `_id` = `organisation:fournisseur` — un second
  raccordement pour le même couple est inexprimable. Deux scellés `select: false`
  (`secretClientChiffre`, `cleApiChiffree`), sous un lien
  `raccordement-fournisseur:<org>:<fournisseur>:<SECRET_CLIENT|CLE_API>`.
- `RaccordementDuFournisseur` (sous `src/adapters/`) : le pendant de `SecretDuCompte` pour
  l'**identité** de l'appel. ⚡ **AC-3 tient par une ABSENCE D'INJECTION** : la classe n'injecte
  pas la configuration — ce qu'elle ne peut pas lire, elle ne peut pas s'en servir comme repli.
- Méthode facultative du port `exigerLeRaccordement?(organisationId)` : son absence déclare que le
  fournisseur n'attend aucun raccordement (FedaPay : la clef est celle du compte). Le registre en
  dérive `attendUnRaccordement()`, et la route refuse de sceller pour un fournisseur qui n'en
  attend pas (`RACCORDEMENT_FOURNISSEUR_SANS_OBJET`).
- Chaîne d'audit dédiée `RACCORDEMENT_FOURNISSEUR`, clef dérivée par fournisseur.

### Ce que la story a tranché, et qu'il ne faut pas refaire

- ⚡⚡ **LE REFUS TOMBE À L'ÉMISSION, PAS DANS LE RELAIS.** Une demande qui réunit les trois faits
  d'éligibilité (tarif poussé, adresse du payeur, compte vérifié) a été **préparée pour partir** :
  la dégrader en lien, en silence, cacherait à l'organisation qu'aucune de ses demandes ne part ;
  la laisser s'enfiler produirait un abandon consigné par un relais que personne ne regarde.
  `FileDInitiation` pose donc la question au fournisseur, et le refus annule l'émission. Une
  demande **sans** adresse de payeur reste un lien, non refusée (mesuré en recette).
- ⚡ **Une organisation sans raccordement ne VÉRIFIE aucun compte**, donc ne devient jamais
  éligible à la poussée : pour une organisation neuve, le refus nommé arrive à la vérification. Le
  refus à l'émission est celui de la **mise en service** — Money Vibes avait un compte vérifié et
  plus aucun raccordement, exactement l'état que la recette a trouvé et prouvé.
- ⚡ **Le QR présenté LIT le raccordement, il ne l'OUVRE pas** : seule la concordance du
  participant sert (AC-6), et elle est en clair. Aucun secret ne sort du coffre pour un code.
- ⚡ **La clé d'API est scellée — à l'inverse de ce que STORY-652 avait écrit, et pour la raison
  que STORY-652 donnait.** Elle « appartient au raccordement » : c'était un argument pour
  l'environnement tant qu'il n'y avait qu'un raccordement, c'en est un pour le coffre depuis qu'il
  y en a un par organisation.
- ⚡ Les deux points portés par la fiche sont retenus tels quels : le droit
  `paiement:compte:administrer`, et le participant (avec l'identifiant client) **en clair**.

### Pièges payés

- ⛔⛔ **LE TAMIS DU JOURNAL REFUSE TOUT NOM DE CLEF QUI CONTIENT « secret »** (AD-5). Le premier
  jet consignait `secretsDeposes: true` : chaque déclaration aurait échoué **en production
  seulement**, un double d'`EcritureDArgent` sans tamis restant vert. Les specs du cas d'usage et
  l'e2e passent désormais la trace dans le **vrai** `verifierAbsenceDeDonneesDePaiement`. Le fait
  s'appelle `identifiantsDAppelDeposes`.
- ⛔ Deux gardes existantes ont rougi, et elles avaient raison : l'**inventaire fermé des
  écritures auditées** (`piste-opposable`) et le **graphe du module des adaptateurs** (un modèle
  de plus à doubler). Une troisième a été écrite : le câblage Nest des **deux** modules qui
  fournissent `RaccordementDuFournisseur` — elle parcourt **tous** les providers d'un module au
  lieu d'en nommer quelques-uns.
- ⛔ Les 4 variables d'un client ne sont plus nommées par **aucune** source (garde de sources, avec
  ses deux contre-preuves). `test/recette-pi-spi-reelle.ts` les lit encore — dans le `.env` de la
  personne qui la lance : elle tourne hors du service et lui **prête** son raccordement.
- ⚠️ Le compose racine ne relaie plus ces 4 variables au conteneur (vérifié : `printenv` en
  compte 0). ⚠️ Ce fichier vit **hors de tout dépôt git** : la modification n'est dans aucun commit.
- ⚠️ Outillage : lancer e2e et unitaires **en même temps** sur ce poste produit des timeouts de
  5 s qui ressemblent à des échecs (5 faux rouges) ; relancés seuls, 283/283.

### ⚠️ Points ouverts pour le PO

1. **UN DÉPLOIEMENT SERT UN PARTICIPANT.** L'origine de l'API reste une valeur d'environnement, et
   sur le bac à sable son chemin **est** le code du participant (`…/TGD999`). Une organisation
   raccordée chez un autre établissement déclarerait un participant que cette origine ne sert pas :
   l'appel échouerait chez le participant (fermant), mais rien ne le dit avant. Le jour où il y en
   a deux, la table **participant → origine** est une donnée de **PLATEFORME** (le registre de
   [[STORY-289]] est son lieu naturel), **jamais** saisie par une organisation — c'est la
   falsification de requête côté serveur que [[STORY-642]] a refusée.
2. **Aucun retrait, aucune rotation assistée.** Remplacer pose les quatre valeurs d'un coup ; il
   n'y a pas de fenêtre à deux secrets comme pour la clef de notification ([[STORY-665]]). À
   instruire si un établissement impose une rotation sans coupure.
3. **Aucune vérification à la déclaration.** Un secret faux est scellé comme un bon ; il se révèle
   au premier appel (`FOURNISSEUR_A_REFUSE`). Demander un jeton à la déclaration le prouverait —
   au prix d'un appel sortant déclenché par une route d'administration.
4. **En production, Money Vibes doit déclarer son raccordement AVANT la mise en service de cette
   version**, sinon ses demandes poussées sont refusées à l'émission (c'est le comportement voulu,
   et c'est ce que la recette a mesuré).

## Notes

- Voir [[STORY-243]] (le coffre, le lien, les gardes de sources), [[STORY-246]] (la clé marchande par
  organisation, le même raisonnement pour FedaPay), [[STORY-652]] (la clé d'API, alors propriété du
  raccordement unique), [[STORY-662]] (l'émission), [[STORY-665]] (la clef de notification),
  [[STORY-667]] et [[STORY-669]], qui l'attendent.
- ⚠️ **Deux points à trancher, portés dans la fiche plutôt que dans le code** : le droit retenu
  (`paiement:compte:administrer` plutôt qu'un huitième droit — même rayon de souffle, aucun droit de
  tenant nouveau à faire attribuer par l'IdP), et le fait que le participant reste **en clair** alors
  que le plan annonçait les quatre valeurs scellées.
