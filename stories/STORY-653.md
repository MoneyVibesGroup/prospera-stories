# STORY-653 : Le corps de la demande de paiement — un commentaire qui doutait n'est pas une garde, et le refus nommait le contrat du voisin

Status: ready-for-dev

**Épic :** EPIC-036 — Fournisseurs de paiement interchangeables et simultanés
**Service :** `paiement-service`
**Points :** 3 · **Sprint :** ⚠️ **NON SLOTTÉE** — elle bloque le premier encaissement réel sur le schéma.
**Prérequis :** **STORY-600** (l'adaptateur), **STORY-652** (la clé d'API, sans laquelle aucun appel n'atteignait la couche métier)
**Origine :** essai réel contre le simulateur de la BCEAO le **2026-09-09**, une fois la clé d'API posée. Le premier appel qui franchit les deux portes est celui qui a montré le défaut.

---

## Le fait

`POST /demandes-paiements` refuse le corps que l'adaptateur envoie. Tant que la clé d'API manquait,
la passerelle refusait avant l'application : **le défaut était caché derrière un autre défaut.**

⛔⛔ **ET STORY-600 LE SAVAIT.** Son code porte, en toutes lettres, ce commentaire :

> ⚠️ **`montant` : nom à confirmer sur le bac à sable.** Les deux points de terminaison frères — la
> demande en masse et le paiement envoyé — le nomment ainsi ; les filtres de la liste parlent, eux,
> de `montantAchat` et de `montantRetrait`. La page de la demande unitaire n'expose pas son corps.

Un doute honnête, écrit à l'endroit exact où il se poserait. Et il est resté un **commentaire**.
⚡ **Un commentaire qui doute ne rougit jamais** : rien dans les 3 263 tests unitaires ni dans les
252 recettes de bout en bout ne pouvait le trancher, parce que tous parlent à un double qui accepte
ce qu'on lui donne. **Seul un appel réel est une garde sur le contrat d'un tiers.**

⚡⚡ **LE REFUS DU SCHÉMA NOMMAIT LES CHAMPS DU CONTRAT VOISIN, ET C'EST LE VRAI PIÈGE.** Le point de
terminaison valide en `anyOf` sur plusieurs formes. Une erreur sous `anyOf` énumère les exigences
**non satisfaites de chaque branche**, donc elle décrit **plusieurs contrats à la fois**. Le premier
refus réclamait `montantAchat`, `montantRetrait`, `debitDiffere` et `dateLimitePaiement` — quatre
champs dont notre forme n'a **aucun** besoin. Lu comme un contrat unique, il conduisait tout droit à
réécrire le corps sur la mauvaise branche. La lecture juste se fait **par soustraction** : on fixe
une branche, et on regarde quelles exigences **disparaissent**.

⚡ **Et le défaut réel tenait à UNE valeur.** En isolant la branche, il reste un seul refus :
`categorie` n'appartient pas à l'ensemble autorisé. Avec une valeur acceptée, la requête **franchit
la validation et atteint la couche métier**, où elle échoue proprement sur l'alias inconnu. La forme
du corps était donc juste ; c'est son contenu qui ne l'était pas.

## Critères d'acceptation

- [ ] AC-1 — La catégorie envoyée appartient à l'**ensemble fermé que le schéma accepte**, et c'est
      une constante nommée qui dit **ce qu'elle désigne**, pas un nombre nu. Un test l'épingle. ⚠️ Le
      choix de la valeur ne se fait pas au hasard parmi les acceptées : il se justifie par ce que le
      schéma en dit — voir « Ce qui reste à trancher ».
- [ ] AC-2 — ⛔ **Le reste du corps ne change pas.** La forme était juste : `montant`,
      `confirmation`, `motif` et la date limite facultative sont acceptés tels quels. Une story de
      correction qui réécrit ce qui marchait déjà transformerait un défaut d'une ligne en risque de
      régression sur tout le canal.
- [ ] AC-3 — ⛔⛔ **UN `400` SUR NOTRE PROPRE CORPS N'EST PAS UN REFUS MÉTIER, ET NE DOIT PLUS SE
      LIRE COMME TEL.** Aujourd'hui tout statut non favorable devient `FOURNISSEUR_A_REFUSE`, dont
      le message envoie l'exploitant chercher une cause **chez le payeur ou chez le participant**.
      Or un `400` de validation dit que **notre requête est malformée** : c'est un défaut de code,
      et le seul remède est un correctif. Il lui faut son propre code et son propre message. ⚠️ Sans
      divulguer le corps ni l'alias dans le journal (STORY-243, STORY-246) : ce qu'on consigne, ce
      sont les **noms de champs** que le schéma a cités, jamais les valeurs.
- [ ] AC-4 — Une **recette d'appel réel** rejouable est versionnée, hors des suites automatiques :
      elle prend ses identifiants de l'environnement, ne crée rien, et dit en clair ce qu'elle
      prouve. ⚠️ Elle ne rejoint **aucune** suite lancée par `npm test` : une recette qui dépend d'un
      tiers joignable rendrait la chaîne rouge le jour où le bac à sable tombe, et elle serait
      désactivée le jour même.
- [ ] AC-5 — **Non-régression** : la garde anti-condition d'environnement de STORY-246 reste
      applicable telle quelle, et l'adaptateur FedaPay est inchangé.

## Ce qui sera facile à rater

1. ⛔⛔ **Réécrire le corps sur la branche `montantAchat` / `montantRetrait` / `debitDiffere`.**
      C'est ce que le premier message d'erreur suggère, et c'est faux : ces champs décrivent un
      achat ou un retrait d'espèces, pas la demande de paiement d'une facture. Les ajouter fait
      d'ailleurs **refuser** notre branche, qui les traite en propriétés interdites.
2. ⚠️ **Croire qu'un test de plus aurait suffi.** Aucun double ne connaît le contrat d'un tiers. Ce
      qui manquait n'était pas une assertion, c'était **un appel**.
3. ⛔ **Faire remonter le corps du refus dans le journal pour « pouvoir déboguer ».** Le corps porte
      l'alias, qui est le secret scellé du compte (STORY-243). On consigne les **noms** de champs
      refusés, jamais leurs valeurs.
4. ⚠️ **Traiter le `400` comme réessayable.** Une requête malformée le restera à l'identique : la
      réessayer occupe le participant et retarde le remède.

## Ce qui reste à trancher, et qui demande la documentation

- ⛔ **La SÉMANTIQUE des catégories acceptées.** L'appel réel dit lesquelles le schéma accepte ; il
      ne dit pas laquelle désigne le paiement d'une facture. Choisir par élimination serait deviner
      sur un chemin d'argent. ⚡ Rappel de STORY-600 : l'écart n'est pas cosmétique — le schéma
      plafonne la date limite d'une demande **e-commerce** à trois minutes, quand le lien d'une
      créance vit des jours (FR-P15). Se tromper de catégorie ferait expirer la demande avant que le
      payeur ait ouvert son courriel.
- ⛔ **La route d'enrôlement d'une adresse de paiement.** Le jeton porte `alias.write` et
      `alias.read`, mais aucune des six formes essayées n'existe. Sans elle, aucune recette de bout
      en bout ne peut aller jusqu'à une demande **acceptée** : il faut deux adresses enrôlées, celle
      du compte qui encaisse et celle d'un payeur.

## Notes

- Voir [[STORY-600]] (l'adaptateur et le doute qu'il portait), [[STORY-652]] (la clé d'API),
  [[STORY-243]] (l'alias est le secret scellé du compte), [[STORY-246]] (ce qui sort d'un échec de
  fournisseur), [[STORY-599]] (la destination en triplet).
- ⚡ **Fait glané à l'essai réel** : `GET /comptes` rend le compte du client business enrôlé —
  numéro, type, date d'ouverture, statut. C'est la source du `numeroDeCompte` de la destination, et
  elle évite de le saisir à la main.
