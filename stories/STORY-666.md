# STORY-666 : Le raccordement PI-SPI par organisation — Money Vibes n'appelle jamais pour autrui

Status: in-progress

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

- [ ] AC-1 — Une organisation déclare son raccordement au schéma : identifiant client, secret,
      clé d'API, code du participant. Droit `paiement:compte:administrer` (celui qui gouverne déjà
      « où l'argent d'une organisation arrive », FR-P59), gate d'AD-16, trace au journal chaîné.
- [ ] AC-2 — ⛔ **Le secret et la clé d'API sont SCELLÉS** (STORY-243), sous un lien qui nomme
      l'organisation et le genre du secret ; aucune route ne les restitue, aucun `toJSON` ne les
      sérialise, et un dump n'en livre aucun. L'identifiant client et le participant restent **en
      clair** : le critère est *ce que la fuite permettrait*, et ces deux-là ne permettent rien —
      l'un identifie, l'autre est déjà publié sur chaque compte du schéma.
- [ ] AC-3 — ⛔⛔ **L'adaptateur n'appelle plus JAMAIS sous les variables d'environnement.** Il exige
      le raccordement **de l'organisation de la demande** ; une organisation qui n'en a pas ne pousse
      rien, avec un refus nommé qui dit quoi faire. **Aucun repli sur le raccordement de la
      plateforme** : un repli, c'est NFR-1 violé par défaut, en silence.
- [ ] AC-4 — Money Vibes déclare le sien **par la même route**, comme n'importe quelle organisation
      (leçon STORY-601/289 : elle est une organisation comme une autre). Les variables
      d'environnement du client cessent d'être lues ; celles de l'environnement (origine, URL des
      jetons, préfixe de portée) restent.
- [ ] AC-5 — `/health` continue de nommer ce qui manque **sans nommer personne** : le raccordement
      n'étant plus global, l'indicateur ne peut plus dire « incomplet » pour tout le monde. Il dit ce
      qui manque à l'**environnement**, jamais l'état du raccordement d'une organisation — sinon une
      route publique apprendrait qui est raccordé.
- [ ] AC-6 — Le participant déclaré par le raccordement et celui du compte d'encaissement doivent
      **concorder** (contrôle existant de STORY-662, qui change de source) : un compte tenu par un
      établissement que ce raccordement ne sert pas ne reçoit aucune demande.
- [ ] AC-7 — Recette **réelle** : Money Vibes déclare son raccordement par l'API, une demande part
      chez le schéma sous ce raccordement, et une organisation **sans** raccordement se voit refuser
      l'émission par le refus nommé — pas par une panne.

## Ce que cette story ne fait pas

- Elle **ne déclare pas** le webhook chez le schéma pour l'organisation : la clef de notification se
  dépose déjà par [[STORY-665]], et l'URL de rappel porte l'identifiant du compte.
- Elle **ne touche pas** FedaPay : sa clé marchande est déjà par organisation depuis [[STORY-246]].
- Elle **n'ouvre aucun écran** : la console est STORY-286.

## Notes

- Voir [[STORY-243]] (le coffre, le lien, les gardes de sources), [[STORY-246]] (la clé marchande par
  organisation, le même raisonnement pour FedaPay), [[STORY-652]] (la clé d'API, alors propriété du
  raccordement unique), [[STORY-662]] (l'émission), [[STORY-665]] (la clef de notification),
  [[STORY-667]] et [[STORY-669]], qui l'attendent.
- ⚠️ **Deux points à trancher, portés dans la fiche plutôt que dans le code** : le droit retenu
  (`paiement:compte:administrer` plutôt qu'un huitième droit — même rayon de souffle, aucun droit de
  tenant nouveau à faire attribuer par l'IdP), et le fait que le participant reste **en clair** alors
  que le plan annonçait les quatre valeurs scellées.
